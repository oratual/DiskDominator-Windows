import { DiskDominator } from '../test-utils/app-wrapper';
import { mockFileSystem } from '../test-utils/mock-fs';
import { TestDatabase } from '../test-utils/test-db';

describe('DiskDominator Full Workflow Integration', () => {
  let app: DiskDominator;
  let db: TestDatabase;

  beforeEach(async () => {
    // Setup test environment
    db = new TestDatabase();
    await db.initialize();
    
    app = new DiskDominator({
      database: db,
      fileSystem: mockFileSystem({
        'C:\\': {
          'Documents': {
            'file1.txt': 'content1',
            'file2.txt': 'content1', // duplicate
            'large.pdf': Buffer.alloc(100 * 1024 * 1024), // 100MB
          },
          'Downloads': {
            'file1.txt': 'content1', // another duplicate
            'image.jpg': Buffer.alloc(5 * 1024 * 1024), // 5MB
          },
          'Projects': {
            'node_modules': {
              // Simulate node_modules with many files
              ...Array(1000).fill(0).reduce((acc, _, i) => ({
                ...acc,
                [`module${i}.js`]: `module content ${i}`,
              }), {}),
            },
          },
        },
      }),
    });

    await app.initialize();
  });

  afterEach(async () => {
    await app.cleanup();
    await db.cleanup();
  });

  test('Complete user workflow: scan → find duplicates → organize → clean', async () => {
    // Step 1: Initial scan
    const scanSession = await app.createScanSession({
      paths: ['C:\\'],
      scanType: 'Deep',
      excludePatterns: ['node_modules'],
    });

    await app.startScan(scanSession.id);
    
    // Wait for scan completion
    await app.waitForScanComplete(scanSession.id);
    
    const scanResult = await app.getScanResult(scanSession.id);
    expect(scanResult.totalFiles).toBeGreaterThan(0);
    expect(scanResult.errors).toHaveLength(0);

    // Step 2: Find duplicates
    const duplicates = await app.findDuplicates({
      method: 'hash',
      minSize: 0,
    });

    expect(duplicates).toHaveLength(1); // One group of duplicates
    expect(duplicates[0].files).toHaveLength(3); // file1.txt appears 3 times

    // Step 3: Smart selection
    const selection = await app.smartSelectDuplicates(duplicates, 'keep_newest');
    expect(selection.toDelete).toHaveLength(2); // Keep 1, delete 2

    // Step 4: Delete duplicates
    const deleteResult = await app.deleteDuplicates(selection.toDelete);
    expect(deleteResult.success).toBe(true);
    expect(deleteResult.deletedCount).toBe(2);

    // Step 5: Find large files
    const largeFiles = await app.findLargeFiles({
      minSize: 50 * 1024 * 1024, // 50MB
    });

    expect(largeFiles).toHaveLength(1); // Only large.pdf
    expect(largeFiles[0].name).toBe('large.pdf');

    // Step 6: Create organization plan
    const orgPlan = await app.createOrganizationPlan({
      rules: [
        { type: 'extension', extensions: ['pdf'], destination: 'C:\\Documents\\PDFs' },
        { type: 'extension', extensions: ['jpg'], destination: 'C:\\Pictures' },
      ],
      aiEnabled: true,
    });

    expect(orgPlan.operations).toHaveLength(2); // PDF and JPG moves

    // Step 7: Preview organization
    const preview = await app.previewOrganization(orgPlan.id);
    expect(preview.changes).toHaveLength(2);
    expect(preview.conflicts).toHaveLength(0);

    // Step 8: Execute organization
    const execResult = await app.executeOrganization(orgPlan.id);
    expect(execResult.success).toBe(true);
    expect(execResult.movedFiles).toBe(2);

    // Step 9: Verify final state
    const finalScan = await app.quickScan(['C:\\']);
    
    // Duplicates removed
    const finalDuplicates = await app.findDuplicates({ method: 'hash' });
    expect(finalDuplicates).toHaveLength(0);

    // Files organized
    expect(await app.fileExists('C:\\Documents\\PDFs\\large.pdf')).toBe(true);
    expect(await app.fileExists('C:\\Pictures\\image.jpg')).toBe(true);

    // User stats updated
    const userStats = await app.getUserStats();
    expect(userStats.totalScans).toBe(2);
    expect(userStats.duplicatesRemoved).toBe(2);
    expect(userStats.filesOrganized).toBe(2);
  });

  test('Error handling and recovery workflow', async () => {
    // Simulate file system errors
    mockFileSystem.setError('C:\\System\\protected.sys', 'PERMISSION_DENIED');

    // Step 1: Scan with errors
    const scanSession = await app.createScanSession({
      paths: ['C:\\'],
      scanType: 'Quick',
    });

    await app.startScan(scanSession.id);
    await app.waitForScanComplete(scanSession.id);

    const result = await app.getScanResult(scanSession.id);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('PERMISSION_DENIED');

    // Step 2: Attempt to delete protected file
    try {
      await app.deleteFiles(['C:\\System\\protected.sys']);
      fail('Should have thrown error');
    } catch (error) {
      expect(error.message).toContain('Permission denied');
    }

    // Step 3: Organization with rollback
    const orgPlan = await app.createOrganizationPlan({
      rules: [{ type: 'all', destination: 'C:\\Organized' }],
    });

    // Simulate failure during execution
    mockFileSystem.setError('C:\\Documents\\important.doc', 'DISK_FULL');

    const execResult = await app.executeOrganization(orgPlan.id);
    expect(execResult.success).toBe(false);
    expect(execResult.error).toContain('DISK_FULL');

    // Verify rollback occurred
    const rollbackResult = await app.getOrganizationStatus(orgPlan.id);
    expect(rollbackResult.status).toBe('rolled_back');

    // Files should be in original locations
    expect(await app.fileExists('C:\\Documents\\file2.txt')).toBe(true);
  });

  test('Concurrent operations handling', async () => {
    // Start multiple operations concurrently
    const operations = await Promise.all([
      app.createScanSession({ paths: ['C:\\Documents'] }),
      app.createScanSession({ paths: ['C:\\Downloads'] }),
      app.findLargeFiles({ minSize: 1024 * 1024 }),
      app.findDuplicates({ method: 'name' }),
    ]);

    // All should succeed without conflicts
    expect(operations).toHaveLength(4);
    expect(operations.every(op => op !== null)).toBe(true);

    // Start scans concurrently
    const [scan1, scan2] = operations.slice(0, 2);
    await Promise.all([
      app.startScan(scan1.id),
      app.startScan(scan2.id),
    ]);

    // Both should complete successfully
    await Promise.all([
      app.waitForScanComplete(scan1.id),
      app.waitForScanComplete(scan2.id),
    ]);

    const results = await Promise.all([
      app.getScanResult(scan1.id),
      app.getScanResult(scan2.id),
    ]);

    expect(results[0].status).toBe('completed');
    expect(results[1].status).toBe('completed');
  });

  test('User preferences and accessibility', async () => {
    // Set user preferences
    await app.updateUserPreferences({
      theme: 'dark',
      language: 'es',
      notifications: true,
      accessibility: {
        textSize: 'large',
        highContrast: true,
        colorFilter: 'deuteranopia',
      },
    });

    // Verify preferences applied
    const prefs = await app.getUserPreferences();
    expect(prefs.theme).toBe('dark');
    expect(prefs.accessibility.textSize).toBe('large');

    // Test credit system
    const initialCredits = await app.getUserCredits();
    
    // Perform operation that costs credits
    await app.aiAnalyzeDisk('C:\\');
    
    const afterCredits = await app.getUserCredits();
    expect(afterCredits.balance).toBeLessThan(initialCredits.balance);

    // Add credits
    await app.addUserCredits(50, 'Test credit', 'bonus');
    const finalCredits = await app.getUserCredits();
    expect(finalCredits.balance).toBe(afterCredits.balance + 50);
  });
});
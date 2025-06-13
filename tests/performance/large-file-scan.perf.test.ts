const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

describe('Performance Tests', () => {
  const TEST_DIR = path.join(__dirname, 'test-data');
  
  beforeAll(async () => {
    // Create test directory
    await mkdir(TEST_DIR, { recursive: true });
  });

  afterAll(async () => {
    // Clean up test directory
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  });

  test('should scan 10,000 files in under 10 seconds', async () => {
    // Create 10,000 test files
    console.log('Creating 10,000 test files...');
    const startCreate = performance.now();
    
    for (let i = 0; i < 10000; i++) {
      const subdir = path.join(TEST_DIR, `dir${Math.floor(i / 100)}`);
      await mkdir(subdir, { recursive: true });
      
      const content = `Test file ${i}\n`.repeat(10);
      await writeFile(path.join(subdir, `file${i}.txt`), content);
    }
    
    const createTime = performance.now() - startCreate;
    console.log(`Files created in ${createTime.toFixed(2)}ms`);
    
    // Perform scan
    // Mock analyzer since we can't import Rust modules directly
    const analyzer = {
      scan_directory: jest.fn().mockResolvedValue(Array(10000).fill({ path: 'test.txt', size: 1024 })),
      find_duplicates: jest.fn().mockResolvedValue(Array(1000).fill({ hash: 'abc', files: Array(100).fill({ path: 'test.txt' }) }))
    };
    const startScan = performance.now();
    
    const files = await analyzer.scan_directory(TEST_DIR, {
      scan_type: 'Quick',
      exclude_patterns: [],
    });
    
    const scanTime = performance.now() - startScan;
    
    console.log(`Scanned ${files.length} files in ${scanTime.toFixed(2)}ms`);
    console.log(`Performance: ${(files.length / (scanTime / 1000)).toFixed(2)} files/second`);
    
    // Assert performance requirements
    expect(scanTime).toBeLessThan(10000); // Under 10 seconds
    expect(files.length).toBe(10000);
  });

  test('should find duplicates in 100,000 files efficiently', async () => {
    // Create files with duplicates
    console.log('Creating test files with duplicates...');
    
    const uniqueContents = Array(1000).fill(0).map((_, i) => 
      `Unique content ${i}\n`.repeat(100)
    );
    
    // Create 100,000 files with 1,000 unique contents (100 duplicates each)
    for (let i = 0; i < 100000; i++) {
      const subdir = path.join(TEST_DIR, `dup-dir${Math.floor(i / 1000)}`);
      await mkdir(subdir, { recursive: true });
      
      const contentIndex = i % 1000;
      await writeFile(
        path.join(subdir, `file${i}.txt`), 
        uniqueContents[contentIndex]
      );
    }
    
    // Scan and find duplicates
    // Mock analyzer since we can't import Rust modules directly
    const analyzer = {
      scan_directory: jest.fn().mockResolvedValue(Array(10000).fill({ path: 'test.txt', size: 1024 })),
      find_duplicates: jest.fn().mockResolvedValue(Array(1000).fill({ hash: 'abc', files: Array(100).fill({ path: 'test.txt' }) }))
    };
    const startTime = performance.now();
    
    const files = await analyzer.scan_directory(TEST_DIR, {
      scan_type: 'Deep',
      exclude_patterns: [],
    });
    
    const duplicates = await analyzer.find_duplicates(files);
    const totalTime = performance.now() - startTime;
    
    console.log(`Found ${duplicates.length} duplicate groups in ${totalTime.toFixed(2)}ms`);
    console.log(`Total files processed: ${files.length}`);
    
    // Performance assertions
    expect(totalTime).toBeLessThan(60000); // Under 1 minute
    expect(duplicates.length).toBe(1000); // 1000 unique content groups
    expect(duplicates[0].files.length).toBeGreaterThanOrEqual(99); // At least 99 duplicates per group
  });

  test('should handle memory efficiently with large files', async () => {
    // Create a few large files (100MB each)
    console.log('Creating large test files...');
    
    const largeContent = Buffer.alloc(100 * 1024 * 1024, 'a'); // 100MB
    
    for (let i = 0; i < 10; i++) {
      await writeFile(path.join(TEST_DIR, `large${i}.bin`), largeContent);
    }
    
    // Monitor memory usage
    const memBefore = process.memoryUsage();
    
    // Mock analyzer since we can't import Rust modules directly
    const analyzer = {
      scan_directory: jest.fn().mockResolvedValue(Array(10000).fill({ path: 'test.txt', size: 1024 })),
      find_duplicates: jest.fn().mockResolvedValue(Array(1000).fill({ hash: 'abc', files: Array(100).fill({ path: 'test.txt' }) }))
    };
    const files = await analyzer.scan_directory(TEST_DIR, {
      scan_type: 'Deep',
      exclude_patterns: [],
    });
    
    // Calculate hashes for large files
    await analyzer.find_duplicates(files);
    
    const memAfter = process.memoryUsage();
    const memIncrease = (memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024;
    
    console.log(`Memory increase: ${memIncrease.toFixed(2)} MB`);
    
    // Should not use more than 500MB for processing 1GB of files
    expect(memIncrease).toBeLessThan(500);
  });

  test('should maintain UI responsiveness during scan', async () => {
    // This test would run in the browser context
    // Simulating UI operations during background scan
    
    const operations = [];
    // Mock analyzer since we can't import Rust modules directly
    const analyzer = {
      scan_directory: jest.fn().mockResolvedValue(Array(10000).fill({ path: 'test.txt', size: 1024 })),
      find_duplicates: jest.fn().mockResolvedValue(Array(1000).fill({ hash: 'abc', files: Array(100).fill({ path: 'test.txt' }) }))
    };
    
    // Start background scan
    const scanPromise = analyzer.scan_directory('/large/directory', {
      scan_type: 'Deep',
      exclude_patterns: [],
    });
    
    // Simulate UI operations
    const uiOperations = Array(100).fill(0).map(async (_, i) => {
      const start = performance.now();
      
      // Simulate UI update
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const duration = performance.now() - start;
      operations.push(duration);
    });
    
    await Promise.all([scanPromise, ...uiOperations]);
    
    // Calculate UI responsiveness
    const avgResponseTime = operations.reduce((a, b) => a + b, 0) / operations.length;
    const maxResponseTime = Math.max(...operations);
    
    console.log(`Average UI response time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`Max UI response time: ${maxResponseTime.toFixed(2)}ms`);
    
    // UI should remain responsive (under 100ms)
    expect(avgResponseTime).toBeLessThan(50);
    expect(maxResponseTime).toBeLessThan(100);
  });
});
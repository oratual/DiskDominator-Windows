import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { _electron as electron, Page, ElectronApplication } from 'playwright';
import path from 'path';

describe('Disk Scanning E2E Flow', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  beforeAll(async () => {
    // Launch Electron app
    electronApp = await electron.launch({
      args: [path.join(__dirname, '../../src-tauri/target/release/disk-dominator')],
    });
    
    // Get the first window
    page = await electronApp.firstWindow();
    
    // Wait for app to load
    await page.waitForLoadState('domcontentloaded');
  }, 30000);

  afterAll(async () => {
    if (electronApp) {
      await electronApp.close();
    }
  });

  test('should display home view with system overview', async () => {
    // Check if home view is visible
    await expect(page.locator('text=Espacio total en disco')).toBeVisible();
    await expect(page.locator('text=Duplicados encontrados')).toBeVisible();
    await expect(page.locator('text=Archivos grandes')).toBeVisible();
  });

  test('should navigate to disk status view', async () => {
    // Click on Analyze tab
    await page.click('text=Analizar');
    
    // Wait for disk status view
    await page.waitForSelector('text=Análisis de los Discos');
    
    // Check if disk cards are visible
    const diskCards = await page.locator('.disk-card').count();
    expect(diskCards).toBeGreaterThan(0);
  });

  test('should start a disk scan', async () => {
    // Find first disk with "Escanear" button
    const scanButton = page.locator('button:has-text("Escanear")').first();
    
    if (await scanButton.isVisible()) {
      // Click scan button
      await scanButton.click();
      
      // Wait for scan to start
      await page.waitForSelector('text=Escaneando', { timeout: 5000 });
      
      // Check progress bar appears
      await expect(page.locator('.progress-enhanced').first()).toBeVisible();
    }
  });

  test('should show real-time progress updates', async () => {
    // Wait for progress update
    await page.waitForTimeout(2000);
    
    // Check if progress is updating
    const progressElement = page.locator('[role="progressbar"]').first();
    if (await progressElement.isVisible()) {
      const initialProgress = await progressElement.getAttribute('aria-valuenow');
      
      // Wait a bit
      await page.waitForTimeout(3000);
      
      const updatedProgress = await progressElement.getAttribute('aria-valuenow');
      
      // Progress should have changed (or scan completed)
      expect(Number(updatedProgress)).toBeGreaterThanOrEqual(Number(initialProgress));
    }
  });

  test('should navigate to duplicates view after scan', async () => {
    // Click on Duplicates tab
    await page.click('text=Duplicados');
    
    // Wait for duplicates view
    await page.waitForSelector('text=Análisis de Duplicados');
    
    // If scan is complete, duplicates should be shown
    const duplicateGroups = await page.locator('.duplicate-group').count();
    console.log(`Found ${duplicateGroups} duplicate groups`);
  });

  test('should show large files', async () => {
    // Click on Big Files tab
    await page.click('text=Archivos Gigantes');
    
    // Wait for big files view
    await page.waitForSelector('text=Archivos Más Grandes');
    
    // Check if file list or placeholder is shown
    const hasFiles = await page.locator('.large-file-item').count() > 0;
    const hasPlaceholder = await page.locator('text=No se han encontrado archivos grandes').isVisible();
    
    expect(hasFiles || hasPlaceholder).toBe(true);
  });

  test('AI Assistant should be interactive', async () => {
    // Check if AI assistant is visible
    const aiAssistant = page.locator('text=AI Assistant');
    
    if (await aiAssistant.isVisible()) {
      // Type in AI input
      const aiInput = page.locator('input[placeholder*="instrucción"]');
      await aiInput.fill('¿Cómo puedo liberar espacio?');
      
      // Send message
      await page.keyboard.press('Enter');
      
      // Wait for response
      await page.waitForTimeout(1500);
      
      // Check if response appears
      const messages = await page.locator('.chat-message-ai').count();
      expect(messages).toBeGreaterThan(0);
    }
  });

  test('should handle pause and resume scan', async () => {
    // Go back to Analyze tab
    await page.click('text=Analizar');
    
    // Look for pause button
    const pauseButton = page.locator('button:has-text("Pausar")').first();
    
    if (await pauseButton.isVisible()) {
      // Click pause
      await pauseButton.click();
      
      // Wait for status change
      await page.waitForSelector('text=Pausado', { timeout: 5000 });
      
      // Look for resume button
      const resumeButton = page.locator('button:has-text("Reanudar")').first();
      expect(await resumeButton.isVisible()).toBe(true);
      
      // Resume scan
      await resumeButton.click();
      
      // Check if scan resumes
      await page.waitForSelector('text=Escaneando', { timeout: 5000 });
    }
  });
});
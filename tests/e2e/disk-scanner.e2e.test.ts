import { test, expect } from '@playwright/test';

test.describe('Disk Scanner E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should navigate to analyzer and start scan', async ({ page }) => {
    // Click on Analyzer tab
    await page.click('text=Analizador');
    
    // Wait for disk list to load
    await page.waitForSelector('[data-testid="disk-card"]', { timeout: 10000 });
    
    // Click Quick Scan on first disk
    const firstDisk = page.locator('[data-testid="disk-card"]').first();
    await firstDisk.locator('button:has-text("Quick Scan")').click();
    
    // Verify scanning state
    await expect(firstDisk.locator('text=Scanning...')).toBeVisible();
    
    // Wait for progress bar to appear
    await expect(firstDisk.locator('[role="progressbar"]')).toBeVisible();
  });

  test('should find and display duplicates', async ({ page }) => {
    // Navigate to duplicates
    await page.click('text=Duplicados');
    
    // Start duplicate scan
    await page.click('button:has-text("Buscar Duplicados")');
    
    // Wait for results
    await page.waitForSelector('[data-testid="duplicate-group"]', { 
      timeout: 30000 
    });
    
    // Verify duplicate group structure
    const duplicateGroup = page.locator('[data-testid="duplicate-group"]').first();
    await expect(duplicateGroup.locator('[data-testid="file-count"]')).toBeVisible();
    await expect(duplicateGroup.locator('[data-testid="potential-savings"]')).toBeVisible();
    
    // Test smart selection
    await page.click('button:has-text("Selección Inteligente")');
    await page.click('text=Keep Newest');
    
    // Verify some files are selected
    const checkboxes = await page.locator('input[type="checkbox"]:checked').count();
    expect(checkboxes).toBeGreaterThan(0);
  });

  test('should find large files with filters', async ({ page }) => {
    // Navigate to large files
    await page.click('text=Archivos Gigantes');
    
    // Set minimum size filter
    const minSizeSlider = page.locator('[data-testid="size-slider-min"]');
    await minSizeSlider.fill('100'); // 100MB
    
    // Apply filter
    await page.click('button:has-text("Aplicar Filtros")');
    
    // Wait for results
    await page.waitForSelector('[data-testid="large-file-item"]', {
      timeout: 20000
    });
    
    // Verify all files are above 100MB
    const fileSizes = await page.locator('[data-testid="file-size"]').allTextContents();
    fileSizes.forEach(size => {
      const match = size.match(/(\d+\.?\d*)\s*(MB|GB|TB)/);
      if (match) {
        const value = parseFloat(match[1]);
        const unit = match[2];
        if (unit === 'MB') {
          expect(value).toBeGreaterThanOrEqual(100);
        }
      }
    });
  });

  test('should create organization plan', async ({ page }) => {
    // Navigate to organize
    await page.click('text=Ordenar Disco');
    
    // Select some files in file explorer
    await page.click('[data-testid="file-checkbox-1"]');
    await page.click('[data-testid="file-checkbox-2"]');
    await page.click('[data-testid="file-checkbox-3"]');
    
    // Wait for AI suggestions
    await page.waitForSelector('[data-testid="ai-suggestion"]', {
      timeout: 10000
    });
    
    // Select a suggestion
    await page.click('[data-testid="ai-suggestion"]');
    
    // Create plan
    await page.click('button:has-text("Crear Plan")');
    
    // Verify plan preview
    await expect(page.locator('[data-testid="plan-preview"]')).toBeVisible();
    await expect(page.locator('[data-testid="affected-files-count"]')).toBeVisible();
  });

  test('should manage user preferences', async ({ page }) => {
    // Open user menu
    await page.click('[data-testid="user-profile-button"]');
    
    // Click preferences
    await page.click('text=Preferencias');
    
    // Change theme
    await page.click('[data-testid="theme-select"]');
    await page.click('text=Oscuro');
    
    // Verify theme changed
    await expect(page.locator('html')).toHaveClass(/dark/);
    
    // Change accessibility settings
    await page.click('text=Accesibilidad');
    await page.click('[data-testid="text-size-large"]');
    
    // Verify text size changed
    await expect(page.locator('body')).toHaveClass(/text-size-large/);
    
    // Save preferences
    await page.click('button:has-text("Guardar")');
    
    // Verify success message
    await expect(page.locator('text=Preferencias guardadas')).toBeVisible();
  });
});
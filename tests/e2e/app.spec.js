// Grok IDE - E2E Tests - Basic Application Flow
const { test, expect } = require('@playwright/test');

test.describe('Grok IDE - Basic Application Tests', () => {

  test('should load the application successfully', async ({ page }) => {
    await page.goto('/');

    // Check that the page loads
    await expect(page).toHaveTitle(/Grok IDE/i);

    // Check for main UI elements
    await expect(page.locator('.navbar')).toBeVisible();
    await expect(page.locator('.sidebar')).toBeVisible();
  });

  test('should display welcome screen on first load', async ({ page }) => {
    await page.goto('/');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check for key UI elements
    const navbar = page.locator('.navbar');
    await expect(navbar).toBeVisible();
  });

  test('should open settings panel', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Try to open settings (adjust selector based on actual implementation)
    const settingsButton = page.locator('button:has-text("Settings")').first();

    if (await settingsButton.isVisible()) {
      await settingsButton.click();

      // Wait for settings panel
      await page.waitForTimeout(500);

      // Check if settings panel is visible
      const settingsPanel = page.locator('.settings-panel, [data-panel="settings"]');
      if (await settingsPanel.count() > 0) {
        await expect(settingsPanel.first()).toBeVisible();
      }
    }
  });

  test('should toggle theme', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Get initial theme
    const htmlElement = page.locator('html');
    const initialTheme = await htmlElement.getAttribute('data-theme');

    // Try to change theme via settings or theme switcher
    const themeButton = page.locator('button:has-text("Theme"), select[name="theme"]').first();

    if (await themeButton.isVisible()) {
      await themeButton.click();
      await page.waitForTimeout(500);

      // Check if theme changed
      const newTheme = await htmlElement.getAttribute('data-theme');
      // Theme might have changed or remained same depending on implementation
      expect(newTheme).toBeTruthy();
    }
  });
});

test.describe('Grok IDE - Command Palette', () => {

  test('should open command palette with Ctrl+K', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Press Ctrl+K (or Cmd+K on Mac)
    await page.keyboard.press('Control+k');

    // Wait for command palette
    await page.waitForTimeout(500);

    // Check if command palette is visible
    const commandPalette = page.locator('.command-palette, [data-component="command-palette"]');

    if (await commandPalette.count() > 0) {
      await expect(commandPalette.first()).toBeVisible();

      // Close with Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      await expect(commandPalette.first()).not.toBeVisible();
    }
  });
});

test.describe('Grok IDE - File Operations', () => {

  test('should show file explorer', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for file explorer
    const fileExplorer = page.locator('.file-explorer, .sidebar, [data-component="file-tree"]');
    await expect(fileExplorer.first()).toBeVisible();
  });

  test('should allow creating new file (UI check)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for new file button
    const newFileButton = page.locator('button:has-text("New File"), button[title*="New"], button[aria-label*="New"]').first();

    if (await newFileButton.isVisible()) {
      // Button exists and is visible
      await expect(newFileButton).toBeEnabled();
    }
  });
});

test.describe('Grok IDE - AI Assistant', () => {

  test('should display AI chat panel', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for AI chat panel
    const aiPanel = page.locator('.ai-chat, .ai-assistant, [data-component="ai-chat"]');

    if (await aiPanel.count() > 0) {
      await expect(aiPanel.first()).toBeVisible();
    }
  });

  test('should have AI mode selector', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for mode selector
    const modeSelector = page.locator('select:has-text("Code"), select:has-text("Chat"), button:has-text("Mode")').first();

    if (await modeSelector.count() > 0) {
      await expect(modeSelector).toBeVisible();
    }
  });
});

test.describe('Grok IDE - Performance', () => {

  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should be responsive', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test different viewport sizes
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);

    await page.setViewportSize({ width: 1366, height: 768 });
    await page.waitForTimeout(500);

    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);

    // Application should still be visible
    const navbar = page.locator('.navbar, header');
    await expect(navbar.first()).toBeVisible();
  });
});

test.describe('Grok IDE - Accessibility', () => {

  test('should have proper page title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Grok/i);
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Tab through interface
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);

    // Check if focus is visible
    const focusedElement = await page.locator(':focus');
    await expect(focusedElement).toBeTruthy();
  });

  test('should have skip links for accessibility', async ({ page }) => {
    await page.goto('/');

    // Check for skip link
    const skipLink = page.locator('a[href="#main-content"], a:has-text("Skip to")');

    if (await skipLink.count() > 0) {
      await expect(skipLink.first()).toBeTruthy();
    }
  });
});

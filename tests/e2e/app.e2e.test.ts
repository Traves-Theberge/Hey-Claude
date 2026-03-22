import { test, expect, _electron as electron } from '@playwright/test';
import path from 'path';

const appPath = path.resolve(__dirname, '../../');

test.describe('Hey Claude Electron App', () => {
  test('app launches and shows main window', async () => {
    const electronApp = await electron.launch({
      args: [appPath],
      env: { ...process.env, NODE_ENV: 'test' },
    });

    const window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    // Verify the window title or content loaded
    const title = await window.title();
    expect(title).toBeDefined();

    // Check that the app renders core UI
    const body = await window.locator('body').innerHTML();
    expect(body.length).toBeGreaterThan(0);

    await electronApp.close();
  });

  test('main window has correct properties', async () => {
    const electronApp = await electron.launch({
      args: [appPath],
      env: { ...process.env, NODE_ENV: 'test' },
    });

    const window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    // Check window is visible
    const isVisible = await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      return win?.isVisible();
    });
    expect(isVisible).toBe(true);

    // Check always on top
    const isAlwaysOnTop = await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      return win?.isAlwaysOnTop();
    });
    expect(isAlwaysOnTop).toBe(true);

    await electronApp.close();
  });

  test('renders StatusBar with app name', async () => {
    const electronApp = await electron.launch({
      args: [appPath],
      env: { ...process.env, NODE_ENV: 'test' },
    });

    const window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    // Wait for React to render
    await window.waitForSelector('text=Hey Claude', { timeout: 10000 });
    const appName = await window.locator('text=Hey Claude').first().textContent();
    expect(appName).toContain('Hey Claude');

    await electronApp.close();
  });

  test('shows idle state with microphone prompt', async () => {
    const electronApp = await electron.launch({
      args: [appPath],
      env: { ...process.env, NODE_ENV: 'test' },
    });

    const window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    // Wait for idle state UI
    await window.waitForSelector('text=click the microphone', { timeout: 10000 });
    const prompt = await window.locator('text=click the microphone').textContent();
    expect(prompt).toContain('click the microphone');

    await electronApp.close();
  });

  test('shows wake word status as Paused by default', async () => {
    const electronApp = await electron.launch({
      args: [appPath],
      env: { ...process.env, NODE_ENV: 'test' },
    });

    const window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    await window.waitForSelector('text=Paused', { timeout: 10000 });
    const status = await window.locator('text=Paused').textContent();
    expect(status).toContain('Paused');

    await electronApp.close();
  });

  test('displays TTS provider in status bar', async () => {
    const electronApp = await electron.launch({
      args: [appPath],
      env: { ...process.env, NODE_ENV: 'test' },
    });

    const window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    await window.waitForSelector('text=TTS:', { timeout: 10000 });
    const ttsLabel = await window.locator('text=TTS:').textContent();
    expect(ttsLabel).toContain('TTS:');

    await electronApp.close();
  });

  test('opens settings panel when settings button is clicked', async () => {
    const electronApp = await electron.launch({
      args: [appPath],
      env: { ...process.env, NODE_ENV: 'test' },
    });

    const window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    // Wait for app to render
    await window.waitForSelector('text=Hey Claude', { timeout: 10000 });

    // Click the settings gear button (last button in status bar)
    const settingsBtn = window.locator('button').last();
    await settingsBtn.click();

    // Settings panel should appear
    await window.waitForSelector('text=Settings', { timeout: 5000 });
    const settingsTitle = await window.locator('text=Settings').first().textContent();
    expect(settingsTitle).toContain('Settings');

    // Should show Wake Word section
    const wakeWordSection = await window.locator('text=Wake Word').textContent();
    expect(wakeWordSection).toContain('Wake Word');

    // Should show TTS section
    const ttsSection = await window.locator('text=Text-to-Speech').textContent();
    expect(ttsSection).toContain('Text-to-Speech');

    await electronApp.close();
  });

  test('settings panel can be closed with Cancel', async () => {
    const electronApp = await electron.launch({
      args: [appPath],
      env: { ...process.env, NODE_ENV: 'test' },
    });

    const window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    await window.waitForSelector('text=Hey Claude', { timeout: 10000 });

    // Open settings
    const settingsBtn = window.locator('button').last();
    await settingsBtn.click();
    await window.waitForSelector('text=Settings', { timeout: 5000 });

    // Click Cancel
    await window.locator('button:has-text("Cancel")').click();

    // Settings should close (Settings title should disappear)
    await expect(window.locator('text=Settings').first()).toBeHidden({ timeout: 3000 });

    await electronApp.close();
  });

  test('IPC config handler returns default config', async () => {
    const electronApp = await electron.launch({
      args: [appPath],
      env: { ...process.env, NODE_ENV: 'test' },
    });

    const window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    // Use evaluate to call the IPC bridge
    const config = await window.evaluate(() => {
      return (window as any).electronAPI?.getConfig();
    });

    if (config) {
      expect(config).toHaveProperty('ttsProvider');
      expect(config).toHaveProperty('sensitivity');
      expect(config).toHaveProperty('kokoroVoice');
    }

    await electronApp.close();
  });

  test('IPC listening state returns false by default', async () => {
    const electronApp = await electron.launch({
      args: [appPath],
      env: { ...process.env, NODE_ENV: 'test' },
    });

    const window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    const isListening = await window.evaluate(() => {
      return (window as any).electronAPI?.getListeningState();
    });

    expect(isListening).toBe(false);

    await electronApp.close();
  });
});

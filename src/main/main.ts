import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from 'electron';
import path from 'path';
import fs from 'fs';
import { WakeWordDetector } from './wake-word-detector';
import { ClaudeCLI } from './claude-cli';
import { TTSManager } from './tts/tts-manager';
import type { AppConfig } from '../renderer/lib/ipc';

const CONFIG_PATH = path.join(app.getPath('home'), '.hey-claude-config.json');

function findWakeWordModel(): string {
  const appRoot = app.getAppPath();
  const platform = process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'mac' : 'linux';

  // Check candidates in order of preference
  const candidates = [
    path.join(appRoot, 'keywords', `hey-claude_en_${platform}_v4_0_0.ppn`),
    path.join(appRoot, 'keywords', `hey-claude-en-${platform}.ppn`),
    // Fallback: any hey-claude .ppn in keywords/
    ...(() => {
      const dir = path.join(appRoot, 'keywords');
      try {
        return fs.readdirSync(dir)
          .filter(f => f.startsWith('hey-claude') && f.endsWith('.ppn'))
          .map(f => path.join(dir, f));
      } catch { return []; }
    })(),
    // Root level fallback
    path.join(appRoot, 'hey-claude.ppn'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      console.log(`[WakeWord] Using model: ${candidate}`);
      return candidate;
    }
  }

  console.warn('[WakeWord] No wake word model found. Searched:', candidates.slice(0, 3));
  return candidates[0]; // Return first candidate path even if missing (will error on init)
}

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let wakeWordDetector: WakeWordDetector | null = null;
let claudeCLI: ClaudeCLI | null = null;
let ttsManager: TTSManager | null = null;

const DEFAULT_CONFIG: AppConfig = {
  picovoiceAccessKey: '',
  ttsProvider: 'kokoro',
  elevenLabsApiKey: '',
  elevenLabsVoiceId: 'pNInz6obpgDQGcFmaJgB',
  openAiApiKey: '',
  openAiVoice: 'alloy',
  kokoroVoice: 'af_bella',
  sensitivity: 0.5,
};

function loadConfig(): AppConfig {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, 'utf-8');
      return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error('Failed to load config:', err);
  }
  return { ...DEFAULT_CONFIG };
}

function saveConfig(config: AppConfig): void {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save config:', err);
  }
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 400,
    minHeight: 300,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function setupIPC(): void {
  const config = loadConfig();

  // Config handlers
  ipcMain.handle('get-config', () => loadConfig());
  ipcMain.handle('save-config', (_event, newConfig: Partial<AppConfig>) => {
    const current = loadConfig();
    const merged = { ...current, ...newConfig };
    saveConfig(merged);

    // Reinitialize wake word detector if access key changed
    if (newConfig.picovoiceAccessKey && newConfig.picovoiceAccessKey !== current.picovoiceAccessKey) {
      initWakeWord(merged);
    }

    return merged;
  });

  // Wake word handlers
  ipcMain.handle('toggle-listening', () => {
    if (wakeWordDetector) {
      return wakeWordDetector.toggle();
    }
    return false;
  });

  ipcMain.handle('get-listening-state', () => {
    return wakeWordDetector?.isListening() ?? false;
  });

  // Claude CLI handlers
  claudeCLI = new ClaudeCLI();

  ipcMain.handle('claude-session-start', () => {
    claudeCLI!.startSession();
  });

  ipcMain.handle('claude-session-end', () => {
    claudeCLI!.endSession();
  });

  ipcMain.handle('claude-prompt', async (_event, text: string) => {
    if (!claudeCLI) return;

    claudeCLI.sendPrompt(text, {
      onChunk: (chunk: string) => {
        mainWindow?.webContents.send('claude-response-chunk', chunk);
      },
      onComplete: (fullResponse: string) => {
        mainWindow?.webContents.send('claude-response-complete', fullResponse);
      },
      onError: (error: string) => {
        mainWindow?.webContents.send('claude-error', error);
      },
    });
  });

  // TTS handlers
  ttsManager = new TTSManager(config);

  ipcMain.handle('tts-speak', async (_event, text: string, provider: string) => {
    if (!ttsManager) return;

    try {
      const audioBuffer = await ttsManager.speak(text, provider);
      if (audioBuffer) {
        mainWindow?.webContents.send('tts-audio-data', audioBuffer);
      }
      mainWindow?.webContents.send('tts-done');
    } catch (err) {
      mainWindow?.webContents.send('tts-error', String(err));
    }
  });

  ipcMain.handle('tts-stop', () => {
    ttsManager?.stop();
  });

  // Initialize wake word if configured
  if (config.picovoiceAccessKey) {
    initWakeWord(config);
  }
}

function initWakeWord(config: AppConfig): void {
  try {
    wakeWordDetector?.stop();
    wakeWordDetector = new WakeWordDetector({
      accessKey: config.picovoiceAccessKey,
      sensitivity: config.sensitivity,
      modelPath: findWakeWordModel(),
      onDetected: () => {
        console.log('Wake word detected!');
        mainWindow?.webContents.send('wake-word-detected');
        mainWindow?.show();
        mainWindow?.focus();
      },
      onStateChange: (isListening: boolean) => {
        mainWindow?.webContents.send('listening-state-changed', isListening);
      },
    });
  } catch (err) {
    console.error('Failed to initialize wake word detector:', err);
  }
}

function createTray(): void {
  // Simple 16x16 icon
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setToolTip('Hey Claude');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show',
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
      },
    },
    {
      label: 'Toggle Listening',
      click: () => {
        wakeWordDetector?.toggle();
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('click', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });
}

app.whenReady().then(() => {
  createWindow();
  setupIPC();
  createTray();
});

app.on('window-all-closed', () => {
  // Don't quit — keep running in tray
});

app.on('before-quit', () => {
  wakeWordDetector?.stop();
  claudeCLI?.endSession();
  ttsManager?.stop();
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

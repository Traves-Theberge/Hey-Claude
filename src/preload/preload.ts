import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
  // Wake word
  onWakeWordDetected: (callback: () => void) => {
    ipcRenderer.on('wake-word-detected', () => callback());
    return () => { ipcRenderer.removeAllListeners('wake-word-detected'); };
  },
  toggleListening: () => ipcRenderer.invoke('toggle-listening'),
  getListeningState: () => ipcRenderer.invoke('get-listening-state'),
  onListeningStateChanged: (callback: (state: boolean) => void) => {
    ipcRenderer.on('listening-state-changed', (_e, state: boolean) => callback(state));
    return () => { ipcRenderer.removeAllListeners('listening-state-changed'); };
  },

  // Claude CLI
  sendPrompt: (text: string) => ipcRenderer.invoke('claude-prompt', text),
  startClaudeSession: () => ipcRenderer.invoke('claude-session-start'),
  endClaudeSession: () => ipcRenderer.invoke('claude-session-end'),
  onClaudeResponseChunk: (callback: (chunk: string) => void) => {
    ipcRenderer.on('claude-response-chunk', (_e, chunk: string) => callback(chunk));
    return () => { ipcRenderer.removeAllListeners('claude-response-chunk'); };
  },
  onClaudeResponseComplete: (callback: (fullResponse: string) => void) => {
    ipcRenderer.on('claude-response-complete', (_e, response: string) => callback(response));
    return () => { ipcRenderer.removeAllListeners('claude-response-complete'); };
  },
  onClaudeError: (callback: (error: string) => void) => {
    ipcRenderer.on('claude-error', (_e, error: string) => callback(error));
    return () => { ipcRenderer.removeAllListeners('claude-error'); };
  },

  // TTS (main process providers like Kokoro, ElevenLabs, OpenAI)
  ttsSpeak: (text: string, provider: string) => ipcRenderer.invoke('tts-speak', text, provider),
  ttsStop: () => ipcRenderer.invoke('tts-stop'),
  onTtsAudioData: (callback: (data: ArrayBuffer) => void) => {
    ipcRenderer.on('tts-audio-data', (_e, data: ArrayBuffer) => callback(data));
    return () => { ipcRenderer.removeAllListeners('tts-audio-data'); };
  },
  onTtsDone: (callback: () => void) => {
    ipcRenderer.on('tts-done', () => callback());
    return () => { ipcRenderer.removeAllListeners('tts-done'); };
  },
  onTtsError: (callback: (error: string) => void) => {
    ipcRenderer.on('tts-error', (_e, error: string) => callback(error));
    return () => { ipcRenderer.removeAllListeners('tts-error'); };
  },

  // Config
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config: Record<string, unknown>) => ipcRenderer.invoke('save-config', config),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;

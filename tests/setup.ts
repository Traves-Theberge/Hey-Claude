import '@testing-library/jest-dom/vitest';

// Only set up browser mocks when running in jsdom environment
if (typeof window !== 'undefined') {
  // Mock window.electronAPI for renderer tests
  const mockElectronAPI = {
    onWakeWordDetected: vi.fn(() => vi.fn()),
    toggleListening: vi.fn(() => Promise.resolve(false)),
    getListeningState: vi.fn(() => Promise.resolve(false)),
    onListeningStateChanged: vi.fn(() => vi.fn()),
    sendPrompt: vi.fn(() => Promise.resolve()),
    startClaudeSession: vi.fn(() => Promise.resolve()),
    endClaudeSession: vi.fn(() => Promise.resolve()),
    onClaudeResponseChunk: vi.fn(() => vi.fn()),
    onClaudeResponseComplete: vi.fn(() => vi.fn()),
    onClaudeError: vi.fn(() => vi.fn()),
    ttsSpeak: vi.fn(() => Promise.resolve()),
    ttsStop: vi.fn(() => Promise.resolve()),
    onTtsAudioData: vi.fn(() => vi.fn()),
    onTtsDone: vi.fn(() => vi.fn()),
    onTtsError: vi.fn(() => vi.fn()),
    getConfig: vi.fn(() =>
      Promise.resolve({
        picovoiceAccessKey: '',
        ttsProvider: 'kokoro' as const,
        elevenLabsApiKey: '',
        elevenLabsVoiceId: 'pNInz6obpgDQGcFmaJgB',
        openAiApiKey: '',
        openAiVoice: 'alloy',
        kokoroVoice: 'af_bella',
        sensitivity: 0.5,
      })
    ),
    saveConfig: vi.fn((config: Record<string, unknown>) => Promise.resolve(config)),
  };

  Object.defineProperty(window, 'electronAPI', {
    value: mockElectronAPI,
    writable: true,
  });

  // Mock SpeechRecognition
  class MockSpeechRecognition {
    continuous = false;
    interimResults = false;
    lang = '';
    onstart: (() => void) | null = null;
    onresult: ((event: any) => void) | null = null;
    onend: (() => void) | null = null;
    onerror: ((event: any) => void) | null = null;

    start() {
      this.onstart?.();
    }
    stop() {
      this.onend?.();
    }
    abort() {
      this.onend?.();
    }
  }

  Object.defineProperty(window, 'SpeechRecognition', {
    value: MockSpeechRecognition,
    writable: true,
  });

  Object.defineProperty(window, 'webkitSpeechRecognition', {
    value: MockSpeechRecognition,
    writable: true,
  });

  // Mock SpeechSynthesis
  Object.defineProperty(window, 'speechSynthesis', {
    value: {
      speak: vi.fn(),
      cancel: vi.fn(),
      getVoices: vi.fn(() => []),
    },
    writable: true,
  });
}

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});

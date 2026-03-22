// IPC Channel Constants
export const IPC = {
  // Wake word
  WAKE_WORD_DETECTED: 'wake-word-detected',
  TOGGLE_LISTENING: 'toggle-listening',
  GET_LISTENING_STATE: 'get-listening-state',
  LISTENING_STATE_CHANGED: 'listening-state-changed',

  // Claude CLI
  CLAUDE_PROMPT: 'claude-prompt',
  CLAUDE_RESPONSE_CHUNK: 'claude-response-chunk',
  CLAUDE_RESPONSE_COMPLETE: 'claude-response-complete',
  CLAUDE_SESSION_START: 'claude-session-start',
  CLAUDE_SESSION_END: 'claude-session-end',
  CLAUDE_ERROR: 'claude-error',

  // TTS (main process providers)
  TTS_SPEAK: 'tts-speak',
  TTS_STOP: 'tts-stop',
  TTS_AUDIO_DATA: 'tts-audio-data',
  TTS_DONE: 'tts-done',
  TTS_ERROR: 'tts-error',

  // Config
  GET_CONFIG: 'get-config',
  SAVE_CONFIG: 'save-config',
} as const;

export type IPCChannel = (typeof IPC)[keyof typeof IPC];

// Config shape
export interface AppConfig {
  picovoiceAccessKey: string;
  ttsProvider: 'kokoro' | 'web-speech' | 'elevenlabs' | 'openai';
  elevenLabsApiKey: string;
  elevenLabsVoiceId: string;
  openAiApiKey: string;
  openAiVoice: string;
  kokoroVoice: string;
  sensitivity: number;
}

export const DEFAULT_CONFIG: AppConfig = {
  picovoiceAccessKey: '',
  ttsProvider: 'kokoro',
  elevenLabsApiKey: '',
  elevenLabsVoiceId: 'pNInz6obpgDQGcFmaJgB',
  openAiApiKey: '',
  openAiVoice: 'alloy',
  kokoroVoice: 'af_bella',
  sensitivity: 0.5,
};

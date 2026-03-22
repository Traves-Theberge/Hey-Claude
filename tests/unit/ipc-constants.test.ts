import { describe, it, expect } from 'vitest';
import { IPC, DEFAULT_CONFIG } from '../../src/renderer/lib/ipc';
import type { AppConfig } from '../../src/renderer/lib/ipc';

describe('IPC Constants', () => {
  it('should define all wake word channels', () => {
    expect(IPC.WAKE_WORD_DETECTED).toBe('wake-word-detected');
    expect(IPC.TOGGLE_LISTENING).toBe('toggle-listening');
    expect(IPC.GET_LISTENING_STATE).toBe('get-listening-state');
    expect(IPC.LISTENING_STATE_CHANGED).toBe('listening-state-changed');
  });

  it('should define all Claude CLI channels', () => {
    expect(IPC.CLAUDE_PROMPT).toBe('claude-prompt');
    expect(IPC.CLAUDE_RESPONSE_CHUNK).toBe('claude-response-chunk');
    expect(IPC.CLAUDE_RESPONSE_COMPLETE).toBe('claude-response-complete');
    expect(IPC.CLAUDE_SESSION_START).toBe('claude-session-start');
    expect(IPC.CLAUDE_SESSION_END).toBe('claude-session-end');
    expect(IPC.CLAUDE_ERROR).toBe('claude-error');
  });

  it('should define all TTS channels', () => {
    expect(IPC.TTS_SPEAK).toBe('tts-speak');
    expect(IPC.TTS_STOP).toBe('tts-stop');
    expect(IPC.TTS_AUDIO_DATA).toBe('tts-audio-data');
    expect(IPC.TTS_DONE).toBe('tts-done');
    expect(IPC.TTS_ERROR).toBe('tts-error');
  });

  it('should define config channels', () => {
    expect(IPC.GET_CONFIG).toBe('get-config');
    expect(IPC.SAVE_CONFIG).toBe('save-config');
  });

  it('should have no duplicate channel names', () => {
    const values = Object.values(IPC);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });
});

describe('DEFAULT_CONFIG', () => {
  it('should have correct default values', () => {
    expect(DEFAULT_CONFIG.picovoiceAccessKey).toBe('');
    expect(DEFAULT_CONFIG.ttsProvider).toBe('kokoro');
    expect(DEFAULT_CONFIG.sensitivity).toBe(0.5);
    expect(DEFAULT_CONFIG.kokoroVoice).toBe('af_bella');
    expect(DEFAULT_CONFIG.openAiVoice).toBe('alloy');
  });

  it('should have all required config fields', () => {
    const requiredKeys: (keyof AppConfig)[] = [
      'picovoiceAccessKey',
      'ttsProvider',
      'elevenLabsApiKey',
      'elevenLabsVoiceId',
      'openAiApiKey',
      'openAiVoice',
      'kokoroVoice',
      'sensitivity',
    ];
    for (const key of requiredKeys) {
      expect(DEFAULT_CONFIG).toHaveProperty(key);
    }
  });

  it('should have sensitivity in valid range', () => {
    expect(DEFAULT_CONFIG.sensitivity).toBeGreaterThanOrEqual(0);
    expect(DEFAULT_CONFIG.sensitivity).toBeLessThanOrEqual(1);
  });

  it('should have a valid ttsProvider value', () => {
    const validProviders = ['kokoro', 'web-speech', 'elevenlabs', 'openai'];
    expect(validProviders).toContain(DEFAULT_CONFIG.ttsProvider);
  });
});

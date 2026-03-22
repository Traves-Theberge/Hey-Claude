import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AppConfig } from '../../src/renderer/lib/ipc';

// Mock TTS providers with class-based mocks
const mockKokoroSpeak = vi.fn().mockResolvedValue(Buffer.from('kokoro-audio'));
const mockKokoroStop = vi.fn();
const mockElevenLabsSpeak = vi.fn().mockResolvedValue(Buffer.from('elevenlabs-audio'));
const mockOpenAISpeak = vi.fn().mockResolvedValue(Buffer.from('openai-audio'));

vi.mock('../../src/main/tts/kokoro-tts', () => ({
  KokoroTTS: class MockKokoroTTS {
    speak = mockKokoroSpeak;
    stop = mockKokoroStop;
    constructor() {}
  },
}));

vi.mock('../../src/main/tts/elevenlabs-tts', () => ({
  ElevenLabsTTS: class MockElevenLabsTTS {
    speak = mockElevenLabsSpeak;
    constructor() {}
  },
}));

vi.mock('../../src/main/tts/openai-tts', () => ({
  OpenAITTS: class MockOpenAITTS {
    speak = mockOpenAISpeak;
    constructor() {}
  },
}));

import { TTSManager } from '../../src/main/tts/tts-manager';

function makeConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    picovoiceAccessKey: '',
    ttsProvider: 'kokoro',
    elevenLabsApiKey: 'test-key',
    elevenLabsVoiceId: 'voice-id',
    openAiApiKey: 'test-key',
    openAiVoice: 'alloy',
    kokoroVoice: 'af_bella',
    sensitivity: 0.5,
    ...overrides,
  };
}

describe('TTSManager', () => {
  let manager: TTSManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new TTSManager(makeConfig());
  });

  describe('speak', () => {
    it('should route to kokoro by default', async () => {
      const result = await manager.speak('Hello');
      expect(result).toEqual(Buffer.from('kokoro-audio'));
      expect(mockKokoroSpeak).toHaveBeenCalledWith('Hello');
    });

    it('should route to elevenlabs when configured', async () => {
      manager = new TTSManager(makeConfig({ ttsProvider: 'elevenlabs' }));
      const result = await manager.speak('Hello');
      expect(result).toEqual(Buffer.from('elevenlabs-audio'));
      expect(mockElevenLabsSpeak).toHaveBeenCalledWith('Hello');
    });

    it('should route to openai when configured', async () => {
      manager = new TTSManager(makeConfig({ ttsProvider: 'openai' }));
      const result = await manager.speak('Hello');
      expect(result).toEqual(Buffer.from('openai-audio'));
      expect(mockOpenAISpeak).toHaveBeenCalledWith('Hello');
    });

    it('should return null for web-speech provider', async () => {
      manager = new TTSManager(makeConfig({ ttsProvider: 'web-speech' }));
      const result = await manager.speak('Hello');
      expect(result).toBeNull();
    });

    it('should fall back to kokoro for unknown provider', async () => {
      const result = await manager.speak('Hello', 'unknown-provider');
      expect(result).toEqual(Buffer.from('kokoro-audio'));
    });

    it('should use provider override parameter', async () => {
      const result = await manager.speak('Hello', 'elevenlabs');
      expect(result).toEqual(Buffer.from('elevenlabs-audio'));
    });
  });

  describe('stop', () => {
    it('should call stop on kokoro provider', () => {
      manager.stop();
      expect(mockKokoroStop).toHaveBeenCalled();
    });
  });

  describe('updateConfig', () => {
    it('should accept new config without error', () => {
      const newConfig = makeConfig({
        ttsProvider: 'elevenlabs',
        elevenLabsApiKey: 'new-key',
      });

      expect(() => manager.updateConfig(newConfig)).not.toThrow();
    });

    it('should use new provider after update', async () => {
      manager.updateConfig(makeConfig({ ttsProvider: 'openai' }));
      const result = await manager.speak('Hello');
      expect(result).toEqual(Buffer.from('openai-audio'));
    });
  });
});

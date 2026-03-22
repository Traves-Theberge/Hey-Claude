import type { AppConfig } from '../../renderer/lib/ipc';
import { KokoroTTS } from './kokoro-tts';
import { ElevenLabsTTS } from './elevenlabs-tts';
import { OpenAITTS } from './openai-tts';

export class TTSManager {
  private config: AppConfig;
  private kokoroTTS: KokoroTTS;
  private elevenLabsTTS: ElevenLabsTTS;
  private openAITTS: OpenAITTS;

  constructor(config: AppConfig) {
    this.config = config;
    this.kokoroTTS = new KokoroTTS(config.kokoroVoice);
    this.elevenLabsTTS = new ElevenLabsTTS(config.elevenLabsApiKey, config.elevenLabsVoiceId);
    this.openAITTS = new OpenAITTS(config.openAiApiKey, config.openAiVoice);
  }

  async speak(text: string, provider?: string): Promise<Buffer | null> {
    const selectedProvider = provider || this.config.ttsProvider;

    switch (selectedProvider) {
      case 'kokoro':
        return this.kokoroTTS.speak(text);
      case 'elevenlabs':
        return this.elevenLabsTTS.speak(text);
      case 'openai':
        return this.openAITTS.speak(text);
      case 'web-speech':
        // Web Speech API is handled in the renderer process
        return null;
      default:
        console.warn(`[TTS] Unknown provider: ${selectedProvider}, falling back to kokoro`);
        return this.kokoroTTS.speak(text);
    }
  }

  stop(): void {
    this.kokoroTTS.stop();
  }

  updateConfig(config: AppConfig): void {
    this.config = config;
    this.kokoroTTS = new KokoroTTS(config.kokoroVoice);
    this.elevenLabsTTS = new ElevenLabsTTS(config.elevenLabsApiKey, config.elevenLabsVoiceId);
    this.openAITTS = new OpenAITTS(config.openAiApiKey, config.openAiVoice);
  }
}

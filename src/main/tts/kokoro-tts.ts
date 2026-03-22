let KokoroTTSModule: any = null;

async function getKokoroModule() {
  if (!KokoroTTSModule) {
    // Dynamic import for ESM module
    KokoroTTSModule = await import('kokoro-js');
  }
  return KokoroTTSModule;
}

export class KokoroTTS {
  private voice: string;
  private ttsInstance: any = null;
  private loading = false;

  constructor(voice: string = 'af_bella') {
    this.voice = voice;
  }

  private async getInstance(): Promise<any> {
    if (this.ttsInstance) return this.ttsInstance;
    if (this.loading) {
      // Wait for loading to complete
      while (this.loading) {
        await new Promise((r) => setTimeout(r, 100));
      }
      return this.ttsInstance;
    }

    this.loading = true;
    try {
      const { KokoroTTS: KokoroClass } = await getKokoroModule();
      this.ttsInstance = await KokoroClass.from_pretrained(
        'onnx-community/Kokoro-82M-v1.0-ONNX',
        {
          dtype: 'q8',
          device: 'cpu',
        }
      );
      console.log('[KokoroTTS] Model loaded successfully');
      return this.ttsInstance;
    } catch (err) {
      console.error('[KokoroTTS] Failed to load model:', err);
      throw err;
    } finally {
      this.loading = false;
    }
  }

  async speak(text: string): Promise<Buffer> {
    const tts = await this.getInstance();
    const audio = await tts.generate(text, { voice: this.voice });

    // Convert the audio to a WAV buffer
    const wavData = audio.toWav();
    return Buffer.from(wavData);
  }

  stop(): void {
    // Kokoro doesn't have a stop mechanism for in-progress generation
    // Audio playback stopping is handled on the renderer side
  }
}

import { Porcupine } from '@picovoice/porcupine-node';
import { PvRecorder } from '@picovoice/pvrecorder-node';

export interface WakeWordConfig {
  accessKey: string;
  sensitivity: number;
  modelPath: string;
  onDetected: () => void;
  onStateChange: (isListening: boolean) => void;
}

export class WakeWordDetector {
  private porcupine: Porcupine | null = null;
  private recorder: PvRecorder | null = null;
  private listening = false;
  private detectionLoop: ReturnType<typeof setInterval> | null = null;
  private config: WakeWordConfig;

  constructor(config: WakeWordConfig) {
    this.config = config;
  }

  async start(): Promise<boolean> {
    if (this.listening) return true;

    try {
      this.porcupine = new Porcupine(
        this.config.accessKey,
        [this.config.modelPath],
        [this.config.sensitivity]
      );

      const frameLength = this.porcupine.frameLength;
      const sampleRate = this.porcupine.sampleRate;

      this.recorder = new PvRecorder(frameLength, -1);
      this.recorder.start();

      this.listening = true;
      this.config.onStateChange(true);

      this.detectionLoop = setInterval(async () => {
        if (!this.recorder || !this.porcupine || !this.listening) return;

        try {
          const pcm = await this.recorder.read();
          const keywordIndex = this.porcupine.process(pcm);

          if (keywordIndex >= 0) {
            console.log('[WakeWord] "Hey Claude" detected');
            this.config.onDetected();
          }
        } catch (err) {
          console.error('[WakeWord] Detection error:', err);
        }
      }, 10);

      console.log(`[WakeWord] Listening at ${sampleRate}Hz, frame length: ${frameLength}`);
      return true;
    } catch (err) {
      console.error('[WakeWord] Failed to start:', err);
      this.cleanup();
      return false;
    }
  }

  stop(): void {
    this.listening = false;

    if (this.detectionLoop) {
      clearInterval(this.detectionLoop);
      this.detectionLoop = null;
    }

    this.cleanup();
    this.config.onStateChange(false);
  }

  toggle(): boolean {
    if (this.listening) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  isListening(): boolean {
    return this.listening;
  }

  private cleanup(): void {
    try {
      this.recorder?.stop();
      this.recorder?.release();
    } catch { /* ignore */ }

    try {
      this.porcupine?.release();
    } catch { /* ignore */ }

    this.recorder = null;
    this.porcupine = null;
  }
}

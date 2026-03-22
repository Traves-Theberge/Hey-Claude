import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WakeWordDetector } from '../../src/main/wake-word-detector';

// Mock Porcupine and PvRecorder with class-based mocks
vi.mock('@picovoice/porcupine-node', () => ({
  Porcupine: class MockPorcupine {
    frameLength = 512;
    sampleRate = 16000;
    process = vi.fn().mockReturnValue(-1);
    release = vi.fn();
    constructor() {}
  },
}));

vi.mock('@picovoice/pvrecorder-node', () => ({
  PvRecorder: class MockPvRecorder {
    start = vi.fn();
    stop = vi.fn();
    release = vi.fn();
    read = vi.fn().mockResolvedValue(new Int16Array(512));
    constructor() {}
  },
}));

describe('WakeWordDetector', () => {
  let detector: WakeWordDetector;
  let onDetected: ReturnType<typeof vi.fn>;
  let onStateChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    onDetected = vi.fn();
    onStateChange = vi.fn();

    detector = new WakeWordDetector({
      accessKey: 'test-key',
      sensitivity: 0.5,
      modelPath: '/path/to/model.ppn',
      onDetected,
      onStateChange,
    });
  });

  describe('start', () => {
    it('should initialize and start listening', async () => {
      const result = await detector.start();

      expect(result).toBe(true);
      expect(detector.isListening()).toBe(true);
      expect(onStateChange).toHaveBeenCalledWith(true);
    });

    it('should return true if already listening', async () => {
      await detector.start();
      const result = await detector.start();

      expect(result).toBe(true);
    });

    it('should handle initialization failure gracefully', async () => {
      const { Porcupine } = await import('@picovoice/porcupine-node');
      const OrigPorcupine = Porcupine;
      // Temporarily replace with throwing constructor
      (await import('@picovoice/porcupine-node') as any).Porcupine = class {
        constructor() { throw new Error('Invalid access key'); }
      };

      const failDetector = new WakeWordDetector({
        accessKey: 'bad-key',
        sensitivity: 0.5,
        modelPath: '/bad/path.ppn',
        onDetected,
        onStateChange,
      });

      const result = await failDetector.start();
      expect(result).toBe(false);
      expect(failDetector.isListening()).toBe(false);

      // Restore
      (await import('@picovoice/porcupine-node') as any).Porcupine = OrigPorcupine;
    });
  });

  describe('stop', () => {
    it('should stop listening and clean up', async () => {
      await detector.start();
      detector.stop();

      expect(detector.isListening()).toBe(false);
      expect(onStateChange).toHaveBeenCalledWith(false);
    });

    it('should be safe to call when not listening', () => {
      expect(() => detector.stop()).not.toThrow();
    });
  });

  describe('toggle', () => {
    it('should start listening when stopped', () => {
      const result = detector.toggle();
      expect(result).toBe(true);
    });

    it('should stop listening when started', async () => {
      await detector.start();
      const result = detector.toggle();

      expect(result).toBe(false);
      expect(detector.isListening()).toBe(false);
    });
  });

  describe('isListening', () => {
    it('should return false initially', () => {
      expect(detector.isListening()).toBe(false);
    });

    it('should return true after starting', async () => {
      await detector.start();
      expect(detector.isListening()).toBe(true);
    });

    it('should return false after stopping', async () => {
      await detector.start();
      detector.stop();
      expect(detector.isListening()).toBe(false);
    });
  });
});

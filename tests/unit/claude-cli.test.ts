// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'events';

const spawnedProcs: any[] = [];
const spawnArgsList: any[][] = [];

vi.mock('child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('child_process')>();
  const { EventEmitter } = await import('events');
  return {
    ...actual,
    spawn: vi.fn((...args: any[]) => {
      const proc = new EventEmitter() as any;
      proc.stdin = { end: vi.fn(), write: vi.fn() };
      proc.stdout = new EventEmitter();
      proc.stderr = new EventEmitter();
      proc.kill = vi.fn();
      proc.pid = 12345;
      spawnedProcs.push(proc);
      spawnArgsList.push(args);
      return proc;
    }),
  };
});

import { ClaudeCLI } from '../../src/main/claude-cli';

describe('ClaudeCLI', () => {
  let cli: ClaudeCLI;

  beforeEach(() => {
    spawnedProcs.length = 0;
    spawnArgsList.length = 0;
    cli = new ClaudeCLI();
  });

  afterEach(() => {
    cli.endSession();
  });

  describe('startSession', () => {
    it('should spawn claude with --verbose flag', () => {
      cli.startSession();

      expect(spawnArgsList[0][0]).toBe('claude');
      expect(spawnArgsList[0][1]).toEqual(['--verbose']);
      expect(spawnArgsList[0][2]).toMatchObject({ stdio: ['pipe', 'pipe', 'pipe'], shell: true });
    });

    it('should end existing session before starting new one', () => {
      cli.startSession();
      const firstProc = spawnedProcs[0];

      cli.startSession();

      expect(firstProc.kill).toHaveBeenCalled();
      expect(spawnedProcs.length).toBe(2);
    });
  });

  describe('sendPrompt', () => {
    it('should spawn claude with --print and the prompt text', () => {
      const callbacks = { onChunk: vi.fn(), onComplete: vi.fn(), onError: vi.fn() };
      cli.sendPrompt('Hello Claude', callbacks);

      expect(spawnArgsList[0][0]).toBe('claude');
      expect(spawnArgsList[0][1]).toEqual(['--print', 'Hello Claude']);
    });

    it('should call onChunk when stdout emits data', () => {
      const callbacks = { onChunk: vi.fn(), onComplete: vi.fn(), onError: vi.fn() };
      cli.sendPrompt('test', callbacks);
      const proc = spawnedProcs[0];

      proc.stdout.emit('data', Buffer.from('Hello '));
      proc.stdout.emit('data', Buffer.from('world'));

      expect(callbacks.onChunk).toHaveBeenCalledWith('Hello ');
      expect(callbacks.onChunk).toHaveBeenCalledWith('world');
    });

    it('should call onComplete when process closes with code 0', () => {
      const callbacks = { onChunk: vi.fn(), onComplete: vi.fn(), onError: vi.fn() };
      cli.sendPrompt('test', callbacks);
      const proc = spawnedProcs[0];

      proc.stdout.emit('data', Buffer.from('Response text'));
      proc.emit('close', 0);

      expect(callbacks.onComplete).toHaveBeenCalledWith('Response text');
    });

    it('should call onError when process closes with no output', () => {
      const callbacks = { onChunk: vi.fn(), onComplete: vi.fn(), onError: vi.fn() };
      cli.sendPrompt('test', callbacks);
      const proc = spawnedProcs[0];

      proc.emit('close', 1);

      expect(callbacks.onError).toHaveBeenCalledWith(
        'Claude CLI exited with code 1 and no output'
      );
    });

    it('should call onError on stderr with error keyword', () => {
      const callbacks = { onChunk: vi.fn(), onComplete: vi.fn(), onError: vi.fn() };
      cli.sendPrompt('test', callbacks);
      const proc = spawnedProcs[0];

      proc.stderr.emit('data', Buffer.from('Fatal error occurred'));

      expect(callbacks.onError).toHaveBeenCalledWith('Fatal error occurred');
    });

    it('should not call onError on stderr without error keywords', () => {
      const callbacks = { onChunk: vi.fn(), onComplete: vi.fn(), onError: vi.fn() };
      cli.sendPrompt('test', callbacks);
      const proc = spawnedProcs[0];

      proc.stderr.emit('data', Buffer.from('Some status message'));

      expect(callbacks.onError).not.toHaveBeenCalled();
    });

    it('should call onError when spawn emits error', () => {
      const callbacks = { onChunk: vi.fn(), onComplete: vi.fn(), onError: vi.fn() };
      cli.sendPrompt('test', callbacks);
      const proc = spawnedProcs[0];

      proc.emit('error', new Error('ENOENT'));

      expect(callbacks.onError).toHaveBeenCalledWith(
        'Failed to run Claude CLI: ENOENT'
      );
    });

    it('should still complete if exit code is non-zero but has output', () => {
      const callbacks = { onChunk: vi.fn(), onComplete: vi.fn(), onError: vi.fn() };
      cli.sendPrompt('test', callbacks);
      const proc = spawnedProcs[0];

      proc.stdout.emit('data', Buffer.from('Partial response'));
      proc.emit('close', 1);

      expect(callbacks.onComplete).toHaveBeenCalledWith('Partial response');
    });
  });

  describe('endSession', () => {
    it('should kill the process and clean up', () => {
      cli.startSession();
      const proc = spawnedProcs[0];

      cli.endSession();

      expect(proc.stdin.end).toHaveBeenCalled();
      expect(proc.kill).toHaveBeenCalled();
    });

    it('should be safe to call when no session exists', () => {
      expect(() => cli.endSession()).not.toThrow();
    });
  });
});

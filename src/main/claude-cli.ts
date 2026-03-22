import { spawn, ChildProcess } from 'child_process';

interface PromptCallbacks {
  onChunk: (chunk: string) => void;
  onComplete: (fullResponse: string) => void;
  onError: (error: string) => void;
}

export class ClaudeCLI {
  private process: ChildProcess | null = null;
  private isProcessing = false;
  private currentCallbacks: PromptCallbacks | null = null;
  private responseBuffer = '';
  private responseTimeout: ReturnType<typeof setTimeout> | null = null;

  startSession(): void {
    if (this.process) {
      this.endSession();
    }

    try {
      // Spawn claude in interactive pipe mode
      this.process = spawn('claude', ['--verbose'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
        env: { ...process.env },
      });

      this.process.stdout?.on('data', (data: Buffer) => {
        const text = data.toString();
        this.handleOutput(text);
      });

      this.process.stderr?.on('data', (data: Buffer) => {
        const text = data.toString();
        // Claude CLI uses stderr for some status messages, only report real errors
        if (text.toLowerCase().includes('error') || text.toLowerCase().includes('fatal')) {
          this.currentCallbacks?.onError(text);
        }
      });

      this.process.on('close', (code) => {
        console.log(`[ClaudeCLI] Process exited with code ${code}`);
        if (this.isProcessing && this.currentCallbacks) {
          if (this.responseBuffer) {
            this.currentCallbacks.onComplete(this.responseBuffer);
          } else {
            this.currentCallbacks.onError(`Claude process exited with code ${code}`);
          }
        }
        this.process = null;
        this.isProcessing = false;
      });

      this.process.on('error', (err) => {
        console.error('[ClaudeCLI] Process error:', err);
        this.currentCallbacks?.onError(`Failed to start Claude CLI: ${err.message}`);
        this.process = null;
        this.isProcessing = false;
      });

      console.log('[ClaudeCLI] Session started');
    } catch (err) {
      console.error('[ClaudeCLI] Failed to start session:', err);
    }
  }

  sendPrompt(text: string, callbacks: PromptCallbacks): void {
    // Use --print mode for single prompts (more reliable than pipe mode)
    this.isProcessing = true;
    this.currentCallbacks = callbacks;
    this.responseBuffer = '';

    const proc = spawn('claude', ['--print', text], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
      env: { ...process.env },
    });

    proc.stdout?.on('data', (data: Buffer) => {
      const chunk = data.toString();
      this.responseBuffer += chunk;
      callbacks.onChunk(chunk);

      // Reset the completion timeout on each chunk
      if (this.responseTimeout) clearTimeout(this.responseTimeout);
      this.responseTimeout = setTimeout(() => {
        // No new data for 500ms — likely complete
      }, 500);
    });

    proc.stderr?.on('data', (data: Buffer) => {
      const text = data.toString();
      if (text.toLowerCase().includes('error') || text.toLowerCase().includes('fatal')) {
        callbacks.onError(text);
      }
    });

    proc.on('close', (code) => {
      this.isProcessing = false;
      if (this.responseTimeout) clearTimeout(this.responseTimeout);

      if (code === 0 && this.responseBuffer) {
        callbacks.onComplete(this.responseBuffer.trim());
      } else if (!this.responseBuffer) {
        callbacks.onError(`Claude CLI exited with code ${code} and no output`);
      } else {
        callbacks.onComplete(this.responseBuffer.trim());
      }
    });

    proc.on('error', (err) => {
      this.isProcessing = false;
      callbacks.onError(`Failed to run Claude CLI: ${err.message}`);
    });
  }

  endSession(): void {
    if (this.process) {
      try {
        this.process.stdin?.end();
        this.process.kill();
      } catch { /* ignore */ }
      this.process = null;
    }
    this.isProcessing = false;
    this.currentCallbacks = null;
    this.responseBuffer = '';
    console.log('[ClaudeCLI] Session ended');
  }

  private handleOutput(text: string): void {
    if (!this.isProcessing || !this.currentCallbacks) return;

    this.responseBuffer += text;
    this.currentCallbacks.onChunk(text);
  }
}

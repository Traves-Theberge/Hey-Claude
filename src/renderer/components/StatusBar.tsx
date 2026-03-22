import { motion } from 'framer-motion';

interface StatusBarProps {
  isWakeWordListening: boolean;
  ttsProvider: string;
  onToggleWakeWord: () => void;
  onOpenSettings: () => void;
}

export function StatusBar({
  isWakeWordListening,
  ttsProvider,
  onToggleWakeWord,
  onOpenSettings,
}: StatusBarProps) {
  return (
    <div className="drag-region flex items-center justify-between px-4 py-2 bg-claude-surface/80 backdrop-blur-sm border-b border-claude-border">
      <div className="flex items-center gap-3">
        <span className="text-claude-primary font-bold text-sm tracking-wide">
          Hey Claude
        </span>

        <button
          onClick={onToggleWakeWord}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
            isWakeWordListening
              ? 'bg-claude-success/20 text-claude-success'
              : 'bg-claude-surface-light text-claude-text-muted hover:text-claude-text'
          }`}
        >
          <motion.div
            className={`w-2 h-2 rounded-full ${
              isWakeWordListening ? 'bg-claude-success' : 'bg-claude-text-muted'
            }`}
            animate={
              isWakeWordListening
                ? { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }
                : {}
            }
            transition={{ duration: 2, repeat: Infinity }}
          />
          {isWakeWordListening ? 'Listening' : 'Paused'}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-claude-text-muted">
          TTS: {ttsProvider}
        </span>

        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg text-claude-text-muted hover:text-claude-text hover:bg-claude-surface-light transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-4 h-4"
          >
            <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

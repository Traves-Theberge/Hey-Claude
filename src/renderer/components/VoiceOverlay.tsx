import { motion, AnimatePresence } from 'framer-motion';
import { ListeningIndicator } from './ListeningIndicator';
import { TranscriptionDisplay } from './TranscriptionDisplay';
import { ResponseDisplay } from './ResponseDisplay';
import type { ConversationState } from '../hooks/useConversation';

interface VoiceOverlayProps {
  state: ConversationState;
  transcript: string;
  interimTranscript: string;
  response: string;
  error: string | null;
  onCancel: () => void;
  onStartListening: () => void;
}

export function VoiceOverlay({
  state,
  transcript,
  interimTranscript,
  response,
  error,
  onCancel,
  onStartListening,
}: VoiceOverlayProps) {
  const isActive = state !== 'idle';

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
      <AnimatePresence mode="wait">
        {state === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6"
          >
            {/* Idle state — waiting for wake word */}
            <motion.div
              className="w-24 h-24 rounded-full bg-claude-surface border-2 border-claude-border flex items-center justify-center cursor-pointer hover:border-claude-primary transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onStartListening}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-10 h-10 text-claude-text-muted"
              >
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            </motion.div>

            <div className="text-center">
              <p className="text-claude-text-muted text-sm">
                Say <span className="text-claude-primary font-medium">"Hey Claude"</span> or
                click the microphone
              </p>
            </div>
          </motion.div>
        )}

        {state === 'listening' && (
          <motion.div
            key="listening"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center gap-6 w-full"
          >
            <ListeningIndicator isListening={true} />
            <TranscriptionDisplay
              transcript={transcript}
              interimTranscript={interimTranscript}
            />
          </motion.div>
        )}

        {state === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6 w-full"
          >
            {/* Show what user said */}
            <TranscriptionDisplay
              transcript={transcript}
              interimTranscript=""
            />

            {/* Processing spinner */}
            <div className="flex items-center gap-3">
              <motion.div
                className="w-5 h-5 border-2 border-claude-primary border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <span className="text-claude-text-muted text-sm">
                Claude is thinking...
              </span>
            </div>

            {/* Streaming response */}
            {response && (
              <ResponseDisplay response={response} isStreaming={true} />
            )}
          </motion.div>
        )}

        {state === 'responding' && (
          <motion.div
            key="responding"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6 w-full"
          >
            <TranscriptionDisplay
              transcript={transcript}
              interimTranscript=""
            />
            <ResponseDisplay response={response} isStreaming={false} />

            {/* Speaking indicator */}
            <div className="flex items-center gap-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-claude-primary rounded-full"
                  animate={{
                    height: [8, 20, 8],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                />
              ))}
              <span className="text-claude-text-muted text-xs ml-2">Speaking...</span>
            </div>
          </motion.div>
        )}

        {state === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="w-16 h-16 rounded-full bg-claude-error/20 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-8 h-8 text-claude-error"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
            </div>
            <p className="text-claude-error text-sm text-center max-w-sm">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel button */}
      {isActive && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 px-6 py-2 rounded-full bg-claude-surface-light text-claude-text-muted hover:text-claude-text border border-claude-border hover:border-claude-text-muted transition-colors text-sm"
          onClick={onCancel}
        >
          Cancel
        </motion.button>
      )}
    </div>
  );
}

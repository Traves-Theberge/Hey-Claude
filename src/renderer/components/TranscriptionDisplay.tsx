import { motion, AnimatePresence } from 'framer-motion';

interface TranscriptionDisplayProps {
  transcript: string;
  interimTranscript: string;
}

export function TranscriptionDisplay({
  transcript,
  interimTranscript,
}: TranscriptionDisplayProps) {
  const hasText = transcript || interimTranscript;

  if (!hasText) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-lg"
    >
      <div className="bg-claude-surface border border-claude-border rounded-xl p-4">
        <div className="text-xs text-claude-text-muted uppercase tracking-wider mb-2">
          Your prompt
        </div>
        <div className="text-claude-text text-lg leading-relaxed">
          <AnimatePresence mode="popLayout">
            {transcript && (
              <motion.span
                key="final"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {transcript}
              </motion.span>
            )}
            {interimTranscript && (
              <motion.span
                key="interim"
                className="text-claude-text-muted"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
              >
                {transcript ? ' ' : ''}
                {interimTranscript}
              </motion.span>
            )}
          </AnimatePresence>
          <motion.span
            className="inline-block w-0.5 h-5 bg-claude-primary ml-0.5 align-middle"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        </div>
      </div>
    </motion.div>
  );
}

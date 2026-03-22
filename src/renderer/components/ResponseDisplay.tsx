import { motion } from 'framer-motion';

interface ResponseDisplayProps {
  response: string;
  isStreaming: boolean;
}

export function ResponseDisplay({ response, isStreaming }: ResponseDisplayProps) {
  if (!response) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-lg"
    >
      <div className="bg-claude-surface border border-claude-border rounded-xl p-4">
        <div className="text-xs text-claude-primary uppercase tracking-wider mb-2 flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-3.5 h-3.5"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
          Claude
        </div>
        <div className="text-claude-text text-base leading-relaxed whitespace-pre-wrap">
          {response}
          {isStreaming && (
            <motion.span
              className="inline-block w-0.5 h-4 bg-claude-primary ml-0.5 align-middle"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}

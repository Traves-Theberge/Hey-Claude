import { motion } from 'framer-motion';

interface ListeningIndicatorProps {
  isListening: boolean;
}

export function ListeningIndicator({ isListening }: ListeningIndicatorProps) {
  if (!isListening) return null;

  return (
    <div className="flex items-center justify-center gap-3">
      <div className="relative">
        {/* Pulsing rings */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border-2 border-claude-primary"
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{
              scale: [1, 1.8, 2.5],
              opacity: [0.6, 0.3, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.4,
              ease: 'easeOut',
            }}
          />
        ))}

        {/* Mic icon center */}
        <motion.div
          className="relative z-10 w-16 h-16 rounded-full bg-claude-primary flex items-center justify-center"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="white"
            className="w-8 h-8"
          >
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
        </motion.div>
      </div>

      <motion.span
        className="text-claude-primary font-medium text-lg"
        animate={{ opacity: [1, 0.5, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        Listening...
      </motion.span>
    </div>
  );
}

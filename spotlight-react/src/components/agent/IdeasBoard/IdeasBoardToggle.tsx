/**
 * IdeasBoardToggle - Floating action button to open Ideas Board
 *
 * Aesthetic: Vintage compass / scrapbook
 * - Pulsing badge when new ideas available
 * - Subtle cork texture hint
 * - Position: bottom-right, above chat input
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Sparkles } from 'lucide-react';
import { useIdeasBoard } from '../../../contexts/IdeasBoardContext';

interface IdeasBoardToggleProps {
  className?: string;
}

export function IdeasBoardToggle({ className = '' }: IdeasBoardToggleProps) {
  const { pendingCount, savedCount, openPanel, isOpen } = useIdeasBoard();
  const totalCount = pendingCount + savedCount;

  // Don't show if panel is already open or no ideas
  if (isOpen) return null;

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={openPanel}
      className={`
        relative flex items-center gap-2
        px-4 py-2.5 rounded-full
        bg-gradient-to-r from-amber-100 to-orange-100
        border-2 border-amber-300/50
        shadow-lg shadow-amber-200/50
        hover:shadow-xl hover:shadow-amber-300/50
        transition-shadow
        ${className}
      `}
      style={{
        // Subtle cork hint
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E")`,
      }}
    >
      {/* Icon */}
      <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
        <Compass className="w-3.5 h-3.5 text-white" />
      </div>

      {/* Label */}
      <span className="text-sm font-semibold text-amber-900">
        Ideas
      </span>

      {/* Count badge */}
      <AnimatePresence>
        {totalCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="relative"
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 rounded-full bg-rose-400 opacity-50"
            />
            <div className="relative px-2 py-0.5 rounded-full bg-rose-500 text-white text-xs font-bold min-w-[1.25rem] text-center">
              {totalCount > 99 ? '99+' : totalCount}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sparkle decoration when has new ideas */}
      {pendingCount > 0 && (
        <motion.div
          animate={{
            rotate: [0, 15, -15, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-1 -right-1"
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
        </motion.div>
      )}
    </motion.button>
  );
}

export default IdeasBoardToggle;

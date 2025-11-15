/**
 * AgentChatBubble - Floating button for AI Travel Assistant
 *
 * Shows floating button when:
 * - Modal is closed (!isOpen)
 * - Modal is minimized (isMinimized)
 *
 * Features:
 * - Notification badge when new artifact available
 * - Smooth animations
 * - Hover and tap effects
 */

import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Bell } from 'lucide-react';
import { useAgent } from '../../contexts/AgentProvider';

export function AgentChatBubble() {
  const { isOpen, isMinimized, currentArtifact, openAgent } = useAgent();

  // Only show floating button when not in modal mode
  const showFloatingButton = !isOpen || isMinimized;

  return (
    <AnimatePresence>
      {showFloatingButton && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={openAgent}
          className="fixed top-44 left-6 z-50 w-16 h-16 bg-[#064d51] text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-[#0a6b70] transition-colors"
        >
          <MessageCircle className="w-7 h-7" />

          {/* New artifact notification badge */}
          {currentArtifact && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center border-2 border-white"
            >
              <Bell className="w-3 h-3 text-white" />
            </motion.div>
          )}
        </motion.button>
      )}
    </AnimatePresence>
  );
}

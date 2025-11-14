/**
 * AgentChatBubble - AI Travel Assistant
 *
 * Full-screen modal interface with:
 * - Split-view: Chat History (40%) | Interactive Artifacts (60%)
 * - Floating button to open
 * - Rich artifact rendering for tool results
 */

import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { useAgent } from '../../contexts/AgentProvider';
import { AgentModal } from './AgentModal';

export function AgentChatBubble() {
  const { isOpen, openAgent } = useAgent();

  return (
    <>
      {/* Full-Screen Modal */}
      <AgentModal />

      {/* Floating Button - Only show when not open */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            whileHover={{ scale: 1.05, boxShadow: '0 10px 25px rgba(6, 77, 81, 0.3)' }}
            whileTap={{ scale: 0.95 }}
            onClick={openAgent}
            className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-[#064d51] text-white rounded-full shadow-xl flex items-center justify-center hover:bg-[#0a6b70] transition-colors"
          >
            <MessageCircle className="w-7 h-7" />

            {/* Notification badge (for future use) */}
            {/* <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs font-bold flex items-center justify-center border-2 border-white">
              3
            </div> */}
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}

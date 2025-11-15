/**
 * ChatSidebar - Inline AI assistant sidebar for itinerary page
 *
 * Features:
 * - Always visible alongside itinerary content
 * - Chat history with artifacts
 * - Sticky positioning with independent scroll
 * - Compact design for 30% width
 */

import { motion } from 'framer-motion';
import { Bot, Minimize2, Maximize2 } from 'lucide-react';
import { useState } from 'react';
import { ChatHistoryPanel } from './ChatHistoryPanel';
import { ArtifactsPanel } from './ArtifactsPanel';
import { ModalInput } from './ModalInput';
import { useAgent } from '../../contexts/AgentProvider';

export function ChatSidebar() {
  const { currentArtifact } = useAgent();
  const [isMinimized, setIsMinimized] = useState(false);

  if (isMinimized) {
    return (
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="sticky top-16 h-[calc(100vh-4rem)] w-16"
      >
        <button
          onClick={() => setIsMinimized(false)}
          className="w-full h-20 bg-teal-600 hover:bg-teal-700 text-white rounded-l-xl shadow-lg flex flex-col items-center justify-center gap-2 transition-colors"
          title="Expand AI Assistant"
        >
          <Bot className="w-6 h-6" />
          <Maximize2 className="w-4 h-4" />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] flex flex-col bg-white lg:border-l border-t lg:border-t-0 border-gray-200 shadow-xl"
    >
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 bg-gradient-to-r from-teal-600 to-blue-600 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <h2 className="font-semibold text-sm">AI Assistant</h2>
        </div>
        <button
          onClick={() => setIsMinimized(true)}
          className="p-1 hover:bg-white/20 rounded transition-colors"
          title="Minimize sidebar"
        >
          <Minimize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Content - flexible split between chat and artifacts */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {currentArtifact ? (
          <>
            {/* Chat history - 40% when artifact shown (better than 33%) */}
            <div className="flex-shrink-0 h-[40%] min-h-[200px] border-b border-gray-200 flex flex-col">
              <div className="flex-1 overflow-y-auto">
                <ChatHistoryPanel />
              </div>
            </div>

            {/* Artifacts - 60% section with scroll */}
            <div className="flex-1 min-h-0 overflow-y-auto bg-gray-50">
              <ArtifactsPanel />
            </div>
          </>
        ) : (
          /* Full chat when no artifact */
          <div className="flex-1 overflow-y-auto">
            <ChatHistoryPanel />
          </div>
        )}
      </div>

      {/* Input - always at bottom */}
      <div className="flex-shrink-0 border-t border-gray-200">
        <ModalInput />
      </div>
    </motion.div>
  );
}

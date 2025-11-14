/**
 * AgentModal - Full-Screen AI Assistant Modal
 *
 * Split-view interface:
 * - Left: Chat history (40%)
 * - Right: Interactive artifacts/results (60%)
 *
 * Mobile: Tabs instead of split-view
 */

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minimize2 } from 'lucide-react';
import { useAgent } from '../../contexts/AgentProvider';
import { ChatHistoryPanel } from './ChatHistoryPanel';
import { ArtifactsPanel } from './ArtifactsPanel';
import { ModalInput } from './ModalInput';

export function AgentModal() {
  const { isOpen, closeAgent, currentArtifact, isMinimized, toggleMinimize } = useAgent();
  const modalRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen || isMinimized) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC to close
      if (e.key === 'Escape') {
        e.preventDefault();
        closeAgent();
      }

      // Ctrl/Cmd + M to minimize
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        toggleMinimize();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isMinimized, closeAgent, toggleMinimize]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || isMinimized) return;

    // Focus modal on mount
    if (modalRef.current) {
      modalRef.current.focus();
    }

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, isMinimized]);

  // Don't render if not open or if minimized
  if (!isOpen || isMinimized) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeAgent}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          ref={modalRef}
          tabIndex={-1}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative w-full h-full max-w-[95vw] max-h-[95vh] m-4 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden focus:outline-none"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4 flex items-center justify-between border-b border-teal-800 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                <span className="text-2xl">🤖</span>
              </div>
              <div>
                <h2 id="modal-title" className="text-white font-bold text-xl">AI Travel Assistant</h2>
                <p className="text-teal-100 text-sm">Powered by Claude AI • Press ESC to close</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Minimize Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMinimize();
                }}
                className="p-2 hover:bg-teal-600 rounded-lg transition-colors"
                title="Minimize"
              >
                <Minimize2 className="w-5 h-5 text-white" />
              </button>

              {/* Close Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeAgent();
                }}
                className="p-2 hover:bg-teal-600 rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>

          {/* Split View Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Desktop: Split View (40% | 60%) */}
            <div className="hidden md:flex w-full">
              {/* Left: Chat History */}
              <div className="w-[40%] border-r border-gray-200 flex flex-col overflow-hidden">
                <ChatHistoryPanel />
              </div>

              {/* Right: Artifacts */}
              <div className="w-[60%] flex flex-col overflow-hidden">
                <ArtifactsPanel />
              </div>
            </div>

            {/* Mobile: Tabbed View (TODO: Implement tabs in Phase 5) */}
            <div className="md:hidden w-full flex flex-col overflow-hidden">
              {currentArtifact ? (
                <ArtifactsPanel />
              ) : (
                <ChatHistoryPanel />
              )}
            </div>
          </div>

          {/* Input Area */}
          <div className="flex-shrink-0 border-t border-gray-200">
            <ModalInput />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

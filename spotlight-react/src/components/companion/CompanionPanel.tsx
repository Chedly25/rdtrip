/**
 * CompanionPanel - Always-visible AI Travel Companion
 *
 * A sidebar panel that provides an ambient, conversational AI assistant
 * for the Spotlight page. Unlike the modal-based agent, this is always
 * present and integrated into the main layout.
 *
 * Design: Follows the Wanderlust Editorial design system
 * - Width: 340px (desktop)
 * - Background: Warm cream (#FFFBF5)
 * - Warm black text, terracotta accents
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Compass,
  ChevronLeft,
  Sparkles,
  Loader2,
  X,
} from 'lucide-react';
import { useAgent, type AgentMessage } from '../../contexts/AgentProvider';

// ==================== MESSAGE COMPONENTS ====================

interface MessageBubbleProps {
  message: AgentMessage;
}

const AssistantMessage = ({ message }: MessageBubbleProps) => {
  return (
    <div className="flex gap-3 max-w-[85%]">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C45830] to-[#D4A853] flex items-center justify-center flex-shrink-0 shadow-sm">
        <Compass className="w-4 h-4 text-white" />
      </div>

      {/* Bubble */}
      <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-[#E8DFD3]">
        <p className="text-[15px] text-[#2C2417] leading-relaxed whitespace-pre-wrap">
          {message.content || (
            <span className="text-[#8B7355] italic">Thinking...</span>
          )}
        </p>
        {message.isStreaming && (
          <span className="inline-block w-1.5 h-4 bg-[#C45830] ml-0.5 animate-pulse" />
        )}
      </div>
    </div>
  );
};

const UserMessage = ({ message }: MessageBubbleProps) => {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] bg-[#2C2417] rounded-2xl rounded-tr-sm px-4 py-3">
        <p className="text-[15px] text-white leading-relaxed">
          {message.content}
        </p>
      </div>
    </div>
  );
};

const TypingIndicator = () => {
  return (
    <div className="flex gap-3 max-w-[85%]">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C45830] to-[#D4A853] flex items-center justify-center flex-shrink-0">
        <Compass className="w-4 h-4 text-white" />
      </div>
      <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-[#E8DFD3]">
        <div className="flex gap-1.5 items-center h-5">
          <span
            className="w-2 h-2 rounded-full bg-[#D4C4B0] animate-bounce"
            style={{ animationDelay: '0ms' }}
          />
          <span
            className="w-2 h-2 rounded-full bg-[#D4C4B0] animate-bounce"
            style={{ animationDelay: '150ms' }}
          />
          <span
            className="w-2 h-2 rounded-full bg-[#D4C4B0] animate-bounce"
            style={{ animationDelay: '300ms' }}
          />
        </div>
      </div>
    </div>
  );
};

// ==================== QUICK SUGGESTIONS ====================

interface QuickSuggestion {
  label: string;
  prompt: string;
}

const defaultSuggestions: QuickSuggestion[] = [
  { label: 'Best restaurants', prompt: 'What are the best restaurants in this city?' },
  { label: 'Hidden gems', prompt: 'Show me some hidden gems off the beaten path' },
  { label: 'Day activities', prompt: 'Suggest activities for tomorrow' },
  { label: 'Weather check', prompt: "What's the weather forecast?" },
];

// ==================== COMPANION PANEL ====================

interface CompanionPanelProps {
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  className?: string;
}

export function CompanionPanel({
  isExpanded = true,
  onToggleExpand,
  className = '',
}: CompanionPanelProps) {
  const {
    messages,
    isLoading,
    sendMessage,
    activeTools,
  } = useAgent();

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle message submission
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const message = inputValue.trim();
    setInputValue('');
    await sendMessage(message);
  };

  // Handle quick suggestion click
  const handleSuggestionClick = (suggestion: QuickSuggestion) => {
    setInputValue(suggestion.prompt);
    inputRef.current?.focus();
  };

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Empty state - show welcome message
  const showEmptyState = messages.length === 0;

  return (
    <motion.div
      initial={{ x: isExpanded ? 0 : 340 }}
      animate={{ x: isExpanded ? 0 : 340 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className={`
        w-[340px] h-full
        bg-[#FFFBF5]
        border-l border-[#E8DFD3]
        flex flex-col
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8DFD3] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#C45830] to-[#D4A853] flex items-center justify-center shadow-sm">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-[15px] text-[#2C2417]">
              Travel Companion
            </h2>
            <p className="text-xs text-[#8B7355]">
              {isLoading ? 'Thinking...' : 'Here to help'}
            </p>
          </div>
        </div>

        {/* Minimize button */}
        {onToggleExpand && (
          <button
            onClick={onToggleExpand}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8B7355] hover:bg-[#F5F0E8] hover:text-[#2C2417] transition-colors"
            title="Minimize"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-hide">
        {showEmptyState ? (
          /* Welcome State */
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FFF0EB] to-[#F5F0E8] flex items-center justify-center mb-4">
              <Sparkles className="w-7 h-7 text-[#C45830]" />
            </div>
            <h3 className="text-lg font-semibold text-[#2C2417] mb-2">
              Your Travel Companion
            </h3>
            <p className="text-sm text-[#8B7355] mb-6 max-w-[250px]">
              I know everything about your destinations. Ask me anything about activities,
              restaurants, weather, or local tips!
            </p>

            {/* Quick Suggestions */}
            <div className="w-full space-y-2">
              <p className="text-xs font-medium text-[#8B7355] uppercase tracking-wide mb-2">
                Try asking
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {defaultSuggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-3 py-1.5 bg-[#F5F0E8] border border-[#E8DFD3] rounded-full text-sm text-[#2C2417] hover:bg-[#E8DFD3] transition-colors"
                  >
                    {suggestion.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Message Thread */
          <>
            {messages.map((message) => (
              <div key={message.id}>
                {message.role === 'user' ? (
                  <UserMessage message={message} />
                ) : message.role === 'assistant' ? (
                  <AssistantMessage message={message} />
                ) : null}
              </div>
            ))}

            {/* Typing indicator when loading without content yet */}
            {isLoading &&
              messages.length > 0 &&
              messages[messages.length - 1].role === 'user' && (
                <TypingIndicator />
              )}

            {/* Tool execution status */}
            <AnimatePresence>
              {activeTools.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 px-3 py-2 bg-[#FFF0EB] rounded-lg border border-[#E8DFD3]"
                >
                  <Loader2 className="w-4 h-4 text-[#C45830] animate-spin" />
                  <span className="text-sm text-[#8B7355]">
                    {activeTools[0].name === 'searchActivities'
                      ? 'Searching for activities...'
                      : activeTools[0].name === 'searchHotels'
                      ? 'Finding hotels...'
                      : activeTools[0].name === 'checkWeather'
                      ? 'Checking weather...'
                      : `Running ${activeTools[0].name}...`}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-[#E8DFD3] bg-[#FFFBF5] flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              disabled={isLoading}
              className="
                w-full
                px-4 py-3
                bg-white
                border border-[#E8DFD3]
                rounded-xl
                text-[15px] text-[#2C2417]
                placeholder:text-[#D4C4B0]
                focus:outline-none focus:ring-2 focus:ring-[#C45830] focus:border-transparent
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all
              "
            />
          </div>
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="
              w-11 h-11
              bg-[#C45830]
              rounded-xl
              flex items-center justify-center
              text-white
              hover:bg-[#A03820]
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
              shadow-[0_4px_14px_rgba(196,88,48,0.25)]
            "
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );
}

// ==================== COLLAPSED COMPANION TAB ====================

interface CompanionTabProps {
  onClick: () => void;
  hasUnread?: boolean;
}

export function CompanionTab({ onClick, hasUnread = false }: CompanionTabProps) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ x: 100 }}
      animate={{ x: 0 }}
      exit={{ x: 100 }}
      className="
        fixed right-0 top-1/2 -translate-y-1/2
        w-12 h-24
        bg-[#FFFBF5]
        border border-r-0 border-[#E8DFD3]
        rounded-l-2xl
        flex flex-col items-center justify-center gap-2
        shadow-lg
        hover:bg-[#F5F0E8]
        transition-colors
        z-40
      "
    >
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C45830] to-[#D4A853] flex items-center justify-center relative">
        <Compass className="w-4 h-4 text-white" />
        {hasUnread && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#B54A4A] rounded-full border-2 border-[#FFFBF5]" />
        )}
      </div>
      <ChevronLeft className="w-4 h-4 text-[#8B7355] rotate-180" />
    </motion.button>
  );
}

// ==================== PROACTIVE BUBBLE ====================

interface ProactiveBubbleProps {
  message: string;
  onAccept: () => void;
  onDismiss: () => void;
  priority?: 'low' | 'high';
}

export function ProactiveBubble({
  message,
  onAccept,
  onDismiss,
  priority = 'low',
}: ProactiveBubbleProps) {
  const isHighPriority = priority === 'high';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className={`
        fixed bottom-24 right-6
        max-w-[300px]
        bg-white
        rounded-2xl
        shadow-lg
        border
        p-4
        z-50
        ${isHighPriority ? 'border-2 border-[#D4A853]' : 'border-[#E8DFD3]'}
      `}
    >
      {/* Close button */}
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 text-[#D4C4B0] hover:text-[#8B7355] transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Message */}
      <p className="text-[14px] text-[#2C2417] pr-6 leading-relaxed">
        {message}
      </p>

      {/* Actions */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={onAccept}
          className="px-3 py-1.5 bg-[#C45830] text-white rounded-lg text-sm font-medium hover:bg-[#A03820] transition-colors"
        >
          Yes please
        </button>
        <button
          onClick={onDismiss}
          className="px-3 py-1.5 text-[#8B7355] text-sm hover:text-[#2C2417] transition-colors"
        >
          Later
        </button>
      </div>
    </motion.div>
  );
}

export default CompanionPanel;

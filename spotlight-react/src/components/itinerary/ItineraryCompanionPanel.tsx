/**
 * ItineraryCompanionPanel
 *
 * WI-5.8: Chat interface for AI-powered itinerary modifications
 *
 * Design: Travel Journal aesthetic - warm, editorial, conversational
 * - Feels like chatting with a knowledgeable friend
 * - Quick suggestion chips for common actions
 * - Action confirmation for itinerary changes
 * - Mobile-first expandable panel
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Send,
  ChevronUp,
  Sparkles,
  Calendar,
  Sun,
  Lightbulb,
  Clock,
  Shuffle,
  X,
  Check,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type {
  CompanionMessage,
  ItineraryAction,
  ItineraryIssue,
  QuickSuggestion,
} from '../../services/itineraryCompanion';

// ============================================================================
// Types
// ============================================================================

interface ItineraryCompanionPanelProps {
  /** Chat messages */
  messages: CompanionMessage[];
  /** Loading state */
  isLoading?: boolean;
  /** Error message */
  error?: string | null;
  /** Quick suggestion chips */
  quickSuggestions?: QuickSuggestion[];
  /** Detected issues */
  issues?: ItineraryIssue[];
  /** Proactive message to show */
  proactiveMessage?: string | null;
  /** Pending actions awaiting confirmation */
  pendingActions?: ItineraryAction[];
  /** Panel expanded state */
  isExpanded?: boolean;
  /** Send message callback */
  onSendMessage: (message: string) => void;
  /** Toggle expanded callback */
  onToggleExpanded?: () => void;
  /** Execute pending actions */
  onExecuteActions?: () => void;
  /** Clear pending actions */
  onClearActions?: () => void;
  /** Dismiss proactive message */
  onDismissProactive?: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const ICON_MAP: Record<QuickSuggestion['icon'], typeof Calendar> = {
  calendar: Calendar,
  sun: Sun,
  lightbulb: Lightbulb,
  clock: Clock,
  shuffle: Shuffle,
};

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Assistant message bubble with markdown support
 */
function AssistantMessage({
  content,
  isStreaming,
}: {
  content: string;
  isStreaming?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="flex gap-3 max-w-[90%]"
    >
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-terracotta to-terracotta/70 flex items-center justify-center shadow-sm">
        <Sparkles className="w-4 h-4 text-white" />
      </div>

      {/* Message content */}
      <div className="flex-1 min-w-0">
        <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border border-stone-100">
          <div className="prose prose-sm max-w-none text-stone-800 leading-relaxed">
            <ReactMarkdown
              components={{
                p: ({ children }) => (
                  <p className="mb-2 last:mb-0 text-sm leading-relaxed">{children}</p>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-stone-900">{children}</strong>
                ),
                em: ({ children }) => (
                  <em className="italic text-stone-600">{children}</em>
                ),
                ul: ({ children }) => (
                  <ul className="list-none space-y-1.5 my-2">{children}</ul>
                ),
                li: ({ children }) => (
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-terracotta mt-1">•</span>
                    <span>{children}</span>
                  </li>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>

          {/* Streaming indicator */}
          {isStreaming && (
            <div className="flex items-center gap-1 mt-2 pt-2 border-t border-stone-100">
              <TypingDots />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * User message bubble
 */
function UserMessage({ content }: { content: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="flex justify-end"
    >
      <div className="max-w-[85%] bg-gradient-to-br from-terracotta to-terracotta/90 text-white rounded-2xl rounded-br-md px-4 py-3 shadow-sm">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>
    </motion.div>
  );
}

/**
 * Animated typing indicator
 */
function TypingDots() {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-terracotta"
          animate={{
            y: [0, -4, 0],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
      <span className="text-xs text-stone-400 ml-1">thinking...</span>
    </div>
  );
}

/**
 * Full typing indicator
 */
function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="flex gap-3"
    >
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-terracotta to-terracotta/70 flex items-center justify-center">
        <Sparkles className="w-4 h-4 text-white" />
      </div>
      <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border border-stone-100">
        <TypingDots />
      </div>
    </motion.div>
  );
}

/**
 * Quick suggestion chip
 */
function QuickSuggestionChip({
  suggestion,
  onClick,
}: {
  suggestion: QuickSuggestion;
  onClick: () => void;
}) {
  const Icon = ICON_MAP[suggestion.icon] || Lightbulb;

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 bg-white border border-stone-200 rounded-full text-sm text-stone-700 hover:border-terracotta/50 hover:bg-terracotta/5 transition-colors shadow-sm"
    >
      <Icon className="w-4 h-4 text-terracotta" />
      <span className="whitespace-nowrap">{suggestion.label}</span>
    </motion.button>
  );
}

/**
 * Action confirmation bar
 */
function ActionConfirmationBar({
  actions,
  onConfirm,
  onCancel,
}: {
  actions: ItineraryAction[];
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-amber-50 to-amber-50/95 border-t border-amber-200"
    >
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-900">
            {actions.length === 1
              ? actions[0].description
              : `${actions.length} changes ready`}
          </p>
          <p className="text-xs text-amber-700 mt-0.5">
            Apply these changes to your itinerary?
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="p-2 rounded-lg hover:bg-amber-100 text-amber-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onConfirm}
            className="flex items-center gap-2 px-4 py-2 bg-terracotta text-white rounded-xl font-medium shadow-sm"
          >
            <Check className="w-4 h-4" />
            Apply
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Proactive suggestion bubble
 */
function ProactiveBubble({
  message,
  onDismiss,
  onExpand,
}: {
  message: string;
  onDismiss: () => void;
  onExpand: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      className="absolute bottom-20 right-4 max-w-xs"
    >
      <div className="bg-white rounded-2xl shadow-xl border border-stone-100 p-4 relative">
        {/* Close button */}
        <button
          onClick={onDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-stone-100 text-stone-400"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="flex items-start gap-3 pr-6">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-stone-700">{message}</p>
            <button
              onClick={onExpand}
              className="text-sm text-terracotta font-medium mt-2 hover:text-terracotta/80"
            >
              Let's fix it →
            </button>
          </div>
        </div>

        {/* Pointer */}
        <div className="absolute -bottom-2 right-8 w-4 h-4 bg-white border-b border-r border-stone-100 transform rotate-45" />
      </div>
    </motion.div>
  );
}

/**
 * Issue indicator badge
 */
function IssueBadge({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center"
    >
      <span className="text-xs font-bold text-white">{count}</span>
    </motion.div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ItineraryCompanionPanel({
  messages,
  isLoading = false,
  error,
  quickSuggestions = [],
  issues = [],
  proactiveMessage,
  pendingActions = [],
  isExpanded = false,
  onSendMessage,
  onToggleExpanded,
  onExecuteActions,
  onClearActions,
  onDismissProactive,
}: ItineraryCompanionPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const [showProactive, setShowProactive] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isExpanded]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputValue.trim() || isLoading) return;

      onSendMessage(inputValue.trim());
      setInputValue('');
    },
    [inputValue, isLoading, onSendMessage]
  );

  const handleQuickSuggestion = useCallback(
    (suggestion: QuickSuggestion) => {
      onSendMessage(suggestion.prompt);
    },
    [onSendMessage]
  );

  const handleDismissProactive = useCallback(() => {
    setShowProactive(false);
    onDismissProactive?.();
  }, [onDismissProactive]);

  const handleExpandFromProactive = useCallback(() => {
    setShowProactive(false);
    onToggleExpanded?.();
  }, [onToggleExpanded]);

  const warningCount = issues.filter((i) => i.severity !== 'info').length;

  return (
    <>
      {/* Proactive bubble (when collapsed) */}
      <AnimatePresence>
        {!isExpanded && showProactive && proactiveMessage && (
          <ProactiveBubble
            message={proactiveMessage}
            onDismiss={handleDismissProactive}
            onExpand={handleExpandFromProactive}
          />
        )}
      </AnimatePresence>

      {/* Main panel */}
      <motion.div
        initial={false}
        animate={{
          height: isExpanded ? 420 : 64,
        }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 bg-stone-50 rounded-t-3xl shadow-2xl border-t border-stone-200 z-40 overflow-hidden"
      >
        {/* Header - always visible */}
        <button
          onClick={onToggleExpanded}
          className="w-full px-6 py-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-terracotta/20 to-gold/20 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-terracotta" />
              <IssueBadge count={warningCount} />
            </div>
            <div className="text-left">
              <h3
                className="text-base font-semibold text-stone-900"
                style={{ fontFamily: "'Fraunces', Georgia, serif" }}
              >
                Trip Assistant
              </h3>
              <p className="text-xs text-stone-500">
                {isLoading
                  ? 'Thinking...'
                  : isExpanded
                  ? 'Ask me to modify your itinerary'
                  : 'Tap to chat about your trip'}
              </p>
            </div>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronUp className="w-5 h-5 text-stone-400" />
          </motion.div>
        </button>

        {/* Expanded content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col h-[calc(100%-64px)]"
            >
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
                {messages.map((message) =>
                  message.role === 'assistant' ? (
                    <AssistantMessage key={message.id} content={message.content} />
                  ) : (
                    <UserMessage key={message.id} content={message.content} />
                  )
                )}

                {/* Loading indicator */}
                {isLoading && <TypingIndicator />}

                {/* Error message */}
                {error && (
                  <div className="flex items-center gap-2 text-rose-600 text-sm bg-rose-50 px-3 py-2 rounded-lg">
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick suggestions */}
              {quickSuggestions.length > 0 && messages.length <= 2 && (
                <div className="px-4 pb-3">
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {quickSuggestions.map((suggestion) => (
                      <QuickSuggestionChip
                        key={suggestion.id}
                        suggestion={suggestion}
                        onClick={() => handleQuickSuggestion(suggestion)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Input area */}
              <div className="relative">
                {/* Action confirmation overlay */}
                <AnimatePresence>
                  {pendingActions.length > 0 && (
                    <ActionConfirmationBar
                      actions={pendingActions}
                      onConfirm={onExecuteActions || (() => {})}
                      onCancel={onClearActions || (() => {})}
                    />
                  )}
                </AnimatePresence>

                {/* Input form */}
                <form
                  onSubmit={handleSubmit}
                  className="px-4 py-3 border-t border-stone-200 bg-white"
                >
                  <div className="flex items-center gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Ask about your itinerary..."
                      disabled={isLoading}
                      className="flex-1 px-4 py-3 bg-stone-100 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-terracotta/30 disabled:opacity-50"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      disabled={!inputValue.trim() || isLoading}
                      className="w-12 h-12 rounded-xl bg-gradient-to-br from-terracotta to-terracotta/90 text-white flex items-center justify-center shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </motion.button>
                  </div>
                </form>

                {/* Safe area */}
                <div className="h-safe-bottom bg-white" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}

// ============================================================================
// Exports
// ============================================================================

export type { ItineraryCompanionPanelProps };

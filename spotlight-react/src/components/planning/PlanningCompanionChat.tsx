/**
 * PlanningCompanionChat
 *
 * WI-3.3: Chat interface for the planning phase companion
 *
 * Design Direction: Warm, editorial, travel-journal aesthetic
 * - Feels like chatting with a knowledgeable friend
 * - Assistant messages have a subtle "handwritten note" quality
 * - Smooth animations throughout
 * - Mobile-first with expandable panel
 *
 * Architecture:
 * - Uses usePlanningCompanion hook for state
 * - Integrates with discovery store for context
 * - Renders quick action chips from suggestions
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import {
  MessageCircle,
  Send,
  ChevronUp,
  ChevronDown,
  Sparkles,
  MapPin,
  Utensils,
  Camera,
  Clock,
  X,
  Loader2,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { usePlanningCompanion, type ProactiveSuggestion } from '../../hooks/usePlanningCompanion';
import type { CompanionSuggestion } from '../../services/planningCompanion';

// ============================================================================
// Types
// ============================================================================

interface PlanningCompanionChatProps {
  /** Whether on desktop (sidebar) or mobile (bottom sheet) */
  isDesktop?: boolean;
  /** Initial expanded state */
  defaultExpanded?: boolean;
  /** Callback when panel state changes */
  onExpandedChange?: (expanded: boolean) => void;
}

// ============================================================================
// Constants
// ============================================================================

const MOBILE_COLLAPSED_HEIGHT = 80;
const MOBILE_EXPANDED_HEIGHT = 420;

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Message bubble for assistant messages
 * Warm, friendly styling with subtle editorial feel
 */
function AssistantMessage({ content, isStreaming }: { content: string; isStreaming?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="flex gap-3 max-w-[90%]"
    >
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-rui-sage to-rui-sage/70 flex items-center justify-center shadow-sm">
        <Sparkles className="w-4 h-4 text-white" />
      </div>

      {/* Message content */}
      <div className="flex-1 min-w-0">
        <div
          className="
            bg-white rounded-2xl rounded-tl-md
            px-4 py-3
            shadow-sm
            border border-rui-grey-5
          "
        >
          <div className="prose prose-sm max-w-none text-rui-black leading-relaxed">
            <ReactMarkdown
              components={{
                p: ({ children }) => (
                  <p className="mb-2 last:mb-0 text-body-2 leading-relaxed">{children}</p>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-rui-black">{children}</strong>
                ),
                em: ({ children }) => (
                  <em className="italic text-rui-grey-70">{children}</em>
                ),
                ul: ({ children }) => (
                  <ul className="list-none space-y-1.5 my-2">{children}</ul>
                ),
                li: ({ children }) => (
                  <li className="flex items-start gap-2 text-body-2">
                    <span className="text-rui-accent mt-1">•</span>
                    <span>{children}</span>
                  </li>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    className="text-rui-accent hover:text-rui-accent/80 underline underline-offset-2"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>

          {/* Streaming indicator */}
          {isStreaming && (
            <div className="flex items-center gap-1 mt-2 pt-2 border-t border-rui-grey-5">
              <TypingDots />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Message bubble for user messages
 * Clean, modern styling aligned right
 */
function UserMessage({ content }: { content: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="flex justify-end"
    >
      <div
        className="
          max-w-[85%]
          bg-rui-accent text-white
          rounded-2xl rounded-br-md
          px-4 py-3
          shadow-sm
        "
      >
        <p className="text-body-2 leading-relaxed whitespace-pre-wrap">
          {content}
        </p>
      </div>
    </motion.div>
  );
}

/**
 * Animated typing indicator
 * Three dots with staggered bounce animation
 */
function TypingDots() {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-rui-sage"
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
      <span className="text-body-3 text-rui-grey-50 ml-1">thinking...</span>
    </div>
  );
}

/**
 * Full typing indicator message
 */
function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="flex gap-3"
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-rui-sage to-rui-sage/70 flex items-center justify-center">
        <Sparkles className="w-4 h-4 text-white" />
      </div>
      <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border border-rui-grey-5">
        <TypingDots />
      </div>
    </motion.div>
  );
}

/**
 * Quick action chip for suggestions
 */
function QuickActionChip({
  suggestion,
  onAction,
  onDismiss,
}: {
  suggestion: CompanionSuggestion;
  onAction: () => void;
  onDismiss: () => void;
}) {
  const getIcon = () => {
    switch (suggestion.type) {
      case 'add_city':
        return <MapPin className="w-3.5 h-3.5" />;
      case 'explore_places':
        return <Camera className="w-3.5 h-3.5" />;
      case 'adjust_nights':
        return <Clock className="w-3.5 h-3.5" />;
      default:
        return <Sparkles className="w-3.5 h-3.5" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      className="
        flex items-center gap-2
        pl-3 pr-2 py-2
        bg-rui-golden/10 border border-rui-golden/30
        rounded-full
        text-body-3
      "
    >
      <span className="text-rui-golden">{getIcon()}</span>
      <span className="text-rui-black truncate max-w-[200px]">
        {suggestion.message.length > 50
          ? suggestion.message.slice(0, 50) + '...'
          : suggestion.message}
      </span>

      {suggestion.action && (
        <button
          onClick={onAction}
          className="
            px-2.5 py-1 rounded-full
            bg-rui-golden/20 hover:bg-rui-golden/30
            text-rui-black text-body-3 font-medium
            transition-colors duration-150
          "
        >
          {suggestion.action.label}
        </button>
      )}

      <button
        onClick={onDismiss}
        className="
          p-1 rounded-full
          hover:bg-rui-grey-10
          text-rui-grey-40 hover:text-rui-grey-60
          transition-colors duration-150
        "
      >
        <X className="w-3 h-3" />
      </button>
    </motion.div>
  );
}

/**
 * Proactive suggestion banner (WI-3.5)
 *
 * Design: Warm, travel-journal postcard aesthetic
 * - Gentle slide-in from bottom
 * - Soft shadow and warm gradient
 * - Friendly, non-intrusive appearance
 */
function ProactiveSuggestionBanner({
  suggestion,
  onAct,
  onDismiss,
}: {
  suggestion: ProactiveSuggestion;
  onAct: () => void;
  onDismiss: () => void;
}) {
  // Icon based on trigger type
  const getIcon = () => {
    switch (suggestion.trigger) {
      case 'city_added':
        return <MapPin className="w-4 h-4" />;
      case 'cities_removed':
        return <Sparkles className="w-4 h-4" />;
      case 'idle_browsing':
        return <MessageCircle className="w-4 h-4" />;
      case 'trip_nearly_ready':
        return <Sparkles className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 25,
      }}
      className="
        relative mx-4 mb-3
        bg-gradient-to-br from-rui-cream via-white to-rui-golden/5
        rounded-2xl
        shadow-lg shadow-rui-black/5
        border border-rui-golden/20
        overflow-hidden
      "
    >
      {/* Subtle decorative pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Content */}
      <div className="relative px-4 py-3.5">
        <div className="flex items-start gap-3">
          {/* Icon with gentle pulse */}
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="
              flex-shrink-0 w-9 h-9 mt-0.5
              rounded-xl
              bg-gradient-to-br from-rui-sage to-rui-sage/80
              flex items-center justify-center
              shadow-sm shadow-rui-sage/20
            "
          >
            <span className="text-white">{getIcon()}</span>
          </motion.div>

          {/* Message */}
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-body-2 text-rui-black leading-relaxed pr-6">
              {suggestion.message}
            </p>

            {/* Actions */}
            {suggestion.action && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="flex items-center gap-2 mt-3"
              >
                <button
                  onClick={onAct}
                  className="
                    px-4 py-1.5 rounded-lg
                    bg-rui-sage text-white
                    text-body-3 font-medium
                    hover:bg-rui-sage/90
                    active:scale-[0.98]
                    transition-all duration-150
                    shadow-sm shadow-rui-sage/20
                  "
                >
                  {suggestion.action.label}
                </button>

                <button
                  onClick={onDismiss}
                  className="
                    px-3 py-1.5 rounded-lg
                    text-rui-grey-50 hover:text-rui-grey-70
                    text-body-3
                    hover:bg-rui-grey-5
                    transition-all duration-150
                  "
                >
                  Maybe later
                </button>
              </motion.div>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={onDismiss}
            className="
              absolute top-3 right-3
              p-1.5 rounded-full
              text-rui-grey-40 hover:text-rui-grey-60
              hover:bg-rui-grey-5
              transition-colors duration-150
            "
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="h-0.5 bg-gradient-to-r from-rui-sage/30 via-rui-golden/40 to-rui-sage/30" />
    </motion.div>
  );
}

/**
 * Chat input with send button
 */
function ChatInput({
  onSend,
  isLoading,
  placeholder = "Ask me anything about your trip...",
}: {
  onSend: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
}) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = useCallback(() => {
    if (!value.trim() || isLoading) return;
    onSend(value.trim());
    setValue('');
  }, [value, isLoading, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-white border-t border-rui-grey-10">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isLoading}
        className="
          flex-1 px-4 py-2.5
          bg-rui-grey-5 rounded-xl
          text-body-2 text-rui-black
          placeholder:text-rui-grey-40
          border-2 border-transparent
          focus:border-rui-accent/30 focus:bg-white
          focus:outline-none
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200
        "
      />
      <motion.button
        onClick={handleSend}
        disabled={!value.trim() || isLoading}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="
          w-10 h-10 rounded-xl
          bg-rui-accent text-white
          flex items-center justify-center
          shadow-sm
          disabled:bg-rui-grey-20 disabled:text-rui-grey-40
          disabled:shadow-none disabled:cursor-not-allowed
          transition-colors duration-200
        "
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Send className="w-5 h-5" />
        )}
      </motion.button>
    </div>
  );
}

/**
 * Welcome message shown when chat is empty
 */
function WelcomeMessage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="flex flex-col items-center justify-center py-8 px-6 text-center"
    >
      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rui-sage to-rui-sage/70 flex items-center justify-center mb-4 shadow-lg shadow-rui-sage/20">
        <Sparkles className="w-7 h-7 text-white" />
      </div>

      <h3 className="font-display text-lg font-semibold text-rui-black mb-2">
        Hey! I'm here to help
      </h3>

      <p className="text-body-2 text-rui-grey-60 max-w-[280px] leading-relaxed">
        Ask me about cities, hidden gems, or what to do. I've been everywhere and I have opinions.
      </p>

      {/* Suggestion pills */}
      <div className="flex flex-wrap justify-center gap-2 mt-5">
        {[
          { icon: MapPin, text: "What's Florence like?" },
          { icon: Utensils, text: "Best food in Italy?" },
          { icon: Camera, text: "Hidden gems nearby" },
        ].map(({ icon: Icon, text }) => (
          <button
            key={text}
            className="
              flex items-center gap-1.5
              px-3 py-1.5 rounded-full
              bg-rui-grey-5 hover:bg-rui-accent/10
              text-body-3 text-rui-grey-60 hover:text-rui-accent
              border border-rui-grey-10 hover:border-rui-accent/30
              transition-all duration-200
            "
          >
            <Icon className="w-3.5 h-3.5" />
            {text}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function PlanningCompanionChat({
  isDesktop = false,
  defaultExpanded = false,
  onExpandedChange,
}: PlanningCompanionChatProps) {
  const {
    conversation,
    isLoading,
    suggestions,
    dismissSuggestion,
    sendMessage,
    // Proactive suggestions (WI-3.5)
    proactiveSuggestion,
    dismissProactiveSuggestion,
    actOnProactiveSuggestion,
  } = usePlanningCompanion();

  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mobile drag state
  const y = useMotionValue(0);
  const dragAmount = MOBILE_EXPANDED_HEIGHT - MOBILE_COLLAPSED_HEIGHT;
  const height = useTransform(
    y,
    [-dragAmount, 0],
    [MOBILE_EXPANDED_HEIGHT, MOBILE_COLLAPSED_HEIGHT]
  );

  // Auto-scroll to latest message
  useEffect(() => {
    if (messagesEndRef.current && conversation.messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation.messages]);

  // Handle expansion change
  const handleExpandedChange = useCallback((expanded: boolean) => {
    setIsExpanded(expanded);
    onExpandedChange?.(expanded);
  }, [onExpandedChange]);

  // Handle mobile drag
  const handleDragEnd = (_: any, info: { velocity: { y: number }; offset: { y: number } }) => {
    const shouldExpand = info.velocity.y < -500 || info.offset.y < -dragAmount / 2;
    const shouldCollapse = info.velocity.y > 500 || info.offset.y > dragAmount / 2;

    if (shouldExpand) {
      animate(y, -dragAmount, { type: 'spring', stiffness: 300, damping: 30 });
      handleExpandedChange(true);
    } else if (shouldCollapse) {
      animate(y, 0, { type: 'spring', stiffness: 300, damping: 30 });
      handleExpandedChange(false);
    } else {
      animate(y, isExpanded ? -dragAmount : 0, { type: 'spring', stiffness: 300, damping: 30 });
    }
  };

  // Toggle expansion
  const toggleExpanded = useCallback(() => {
    const newExpanded = !isExpanded;
    if (!isDesktop) {
      animate(y, newExpanded ? -dragAmount : 0, { type: 'spring', stiffness: 300, damping: 30 });
    }
    handleExpandedChange(newExpanded);
  }, [isExpanded, isDesktop, y, dragAmount, handleExpandedChange]);

  // Handle suggestion action
  const handleSuggestionAction = useCallback((suggestion: CompanionSuggestion, index: number) => {
    if (suggestion.action) {
      // Send the suggestion message to the companion
      sendMessage(suggestion.message);
    }
    dismissSuggestion(index);
  }, [sendMessage, dismissSuggestion]);

  // Render messages
  const renderMessages = () => (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      {conversation.messages.length === 0 ? (
        <WelcomeMessage />
      ) : (
        <>
          {conversation.messages.map((message) => (
            message.role === 'user' ? (
              <UserMessage key={message.id} content={message.content} />
            ) : (
              <AssistantMessage
                key={message.id}
                content={message.content}
                isStreaming={false}
              />
            )
          ))}

          {/* Typing indicator */}
          <AnimatePresence>
            {isLoading && <TypingIndicator />}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );

  // Render quick action suggestions
  const renderSuggestions = () => (
    <AnimatePresence>
      {suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="px-4 py-2 border-t border-rui-grey-10 bg-rui-cream/50 overflow-x-auto"
        >
          <div className="flex gap-2 pb-1">
            {suggestions.slice(0, 2).map((suggestion, index) => (
              <QuickActionChip
                key={`${suggestion.type}-${index}`}
                suggestion={suggestion}
                onAction={() => handleSuggestionAction(suggestion, index)}
                onDismiss={() => dismissSuggestion(index)}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Render proactive suggestion banner (WI-3.5)
  const renderProactiveSuggestion = () => (
    <AnimatePresence>
      {proactiveSuggestion && (
        <ProactiveSuggestionBanner
          suggestion={proactiveSuggestion}
          onAct={actOnProactiveSuggestion}
          onDismiss={dismissProactiveSuggestion}
        />
      )}
    </AnimatePresence>
  );

  // Desktop sidebar version
  if (isDesktop) {
    return (
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="
          flex flex-col h-full
          bg-rui-cream
          border-l border-rui-grey-10
        "
      >
        {/* Header */}
        <div className="flex-shrink-0 px-5 py-4 border-b border-rui-grey-10 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rui-sage to-rui-sage/70 flex items-center justify-center shadow-sm">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-rui-black">
                Planning Assistant
              </h2>
              <p className="text-body-3 text-rui-grey-50">
                Your travel companion
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {renderMessages()}

        {/* Proactive suggestion (WI-3.5) */}
        {renderProactiveSuggestion()}

        {/* Quick action suggestions */}
        {renderSuggestions()}

        {/* Input */}
        <ChatInput onSend={sendMessage} isLoading={isLoading} />
      </motion.div>
    );
  }

  // Mobile bottom sheet version
  return (
    <motion.div
      style={{ height }}
      className="
        fixed bottom-0 left-0 right-0
        bg-white rounded-t-3xl
        shadow-2xl shadow-black/10
        z-40
        flex flex-col
      "
    >
      {/* Drag handle */}
      <motion.div
        drag="y"
        dragConstraints={{ top: -dragAmount, bottom: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ y }}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing"
      >
        {/* Handle bar */}
        <div className="flex flex-col items-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-rui-grey-20" />
        </div>

        {/* Collapsed header */}
        <button
          onClick={toggleExpanded}
          className="w-full flex items-center justify-between px-4 pb-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rui-sage to-rui-sage/70 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-semibold text-rui-black">
              {conversation.messages.length === 0
                ? 'Ask me anything'
                : `${conversation.messages.length} messages`}
            </span>
          </div>

          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-rui-grey-50" />
          ) : (
            <ChevronUp className="w-5 h-5 text-rui-grey-50" />
          )}
        </button>
      </motion.div>

      {/* Content (only visible when expanded) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {renderMessages()}
            {renderProactiveSuggestion()}
            {renderSuggestions()}
            <ChatInput onSend={sendMessage} isLoading={isLoading} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================================
// Exports
// ============================================================================

export default PlanningCompanionChat;

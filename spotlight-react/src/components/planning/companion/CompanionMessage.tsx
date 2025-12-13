/**
 * CompanionMessage
 *
 * Renders individual messages in the companion chat.
 * Handles user messages, assistant messages, embedded cards,
 * and action buttons.
 *
 * Design: Wanderlust Editorial - warm earth tones, magazine feel
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Bot, User, Sparkles, Wrench, Loader2 } from 'lucide-react';
import type { CompanionMessage as CompanionMessageType, PlanCard, CompanionAction, Cluster } from '../../../types/planning';
import { CompanionCardDisplay } from './CompanionCardDisplay';
import { CompanionActions } from './CompanionActions';

// ============================================
// Types
// ============================================

interface CompanionMessageProps {
  message: CompanionMessageType;
  onAddCard?: (card: PlanCard, clusterId?: string) => void;
  onActionClick?: (action: CompanionAction) => void;
  clusters: Cluster[];
  isStreaming?: boolean;
  addedCardIds?: string[];
}

interface StreamingMessageProps {
  content: string;
  thinkingText?: string | null;
  toolCall?: { tool: string; args: Record<string, unknown> } | null;
  cards?: PlanCard[];
  actions?: CompanionAction[];
  onAddCard?: (card: PlanCard, clusterId?: string) => void;
  onActionClick?: (action: CompanionAction) => void;
  clusters: Cluster[];
  addedCardIds?: string[];
}

// ============================================
// Avatar Components
// ============================================

function AssistantAvatar() {
  return (
    <div className="
      flex-shrink-0 w-8 h-8 rounded-full
      bg-gradient-to-br from-[#C45830] to-[#D4724A]
      flex items-center justify-center
      shadow-md shadow-[#C45830]/20
    ">
      <Bot className="w-4 h-4 text-white" />
    </div>
  );
}

function UserAvatar() {
  return (
    <div className="
      flex-shrink-0 w-8 h-8 rounded-full
      bg-[#2C2417]
      flex items-center justify-center
    ">
      <User className="w-4 h-4 text-[#FFFBF5]" />
    </div>
  );
}

// ============================================
// Thinking Indicator
// ============================================

function ThinkingIndicator({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-2 text-sm text-[#8B7355] font-['Satoshi',sans-serif]"
    >
      <Sparkles className="w-4 h-4 text-[#C45830] animate-pulse" />
      <span>{text}</span>
    </motion.div>
  );
}

// ============================================
// Tool Call Indicator
// ============================================

function ToolCallIndicator({ tool }: { tool: string }) {
  const toolNames: Record<string, string> = {
    generate_cards: 'Finding places',
    search_places: 'Searching',
    calculate_distance: 'Calculating distance',
    analyze_plan: 'Analyzing your plan',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="
        inline-flex items-center gap-2 px-3 py-1.5
        bg-[#FEF3EE] rounded-lg
        text-xs text-[#C45830] font-['Satoshi',sans-serif]
      "
    >
      <Wrench className="w-3 h-3" />
      <span>{toolNames[tool] || tool}</span>
      <Loader2 className="w-3 h-3 animate-spin" />
    </motion.div>
  );
}

// ============================================
// Streaming Cursor
// ============================================

function StreamingCursor() {
  return (
    <motion.span
      animate={{ opacity: [1, 0] }}
      transition={{ duration: 0.5, repeat: Infinity }}
      className="inline-block w-0.5 h-4 bg-[#C45830] ml-0.5 -mb-0.5"
    />
  );
}

// ============================================
// User Message Component
// ============================================

function UserMessage({ content }: { content: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex justify-end gap-2"
    >
      <div className="
        max-w-[85%] sm:max-w-[75%]
        px-4 py-3 rounded-2xl rounded-br-sm
        bg-[#2C2417] text-[#FFFBF5]
        font-['Satoshi',sans-serif] text-sm leading-relaxed
      ">
        {content}
      </div>
      <UserAvatar />
    </motion.div>
  );
}

// ============================================
// Assistant Message Component
// ============================================

function AssistantMessage({
  content,
  cards,
  actions,
  onAddCard,
  onActionClick,
  clusters,
  isStreaming,
  addedCardIds,
}: {
  content: string;
  cards?: PlanCard[];
  actions?: CompanionAction[];
  onAddCard?: (card: PlanCard, clusterId?: string) => void;
  onActionClick?: (action: CompanionAction) => void;
  clusters: Cluster[];
  isStreaming?: boolean;
  addedCardIds?: string[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex gap-2"
    >
      <AssistantAvatar />
      <div className="flex-1 max-w-[85%] sm:max-w-[80%]">
        {/* Message bubble */}
        <div className="
          px-4 py-3 rounded-2xl rounded-tl-sm
          bg-[#F5F0E8]
          font-['Satoshi',sans-serif] text-sm text-[#2C2417] leading-relaxed
        ">
          {content}
          {isStreaming && <StreamingCursor />}
        </div>

        {/* Embedded cards */}
        {cards && cards.length > 0 && onAddCard && (
          <CompanionCardDisplay
            cards={cards}
            onAdd={onAddCard}
            clusters={clusters}
            addedCardIds={addedCardIds}
          />
        )}

        {/* Action buttons */}
        {actions && actions.length > 0 && onActionClick && !isStreaming && (
          <CompanionActions
            actions={actions}
            onActionClick={onActionClick}
          />
        )}
      </div>
    </motion.div>
  );
}

// ============================================
// Streaming Message Component
// ============================================

export function StreamingMessage({
  content,
  thinkingText,
  toolCall,
  cards,
  actions,
  onAddCard,
  onActionClick,
  clusters,
  addedCardIds,
}: StreamingMessageProps) {
  // If no content yet, show thinking/tool state
  if (!content && !cards?.length) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex gap-2"
      >
        <AssistantAvatar />
        <div className="flex-1">
          {thinkingText && <ThinkingIndicator text={thinkingText} />}
          {toolCall && <ToolCallIndicator tool={toolCall.tool} />}
          {!thinkingText && !toolCall && (
            <div className="flex items-center gap-2 text-sm text-[#8B7355]">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Thinking...</span>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <AssistantMessage
      content={content}
      cards={cards}
      actions={actions}
      onAddCard={onAddCard}
      onActionClick={onActionClick}
      clusters={clusters}
      isStreaming={true}
      addedCardIds={addedCardIds}
    />
  );
}

// ============================================
// Main Component
// ============================================

export function CompanionMessage({
  message,
  onAddCard,
  onActionClick,
  clusters,
  isStreaming,
  addedCardIds,
}: CompanionMessageProps) {
  if (message.role === 'user') {
    return <UserMessage content={message.content} />;
  }

  return (
    <AssistantMessage
      content={message.content}
      cards={message.cards}
      actions={message.actions}
      onAddCard={onAddCard}
      onActionClick={onActionClick}
      clusters={clusters}
      isStreaming={isStreaming}
      addedCardIds={addedCardIds}
    />
  );
}

export default memo(CompanionMessage);

/**
 * PlanningCompanion
 *
 * AI companion panel for Planning Mode.
 * A warm, conversational assistant that proactively suggests and helps.
 *
 * Philosophy: "A knowledgeable friend, not a robot"
 * - Casual, warm tone
 * - Proactive suggestions based on context
 * - Quick action chips for common requests
 * - Never blocks, only suggests
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  Lightbulb,
  Route,
  Gem,
  Coffee,
  Utensils,
  Moon,
} from 'lucide-react';
import { usePlanningStore } from '../../stores/planningStore';
import type { Slot, CompanionSuggestion } from '../../types/planning';

// ============================================================================
// Props Interface
// ============================================================================

interface PlanningCompanionProps {
  onClose?: () => void;
}

// ============================================================================
// Quick Action Definitions
// ============================================================================

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  action: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'optimize',
    label: 'Optimize route',
    icon: <Route className="w-3.5 h-3.5" />,
    description: 'Reorder activities to minimize walking',
    action: 'optimize_route',
  },
  {
    id: 'hidden-gems',
    label: 'Show hidden gems',
    icon: <Gem className="w-3.5 h-3.5" />,
    description: 'Find off-the-beaten-path spots',
    action: 'show_hidden_gems',
  },
  {
    id: 'fill-morning',
    label: 'Fill morning',
    icon: <Coffee className="w-3.5 h-3.5" />,
    description: 'Suggest activities for morning',
    action: 'fill_morning',
  },
  {
    id: 'dinner-spot',
    label: 'Find dinner',
    icon: <Utensils className="w-3.5 h-3.5" />,
    description: 'Recommend a restaurant for tonight',
    action: 'find_dinner',
  },
  {
    id: 'evening-plan',
    label: 'Plan evening',
    icon: <Moon className="w-3.5 h-3.5" />,
    description: 'Sunset spots and nightlife',
    action: 'plan_evening',
  },
];

// ============================================================================
// Component
// ============================================================================

export function PlanningCompanion({ onClose }: PlanningCompanionProps) {
  const {
    tripPlan,
    currentDayIndex,
    companionMessages,
    pendingSuggestions,
    toggleCompanion,
    addCompanionMessage,
    dismissSuggestion,
    getDayItems,
    getCurrentDay,
  } = usePlanningStore();

  // Use onClose prop if provided, otherwise use store toggle
  const handleClose = onClose || toggleCompanion;

  const [inputValue, setInputValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check viewport
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [companionMessages]);

  // Generate contextual suggestions
  const contextualSuggestions = useMemo(() => {
    if (!tripPlan) return [];

    const currentDay = getCurrentDay();
    if (!currentDay) return [];

    const suggestions: CompanionSuggestion[] = [];
    const dayItems = getDayItems(currentDayIndex);

    // Check for empty slots
    const emptySlots: Slot[] = [];
    if (currentDay.slots.morning.length === 0) emptySlots.push('morning');
    if (currentDay.slots.afternoon.length === 0) emptySlots.push('afternoon');
    if (currentDay.slots.evening.length === 0) emptySlots.push('evening');

    if (emptySlots.length > 0 && dayItems.length > 0) {
      const slotNames = emptySlots.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' and ');
      suggestions.push({
        id: 'empty-slots',
        trigger: 'empty_slots',
        message: `Your ${slotNames.toLowerCase()} ${emptySlots.length === 1 ? 'is' : 'are'} still open. Want me to suggest something?`,
        quick_actions: emptySlots.map(slot => ({
          label: `Fill ${slot}`,
          action: `fill_${slot}`,
        })),
      });
    }

    // Check for overpacked day
    const totalDuration = dayItems.reduce((sum, item) => sum + item.place.estimated_duration_mins, 0);
    if (totalDuration > 480) { // More than 8 hours
      suggestions.push({
        id: 'overpacked',
        trigger: 'overpacked_day',
        message: `That's a pretty packed day! You've got about ${Math.round(totalDuration / 60)} hours of activities. Want me to help balance it out?`,
        quick_actions: [
          { label: 'Move something', action: 'move_item' },
          { label: "It's fine", action: 'dismiss' },
        ],
      });
    }

    // Suggest hidden gems if none added
    const hasHiddenGems = dayItems.some(item => item.place.is_hidden_gem);
    if (dayItems.length >= 2 && !hasHiddenGems) {
      suggestions.push({
        id: 'no-hidden-gems',
        trigger: 'no_hidden_gems',
        message: `I noticed you haven't added any hidden gems yet. ${currentDay.city.name} has some amazing local spots most tourists miss!`,
        quick_actions: [
          { label: 'Show me', action: 'show_hidden_gems' },
          { label: 'Maybe later', action: 'dismiss' },
        ],
      });
    }

    return suggestions;
  }, [tripPlan, currentDayIndex, getCurrentDay, getDayItems]);

  // Handle send message
  const handleSend = () => {
    if (!inputValue.trim()) return;

    addCompanionMessage({
      type: 'user',
      content: inputValue.trim(),
    });

    // Simulate AI response (in real implementation, this would call an API)
    setTimeout(() => {
      addCompanionMessage({
        type: 'assistant',
        content: generateResponse(inputValue.trim()),
      });
    }, 800);

    setInputValue('');
  };

  // Handle quick action
  const handleQuickAction = (action: QuickAction) => {
    addCompanionMessage({
      type: 'user',
      content: action.label,
    });

    setTimeout(() => {
      addCompanionMessage({
        type: 'assistant',
        content: getQuickActionResponse(action.action),
      });
    }, 600);
  };

  // Desktop Sidebar
  if (isDesktop) {
    return (
      <motion.aside
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="fixed right-0 top-0 bottom-0 w-80 bg-rui-white border-l border-rui-grey-10 z-30 flex flex-col shadow-rui-side"
      >
        <CompanionHeader onClose={handleClose} />
        <CompanionContent
          messages={companionMessages}
          suggestions={contextualSuggestions}
          pendingSuggestions={pendingSuggestions}
          onDismissSuggestion={dismissSuggestion}
          messagesEndRef={messagesEndRef}
        />
        <QuickActions actions={QUICK_ACTIONS} onAction={handleQuickAction} />
        <CompanionInput
          value={inputValue}
          onChange={setInputValue}
          onSend={handleSend}
          inputRef={inputRef}
        />
      </motion.aside>
    );
  }

  // Mobile Bottom Sheet
  return (
    <>
      {/* Collapsed Pill */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.button
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            onClick={() => setIsExpanded(true)}
            className="fixed bottom-6 right-4 z-40 flex items-center gap-2 px-4 py-3 bg-rui-black text-white rounded-full shadow-rui-4"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-body-2 font-medium">Ask Companion</span>
            {contextualSuggestions.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rui-accent animate-pulse" />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expanded Sheet */}
      <AnimatePresence>
        {isExpanded && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-rui-black/30 backdrop-blur-sm z-40"
              onClick={() => setIsExpanded(false)}
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-rui-white rounded-t-3xl shadow-rui-4 max-h-[85vh] flex flex-col"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-rui-grey-20" />
              </div>

              <CompanionHeader onClose={() => setIsExpanded(false)} isMobile />
              <CompanionContent
                messages={companionMessages}
                suggestions={contextualSuggestions}
                pendingSuggestions={pendingSuggestions}
                onDismissSuggestion={dismissSuggestion}
                messagesEndRef={messagesEndRef}
              />
              <QuickActions actions={QUICK_ACTIONS.slice(0, 3)} onAction={handleQuickAction} />
              <CompanionInput
                value={inputValue}
                onChange={setInputValue}
                onSend={handleSend}
                inputRef={inputRef}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

interface CompanionHeaderProps {
  onClose: () => void;
  isMobile?: boolean;
}

function CompanionHeader({ onClose, isMobile }: CompanionHeaderProps) {
  return (
    <div className={`flex items-center justify-between px-4 ${isMobile ? 'py-2' : 'py-4'} border-b border-rui-grey-10`}>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-amber-600" />
        </div>
        <div>
          <h3 className="font-display text-base text-rui-black">Trip Companion</h3>
          <p className="text-body-3 text-rui-grey-50">Here to help</p>
        </div>
      </div>
      {!isMobile && (
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-rui-grey-40 hover:bg-rui-grey-5 hover:text-rui-grey-60 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

interface CompanionContentProps {
  messages: Array<{ id: string; type: string; content: string; timestamp: Date }>;
  suggestions: CompanionSuggestion[];
  pendingSuggestions: CompanionSuggestion[];
  onDismissSuggestion: (id: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

function CompanionContent({
  messages,
  suggestions,
  pendingSuggestions,
  onDismissSuggestion,
  messagesEndRef,
}: CompanionContentProps) {
  const allSuggestions = [...suggestions, ...pendingSuggestions.filter(s => !s.dismissed)];

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
      {/* Contextual Suggestions */}
      {allSuggestions.map((suggestion) => (
        <SuggestionCard
          key={suggestion.id}
          suggestion={suggestion}
          onDismiss={() => onDismissSuggestion(suggestion.id)}
        />
      ))}

      {/* Messages */}
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}

      <div ref={messagesEndRef} />
    </div>
  );
}

interface SuggestionCardProps {
  suggestion: CompanionSuggestion;
  onDismiss: () => void;
}

function SuggestionCard({ suggestion, onDismiss }: SuggestionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-xl p-4 border border-amber-200/40"
    >
      <div className="flex items-start gap-2">
        <Lightbulb className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-body-2 text-rui-grey-70">{suggestion.message}</p>
          {suggestion.quick_actions && suggestion.quick_actions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {suggestion.quick_actions.map((action, i) => (
                <button
                  key={i}
                  onClick={action.action === 'dismiss' ? onDismiss : undefined}
                  className={`
                    px-3 py-1.5 rounded-lg text-body-3 font-medium transition-colors
                    ${action.action === 'dismiss'
                      ? 'bg-white/60 text-rui-grey-50 hover:bg-white'
                      : 'bg-amber-500 text-white hover:bg-amber-600'
                    }
                  `}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="p-1 text-rui-grey-40 hover:text-rui-grey-60 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

interface MessageBubbleProps {
  message: { type: string; content: string; timestamp: Date };
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.type === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`
          max-w-[85%] px-4 py-2.5 rounded-2xl
          ${isUser
            ? 'bg-rui-accent text-white rounded-br-md'
            : 'bg-rui-grey-5 text-rui-grey-70 rounded-bl-md'
          }
        `}
      >
        <p className="text-body-2 whitespace-pre-wrap">{message.content}</p>
      </div>
    </motion.div>
  );
}

interface QuickActionsProps {
  actions: QuickAction[];
  onAction: (action: QuickAction) => void;
}

function QuickActions({ actions, onAction }: QuickActionsProps) {
  return (
    <div className="px-4 py-3 border-t border-rui-grey-10">
      <p className="text-body-3 text-rui-grey-50 mb-2">Quick actions</p>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => onAction(action)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rui-grey-5 text-rui-grey-60 text-body-3 font-medium hover:bg-rui-grey-10 hover:text-rui-black transition-colors"
            title={action.description}
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

interface CompanionInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

function CompanionInput({ value, onChange, onSend, inputRef }: CompanionInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="px-4 py-3 pb-safe-bottom border-t border-rui-grey-10">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about your trip..."
          className="flex-1 px-4 py-2.5 rounded-xl border border-rui-grey-20 bg-rui-grey-2 text-body-2 text-rui-black placeholder:text-rui-grey-40 focus:outline-none focus:ring-2 focus:ring-rui-accent/30 focus:border-rui-accent"
        />
        <button
          onClick={onSend}
          disabled={!value.trim()}
          className={`
            p-2.5 rounded-xl transition-all
            ${value.trim()
              ? 'bg-rui-accent text-white hover:bg-rui-accent/90'
              : 'bg-rui-grey-10 text-rui-grey-40 cursor-not-allowed'
            }
          `}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Response Generators (Placeholder - would be AI in production)
// ============================================================================

function generateResponse(input: string): string {
  const lower = input.toLowerCase();

  if (lower.includes('hidden gem') || lower.includes('local')) {
    return "I've found some great local spots! There's a cozy wine bar the locals love, and a tiny bakery that's been family-run for generations. Want me to add one to your plan?";
  }

  if (lower.includes('dinner') || lower.includes('restaurant') || lower.includes('eat')) {
    return "For dinner, I'd recommend checking out the restaurants near your evening activities. That way you won't have to walk far after a long day. Want me to show you options near your last stop?";
  }

  if (lower.includes('morning') || lower.includes('breakfast')) {
    return "Mornings are great for museums and markets before the crowds arrive! There's a lovely food market that opens early - perfect for a local breakfast experience.";
  }

  if (lower.includes('optimize') || lower.includes('route') || lower.includes('walk')) {
    return "I can reorder your activities to minimize walking time. Your current route has you backtracking a bit - I can save you about 20 minutes. Should I optimize it?";
  }

  return "That's a great question! I'm here to help make your trip amazing. Is there a specific part of your day you'd like to focus on?";
}

function getQuickActionResponse(action: string): string {
  const responses: Record<string, string> = {
    optimize_route: "I've analyzed your route and found a better order. If we swap the museum and cafe, you'll save about 15 minutes of walking. Want me to make the change?",
    show_hidden_gems: "Here are some hidden gems near your planned stops: a secret rooftop bar, a tiny artisan cheese shop, and a courtyard garden most tourists walk right past. Should I add any to your plan?",
    fill_morning: "For a great morning, I'd suggest starting with coffee at a local favorite, then hitting the museum before crowds arrive. Want me to add these?",
    find_dinner: "Based on your evening location, I found some wonderful dinner spots within walking distance. There's an intimate bistro with amazing local cuisine, or a livelier tapas place if you're feeling social.",
    plan_evening: "For the perfect evening, I'd suggest catching sunset from the viewpoint, then dinner at the nearby wine bar, followed by a stroll through the old town. Sound good?",
  };

  return responses[action] || "Let me look into that for you...";
}

export default PlanningCompanion;

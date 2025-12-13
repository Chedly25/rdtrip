/**
 * CompanionPanel
 *
 * Bottom panel for the AI planning companion.
 * Manages conversation, SSE streaming, and contextual suggestions.
 *
 * Design: Wanderlust Editorial - warm earth tones, magazine aesthetic
 * Features:
 * - Expand/collapse animation
 * - SSE streaming with real-time text
 * - Inline card suggestions
 * - Contextual action buttons
 * - Auto-scroll to latest message
 */

import { useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronUp,
  ChevronDown,
  Bot,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { usePlanningStore } from '../../../stores/planningStore';
import { useCompanionSSE } from '../../../hooks/api/useCompanionSSE';
import { CompanionMessage, StreamingMessage } from './CompanionMessage';
import { CompanionInput } from './CompanionInput';
import type {
  CityPlan,
  PlanCard,
  CompanionAction,
  CompanionMessage as CompanionMessageType,
  LatLng,
} from '../../../types/planning';

// ============================================
// Types
// ============================================

interface CompanionPanelProps {
  cityId: string;
  cityName: string;
  cityCenter?: LatLng;
  currentPlan?: CityPlan;
}

// ============================================
// Default Quick Suggestions
// ============================================

const getDefaultSuggestions = (cityName: string): string[] => [
  `What should we do first in ${cityName}?`,
  'Suggest romantic dinner spots',
  'Find hidden gems nearby',
];

// ============================================
// Component
// ============================================

export function CompanionPanel({
  cityId,
  cityName,
  cityCenter,
  currentPlan,
}: CompanionPanelProps) {
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Store state
  const {
    routeId,
    companionExpanded,
    companionMessages,
    toggleCompanion,
    setCompanionExpanded,
    addCompanionMessage,
    addItemToCluster,
    createCluster,
  } = usePlanningStore();

  // Get messages for current city
  const cityMessages = useMemo(
    () => companionMessages[cityId] || [],
    [companionMessages, cityId]
  );

  // Get clusters for current city
  const clusters = useMemo(
    () => currentPlan?.clusters || [],
    [currentPlan]
  );

  // Get all added card IDs
  const addedCardIds = useMemo(() => {
    if (!currentPlan) return [];
    const clusterIds = currentPlan.clusters.flatMap((c) => c.items.map((i) => i.id));
    const unclusteredIds = currentPlan.unclustered.map((i) => i.id);
    return [...clusterIds, ...unclusteredIds];
  }, [currentPlan]);

  // SSE hook
  const {
    sendMessage: sendSSE,
    isStreaming,
    currentText,
    currentCards,
    currentActions,
    thinkingText,
    toolCall,
    error: sseError,
    cancel: cancelSSE,
    reset: resetSSE,
  } = useCompanionSSE(routeId || '');

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && companionExpanded) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [cityMessages, currentText, companionExpanded]);

  // Auto-expand when first message arrives
  useEffect(() => {
    if (cityMessages.length === 1 && !companionExpanded) {
      setCompanionExpanded(true);
    }
  }, [cityMessages.length, companionExpanded, setCompanionExpanded]);

  // When streaming completes, save the message
  useEffect(() => {
    if (!isStreaming && currentText && currentText.trim()) {
      const assistantMessage: CompanionMessageType = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: currentText,
        cards: currentCards.length > 0 ? currentCards : undefined,
        actions: currentActions.length > 0 ? currentActions : undefined,
        timestamp: new Date(),
      };
      addCompanionMessage(cityId, assistantMessage);
      resetSSE();
    }
  }, [isStreaming, currentText, currentCards, currentActions, cityId, addCompanionMessage, resetSSE]);

  // Handle sending message
  const handleSend = useCallback(
    (message: string) => {
      // Add user message immediately
      const userMessage: CompanionMessageType = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: 'user',
        content: message,
        timestamp: new Date(),
      };
      addCompanionMessage(cityId, userMessage);

      // Build context
      const context = {
        cityId,
        currentPlan: currentPlan || {
          id: cityId,
          cityId,
          city: { id: cityId, name: cityName, country: '', coordinates: cityCenter || { lat: 0, lng: 0 } },
          clusters: [],
          unclustered: [],
          suggestedClusters: [],
        },
        preferences: {
          travelerType: 'couple' as const,
          budget: 'moderate' as const,
        },
        history: cityMessages,
      };

      // Send via SSE
      sendSSE(message, context);

      // Auto-expand panel
      if (!companionExpanded) {
        setCompanionExpanded(true);
      }
    },
    [cityId, cityName, cityCenter, currentPlan, cityMessages, sendSSE, addCompanionMessage, companionExpanded, setCompanionExpanded]
  );

  // Handle adding card to plan
  const handleAddCard = useCallback(
    (card: PlanCard, clusterId?: string) => {
      if (clusterId) {
        addItemToCluster(cityId, clusterId, card);
      } else if (clusters.length > 0) {
        // Add to first cluster if no specific one selected
        addItemToCluster(cityId, clusters[0].id, card);
      } else {
        // Create a new cluster for this card
        const newClusterId = createCluster(
          cityId,
          card.location?.area || 'New Area',
          card.location ? { lat: card.location.lat, lng: card.location.lng } : undefined
        );
        if (newClusterId) {
          addItemToCluster(cityId, newClusterId, card);
        }
      }
    },
    [cityId, clusters, addItemToCluster, createCluster]
  );

  // Handle action click
  const handleActionClick = useCallback(
    (action: CompanionAction) => {
      switch (action.type) {
        case 'show_more':
          handleSend(`Show me more ${action.payload?.cardType || 'suggestions'}`);
          break;
        case 'add_card':
          if (action.payload?.card) {
            handleAddCard(action.payload.card, action.payload?.clusterId);
          }
          break;
        case 'custom':
          if (action.payload?.query) {
            handleSend(action.payload.query);
          }
          break;
        case 'navigate':
          // Handle navigation if needed
          break;
        case 'dismiss':
          // Dismiss the action
          break;
      }
    },
    [handleSend, handleAddCard]
  );

  // Quick suggestions based on context
  const quickSuggestions = useMemo(() => {
    if (cityMessages.length === 0) {
      return getDefaultSuggestions(cityName);
    }
    if (clusters.length === 0) {
      return [
        `What are the best areas in ${cityName}?`,
        'Help me create my first area',
        'Suggest must-visit spots',
      ];
    }
    return [
      'What else should I add?',
      'Review my plan',
      'Find nearby hidden gems',
    ];
  }, [cityName, cityMessages.length, clusters.length]);

  // Get preview text for collapsed state
  const previewText = useMemo(() => {
    if (isStreaming && currentText) {
      return currentText.slice(0, 100) + (currentText.length > 100 ? '...' : '');
    }
    if (cityMessages.length > 0) {
      const lastAssistant = [...cityMessages].reverse().find((m) => m.role === 'assistant');
      if (lastAssistant) {
        return lastAssistant.content.slice(0, 100) + (lastAssistant.content.length > 100 ? '...' : '');
      }
    }
    return `Hi! I'm here to help you plan ${cityName}. Ask me anything!`;
  }, [isStreaming, currentText, cityMessages, cityName]);

  return (
    <div className="relative">
      {/* Toggle button */}
      <button
        onClick={toggleCompanion}
        className="
          absolute -top-3 left-1/2 -translate-x-1/2 z-10
          px-4 py-1.5 bg-[#FFFBF5] rounded-full
          border border-[#E5DDD0] shadow-sm
          text-[#8B7355] hover:text-[#C45830]
          transition-colors flex items-center gap-2
          font-['Satoshi',sans-serif] text-xs font-medium
        "
      >
        {companionExpanded ? (
          <>
            <ChevronDown className="w-3 h-3" />
            Hide companion
          </>
        ) : (
          <>
            <ChevronUp className="w-3 h-3" />
            Ask companion
          </>
        )}
      </button>

      {/* Collapsed bar */}
      <div className="px-4 sm:px-6 py-3">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="
            flex-shrink-0 w-10 h-10 rounded-full
            bg-gradient-to-br from-[#C45830] to-[#D4724A]
            flex items-center justify-center
            shadow-md shadow-[#C45830]/20
          ">
            {isStreaming ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Bot className="w-5 h-5 text-white" />
            )}
          </div>

          {/* Preview text */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[#2C2417] font-['Satoshi',sans-serif] truncate">
              <span className="font-semibold">Planning Companion</span>
              <span className="text-[#8B7355] ml-2">{previewText}</span>
            </p>
          </div>

          {/* Quick action buttons (desktop) */}
          {!companionExpanded && (
            <div className="hidden sm:flex items-center gap-2">
              {quickSuggestions.slice(0, 2).map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSend(suggestion)}
                  disabled={isStreaming}
                  className="
                    px-3 py-1.5 rounded-lg
                    bg-[#FEF3EE] text-[#C45830]
                    font-['Satoshi',sans-serif] text-xs font-medium
                    hover:bg-[#FCE8DE] transition-colors
                    disabled:opacity-50
                  "
                >
                  {suggestion.length > 20 ? suggestion.slice(0, 20) + '...' : suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Expanded state */}
      <AnimatePresence>
        {companionExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 sm:px-6 pb-4 border-t border-[#E5DDD0]">
              {/* Messages area */}
              <div className="py-4 min-h-[120px] max-h-[350px] overflow-y-auto space-y-4">
                {/* Welcome message if no messages */}
                {cityMessages.length === 0 && !isStreaming && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3"
                  >
                    <div className="
                      flex-shrink-0 w-8 h-8 rounded-full
                      bg-gradient-to-br from-[#C45830] to-[#D4724A]
                      flex items-center justify-center
                    ">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 p-3 bg-[#F5F0E8] rounded-xl rounded-tl-sm max-w-md">
                      <p className="text-sm text-[#2C2417] font-['Satoshi',sans-serif] leading-relaxed">
                        Hey! I'm your planning companion for <span className="font-semibold">{cityName}</span>.
                      </p>
                      <p className="text-sm text-[#8B7355] font-['Satoshi',sans-serif] leading-relaxed mt-2">
                        I can help you find restaurants, activities, photo spots, and more.
                        Ask me anything or try one of the suggestions below!
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#D4A853]" />
                        <span className="text-xs text-[#8B7355] font-['Satoshi',sans-serif]">
                          I know this city well - let's plan something great.
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Existing messages */}
                {cityMessages.map((message) => (
                  <CompanionMessage
                    key={message.id}
                    message={message}
                    onAddCard={handleAddCard}
                    onActionClick={handleActionClick}
                    clusters={clusters}
                    addedCardIds={addedCardIds}
                  />
                ))}

                {/* Streaming message */}
                {isStreaming && (
                  <StreamingMessage
                    content={currentText}
                    thinkingText={thinkingText}
                    toolCall={toolCall}
                    cards={currentCards}
                    actions={currentActions}
                    onAddCard={handleAddCard}
                    onActionClick={handleActionClick}
                    clusters={clusters}
                    addedCardIds={addedCardIds}
                  />
                )}

                {/* Error message */}
                {sseError && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200"
                  >
                    <span className="text-sm text-red-600 font-['Satoshi',sans-serif]">
                      {sseError}
                    </span>
                  </motion.div>
                )}

                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <CompanionInput
                onSend={handleSend}
                isLoading={isStreaming}
                placeholder={`Ask about ${cityName}...`}
                quickSuggestions={quickSuggestions}
                onCancel={cancelSSE}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CompanionPanel;

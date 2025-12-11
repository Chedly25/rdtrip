/**
 * ChatHistoryPanel - Left panel showing conversation history
 *
 * Displays all messages in the current session with:
 * - User messages (right-aligned, teal)
 * - Assistant messages (left-aligned, white)
 * - Inline place cards for mentioned places
 * - Typing indicators
 * - Auto-scroll to latest
 */

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Bot, User, Loader, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAgent } from '../../contexts/AgentProvider';
import { ToolExecutionStatus } from './ToolExecutionStatus';
import { PlanProgress } from './PlanProgress';
import { RoutingIndicator } from './RoutingIndicator';
import { GoalProgress } from './GoalProgress';
import { InlinePlaceCard } from './InlinePlaceCard';
import { QuickActionChips } from './QuickActionChips';
import { ToolSourceIndicator, extractToolNames } from './ToolSourceIndicator';
import { SmartPlaceLink, isProbablyPlaceName } from './SmartPlaceLink';
import { parseMessageForPlaces, hasPlaceMarkers } from '../../utils/messagePlaceParser';
import type { ChipsSegment } from '../../utils/messagePlaceParser';

// ============================================================================
// Smart Markdown Components
// ============================================================================

/**
 * Creates markdown components with smart place detection for bold text.
 * Bold text that looks like a place name becomes a tappable SmartPlaceLink.
 */
function createSmartMarkdownComponents() {
  return {
    h1: ({ node, ...props }: any) => <h1 className="text-lg font-bold mb-2 text-gray-900" {...props} />,
    h2: ({ node, ...props }: any) => <h2 className="text-base font-bold mb-2 text-gray-900" {...props} />,
    h3: ({ node, ...props }: any) => <h3 className="text-sm font-semibold mb-1.5 text-gray-800" {...props} />,
    p: ({ node, ...props }: any) => <p className="mb-2 leading-relaxed last:mb-0" {...props} />,
    ul: ({ node, ...props }: any) => <ul className="list-disc list-inside mb-2 space-y-1" {...props} />,
    ol: ({ node, ...props }: any) => <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />,
    li: ({ node, ...props }: any) => <li className="leading-relaxed" {...props} />,
    em: ({ node, ...props }: any) => <em className="italic" {...props} />,
    a: ({ node, ...props }: any) => <a className="text-teal-600 hover:text-teal-700 underline" {...props} />,
    code: ({ node, ...props }: any) => <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono" {...props} />,
    // Smart strong component - detects place names and makes them interactive
    strong: ({ node, children, ...props }: any) => {
      // Extract text content from children
      const textContent = typeof children === 'string'
        ? children
        : Array.isArray(children)
          ? children.filter(c => typeof c === 'string').join('')
          : '';

      // Check if this looks like a place name
      if (textContent && isProbablyPlaceName(textContent)) {
        return (
          <SmartPlaceLink placeName={textContent}>
            {children}
          </SmartPlaceLink>
        );
      }

      // Default bold rendering
      return <strong className="font-semibold text-gray-900" {...props}>{children}</strong>;
    },
  };
}

// Pre-create the components (memoized)
const smartMarkdownComponents = createSmartMarkdownComponents();

// ============================================================================
// ChatHistoryPanel Component
// ============================================================================

export function ChatHistoryPanel() {
  const { messages, isLoading, activeTools, pageContext, sendMessage, currentPlan, isReplanning, replanInfo, routingInfo, activeGoal } = useAgent();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handle chip selection - send the chip's value as a message
  const handleChipSelect = (chip: { value: string }) => {
    sendMessage(chip.value);
  };

  // Auto-scroll to latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Context-aware welcome message
  const getWelcomeMessage = () => {
    const { name, route } = pageContext;

    if (name === 'landing') {
      return {
        title: "Hi! Ready to plan your road trip?",
        subtitle: "I can help you find the perfect route, check weather, and discover amazing destinations!"
      };
    }

    if (name === 'spotlight' && route) {
      const destination = route.destination || 'your destination';
      return {
        title: `Planning your trip to ${destination}!`,
        subtitle: "Ask me about weather, activities, directions, or travel tips for your route."
      };
    }

    if (name === 'itinerary') {
      return {
        title: "Building your perfect itinerary!",
        subtitle: "Need help with activities, restaurants, or timing? Just ask!"
      };
    }

    return {
      title: "Hi! I'm your travel assistant",
      subtitle: "Ask me about weather, activities, directions, or any travel tips you need!"
    };
  };

  const welcome = getWelcomeMessage();

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="px-4 py-3 bg-white border-b border-gray-200 flex-shrink-0">
        <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
          <Bot className="w-4 h-4 text-teal-600" />
          Conversation History
        </h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8 px-4">
            <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-teal-600" />
            </div>
            <p className="text-lg font-semibold text-gray-900 mb-2">
              {welcome.title}
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              {welcome.subtitle}
            </p>
          </div>
        )}

        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'user' ? (
              // User message - Teal card on right
              <div className="max-w-[80%] bg-teal-50 border border-teal-100 rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 bg-teal-600 rounded-full flex items-center justify-center">
                    <User className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-teal-700">You</span>
                </div>
                <p className="text-sm text-gray-900 whitespace-pre-wrap break-words leading-relaxed">
                  {message.content}
                </p>
                <p className="text-xs text-teal-600 mt-1.5 font-medium">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ) : (
              // Assistant message - White card on left
              <div className="max-w-[85%] bg-white border-2 border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 bg-teal-50 rounded-full flex items-center justify-center">
                    <Bot className="w-3 h-3 text-teal-600" />
                  </div>
                  <span className="text-xs font-semibold text-teal-700">Assistant</span>
                </div>

                {/* Check if message contains place or chips markers */}
                {hasPlaceMarkers(message.content) ? (
                  // Render with inline place cards and/or chips
                  <div className="text-sm text-gray-900">
                    {parseMessageForPlaces(message.content).map((segment, idx) => {
                      if (segment.type === 'text') {
                        return (
                          <div key={idx} className="prose prose-sm prose-teal max-w-none">
                            <ReactMarkdown components={smartMarkdownComponents}>
                              {segment.content}
                            </ReactMarkdown>
                          </div>
                        );
                      } else if (segment.type === 'place') {
                        return <InlinePlaceCard key={idx} place={segment.place} />;
                      } else if (segment.type === 'chips') {
                        return (
                          <QuickActionChips
                            key={idx}
                            chips={(segment as ChipsSegment).chips}
                            onSelect={handleChipSelect}
                            disabled={isLoading}
                          />
                        );
                      }
                      return null;
                    })}
                  </div>
                ) : (
                  // Regular markdown rendering with smart place links
                  <div className="text-sm text-gray-900 prose prose-sm prose-teal max-w-none">
                    <ReactMarkdown components={smartMarkdownComponents}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                )}

                {/* Streaming indicator */}
                {message.isStreaming && (
                  <div className="flex items-center gap-1.5 mt-3">
                    <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                )}

                {/* Timestamp and tool source indicator */}
                <div className="flex items-center justify-between mt-2 gap-3 flex-wrap">
                  <p className="text-xs text-gray-500">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>

                  {/* Show live data sources if tools were used */}
                  {message.toolCalls && message.toolCalls.length > 0 && (
                    <ToolSourceIndicator toolsUsed={extractToolNames(message.toolCalls)} />
                  )}
                </div>
              </div>
            )}
          </motion.div>
        ))}

        {/* Loading indicator when waiting for response */}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-white border-2 border-gray-200 rounded-2xl px-4 py-3 shadow-sm max-w-[85%]">
              {/* Phase 3: Show routing indicator when we have routing info */}
              {routingInfo && (
                <RoutingIndicator
                  routingInfo={routingInfo}
                  className="mb-3"
                  compact={!!currentPlan || !!activeGoal} // Use compact mode when plan or goal is showing
                />
              )}

              {/* Phase 4: Show goal progress if tracking a multi-step goal */}
              {activeGoal && (
                <GoalProgress
                  goal={activeGoal}
                  className="mb-3"
                  compact={!!currentPlan} // Use compact mode when plan is also showing
                />
              )}

              {/* Show plan progress if we have an active plan */}
              {currentPlan ? (
                <PlanProgress
                  plan={currentPlan}
                  className="mb-3"
                  isReplanning={isReplanning}
                  replanInfo={replanInfo}
                />
              ) : !routingInfo && !activeGoal && (
                <div className="flex items-center gap-2.5 mb-3">
                  <Loader className="w-4 h-4 text-teal-600 animate-spin" />
                  <p className="text-sm text-gray-600 font-medium">Thinking...</p>
                </div>
              )}

              {/* Tool Execution Status */}
              <ToolExecutionStatus activeTools={activeTools} />
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

/**
 * AgentChatBubble - AI Travel Assistant
 *
 * Clean, modern chat interface matching RDTrip's teal brand
 * No flashy gradients - solid colors and subtle shadows only
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader, Sparkles, Trash2, Bot } from 'lucide-react';
import { useAgent } from '../../contexts/AgentProvider';
import { WeatherCard } from './WeatherCard';
import { ActivityGrid } from './ActivityCard';
import { DirectionsCard } from './DirectionsCard';
import { CityInfoCard } from './CityInfoCard';
import { ToolExecutionStatus } from './ToolExecutionStatus';

export function AgentChatBubble() {
  const {
    isOpen,
    messages,
    isLoading,
    pageContext,
    activeTools,
    openAgent,
    closeAgent,
    sendMessage,
    clearHistory
  } = useAgent();

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Context-aware welcome messages
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

  // Context-aware quick actions
  const getQuickActions = () => {
    const { name, route } = pageContext;

    if (name === 'landing') {
      return [
        { label: "Find a route", query: "Help me plan a road trip route" },
        { label: "Check weather", query: "What's the weather like for travel?" },
        { label: "Travel tips", query: "What should I know about planning a road trip?" }
      ];
    }

    if (name === 'spotlight' && route) {
      const actions = [];

      if (route.destination) {
        actions.push({ label: `Weather in ${route.destination}`, query: `What's the weather in ${route.destination}?` });
        actions.push({ label: `Activities in ${route.destination}`, query: `Find activities in ${route.destination}` });
      }

      if (route.origin && route.destination) {
        actions.push({ label: "Get directions", query: `Get directions from ${route.origin} to ${route.destination}` });
      }

      return actions.slice(0, 3); // Max 3 quick actions
    }

    if (name === 'itinerary') {
      return [
        { label: "Find restaurants", query: "Recommend good restaurants for my itinerary" },
        { label: "Check weather", query: "What's the weather forecast?" },
        { label: "Travel tips", query: "Give me tips for my trip" }
      ];
    }

    return [];
  };

  const welcome = getWelcomeMessage();
  const quickActions = getQuickActions();

  /**
   * Render rich content cards based on tool results
   */
  const renderRichContent = (message: any) => {
    if (!message.toolResults || message.toolResults.length === 0) {
      return null;
    }

    return message.toolResults.map((toolResult: any, index: number) => {
      try {
        const result = typeof toolResult.content === 'string'
          ? JSON.parse(toolResult.content)
          : toolResult.content;

        // Check for checkWeather tool
        if (toolResult.name === 'checkWeather' && result.success && result.current) {
          return <div key={index} className="mt-4"><WeatherCard data={result} /></div>;
        }

        // Check for searchActivities tool
        if (toolResult.name === 'searchActivities' && result.success && result.activities) {
          return (
            <div key={index} className="mt-4">
              <ActivityGrid
                activities={result.activities}
                city={result.city}
                category={result.category}
              />
            </div>
          );
        }

        // Check for getDirections tool
        if (toolResult.name === 'getDirections' && result.success) {
          return <div key={index} className="mt-4"><DirectionsCard data={result} /></div>;
        }

        // Check for getCityInfo tool
        if (toolResult.name === 'getCityInfo' && result.success) {
          return <div key={index} className="mt-4"><CityInfoCard data={result} /></div>;
        }

        return null;
      } catch (error) {
        console.error('Error rendering rich content:', error);
        return null;
      }
    });
  };

  // Auto-scroll to latest message
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle send message
  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const messageToSend = inputValue;
    setInputValue(''); // Clear immediately for better UX

    await sendMessage(messageToSend);
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[420px] h-[600px] bg-white rounded-2xl shadow-2xl border-2 border-gray-200 flex flex-col overflow-hidden"
          >
            {/* Header - Solid teal, no gradient */}
            <div className="bg-[#064d51] px-6 py-4 flex items-center justify-between border-b border-teal-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <Bot className="w-6 h-6 text-[#064d51]" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">Travel Assistant</h3>
                  <p className="text-teal-100 text-xs">Powered by Claude AI</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Clear history button */}
                {messages.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="p-2 hover:bg-teal-700 rounded-lg transition-colors"
                    title="Clear history"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                )}

                {/* Close button */}
                <button
                  onClick={closeAgent}
                  className="p-2 hover:bg-teal-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Messages - Light gray background like app pages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.length === 0 && (
                <div className="text-center py-8 px-4">
                  <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-teal-600" />
                  </div>
                  <p className="text-lg font-semibold text-gray-900 mb-2">
                    {welcome.title}
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    {welcome.subtitle}
                  </p>

                  {/* Quick action buttons */}
                  {quickActions.length > 0 && (
                    <div className="space-y-2 mt-4">
                      {quickActions.map((action, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setInputValue(action.query);
                            inputRef.current?.focus();
                          }}
                          className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 hover:border-teal-300 rounded-xl text-sm text-gray-700 hover:text-teal-700 font-medium transition-colors text-left"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
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
                    // User message - Light teal card
                    <div className="max-w-[80%] bg-teal-50 border border-teal-100 rounded-2xl px-4 py-3 shadow-sm">
                      <p className="text-sm text-gray-900 whitespace-pre-wrap break-words leading-relaxed">
                        {message.content}
                      </p>
                      <p className="text-xs text-teal-600 mt-1.5 font-medium">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ) : (
                    // Agent message - White card with border (matching CompactActivityCard style)
                    <div className="max-w-[85%] bg-white border-2 border-gray-200 rounded-2xl px-4 py-3 shadow-sm hover:border-teal-200 transition-colors">
                      <div className="flex items-start gap-2 mb-2">
                        <div className="w-6 h-6 bg-teal-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Bot className="w-4 h-4 text-teal-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-teal-700 mb-1">Assistant</p>
                        </div>
                      </div>

                      <p className="text-sm text-gray-900 whitespace-pre-wrap break-words leading-relaxed">
                        {message.content}
                      </p>

                      {/* Streaming indicator */}
                      {message.isStreaming && (
                        <div className="flex items-center gap-1.5 mt-3">
                          <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      )}

                      <p className="text-xs text-gray-500 mt-2">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>

                      {/* Rich content cards */}
                      {renderRichContent(message)}
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
                    <div className="flex items-center gap-2.5">
                      <Loader className="w-4 h-4 text-teal-600 animate-spin" />
                      <p className="text-sm text-gray-600">Thinking...</p>
                    </div>

                    {/* Tool Execution Status */}
                    <ToolExecutionStatus activeTools={activeTools} />
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Clean white with subtle border */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm placeholder:text-gray-400"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isLoading}
                  className="p-3 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl transition-colors shadow-sm"
                >
                  {isLoading ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button - Solid teal, no gradient */}
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

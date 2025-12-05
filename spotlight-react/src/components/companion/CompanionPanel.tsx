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
 *
 * Features:
 * - Message thread with user/assistant bubbles
 * - Quick reply buttons after assistant messages
 * - Artifact display area for rich content (activities, hotels, weather)
 * - Proactive suggestion bubbles
 * - Tool execution status
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
  MapPin,
  Star,
  Plus,
  Cloud,
  Navigation,
  Info,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAgent, type AgentMessage, type Artifact } from '../../contexts/AgentProvider';

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
        {message.content ? (
          <div className="text-[15px] text-[#2C2417] leading-relaxed companion-markdown">
            <ReactMarkdown
              components={{
                // Paragraphs with proper spacing
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                // Bold text
                strong: ({ children }) => <strong className="font-semibold text-[#2C2417]">{children}</strong>,
                // Italic
                em: ({ children }) => <em className="italic">{children}</em>,
                // Links styled with terracotta
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#C45830] underline hover:text-[#A03820] transition-colors"
                  >
                    {children}
                  </a>
                ),
                // Lists with warm styling
                ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="text-[#5C4D3D]">{children}</li>,
                // Headings
                h1: ({ children }) => <h1 className="text-base font-semibold text-[#2C2417] mb-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-[15px] font-semibold text-[#2C2417] mb-1.5">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-semibold text-[#2C2417] mb-1">{children}</h3>,
                // Code blocks
                code: ({ children }) => (
                  <code className="bg-[#F5F0E8] px-1.5 py-0.5 rounded text-sm text-[#5C4D3D] font-mono">
                    {children}
                  </code>
                ),
                // Block quotes for tips/notes
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-[#D4A853] pl-3 my-2 italic text-[#8B7355]">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        ) : (
          <span className="text-[#8B7355] italic">Thinking...</span>
        )}
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

// ==================== QUICK REPLY BUTTONS ====================

interface QuickReplyProps {
  replies: string[];
  onReply: (reply: string) => void;
}

const QuickReplyButtons = ({ replies, onReply }: QuickReplyProps) => {
  return (
    <div className="flex flex-wrap gap-2 mt-2 ml-11">
      {replies.map((reply, idx) => (
        <button
          key={idx}
          onClick={() => onReply(reply)}
          className="
            px-3 py-1.5
            bg-[#F5F0E8]
            border border-[#E8DFD3]
            rounded-full
            text-sm text-[#2C2417]
            hover:bg-[#E8DFD3]
            hover:border-[#D4C4B0]
            transition-all duration-200
            active:scale-95
          "
        >
          {reply}
        </button>
      ))}
    </div>
  );
};

// ==================== TOOL STATUS COMPONENT ====================

interface ToolStatusProps {
  tools: Array<{ name: string; status?: string }>;
}

const getToolInfo = (toolName: string): { icon: React.ReactNode; label: string; hint: string } => {
  const toolMap: Record<string, { icon: React.ReactNode; label: string; hint: string }> = {
    searchActivities: {
      icon: <MapPin className="w-4 h-4" />,
      label: 'Finding activities',
      hint: 'Searching for the best things to do...'
    },
    searchHotels: {
      icon: <MapPin className="w-4 h-4" />,
      label: 'Finding hotels',
      hint: 'Looking for great places to stay...'
    },
    searchRestaurants: {
      icon: <MapPin className="w-4 h-4" />,
      label: 'Finding restaurants',
      hint: 'Discovering local dining spots...'
    },
    checkWeather: {
      icon: <Cloud className="w-4 h-4" />,
      label: 'Checking weather',
      hint: 'Getting the latest forecast...'
    },
    getDirections: {
      icon: <Navigation className="w-4 h-4" />,
      label: 'Getting directions',
      hint: 'Calculating your route...'
    },
    getCityInfo: {
      icon: <Info className="w-4 h-4" />,
      label: 'Researching city',
      hint: 'Gathering local insights...'
    },
    analyzeDayFeasibility: {
      icon: <Sparkles className="w-4 h-4" />,
      label: 'Analyzing itinerary',
      hint: 'Checking if your day works...'
    },
    suggestImprovements: {
      icon: <Sparkles className="w-4 h-4" />,
      label: 'Finding improvements',
      hint: 'Looking for ways to optimize...'
    },
    webSearch: {
      icon: <Sparkles className="w-4 h-4" />,
      label: 'Searching the web',
      hint: 'Finding the latest information...'
    },
  };

  return toolMap[toolName] || {
    icon: <Sparkles className="w-4 h-4" />,
    label: toolName.replace(/([A-Z])/g, ' $1').trim(),
    hint: 'Working on it...'
  };
};

const ToolStatusCard = ({ tools }: ToolStatusProps) => {
  if (tools.length === 0) return null;

  const primaryTool = tools[0];
  const toolInfo = getToolInfo(primaryTool.name);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className="flex gap-3 max-w-[85%]"
    >
      {/* Animated icon container */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FFF0EB] to-[#F5F0E8] flex items-center justify-center flex-shrink-0 shadow-sm animate-pulse">
        <span className="text-[#C45830]">{toolInfo.icon}</span>
      </div>

      {/* Status card */}
      <div className="flex-1 bg-gradient-to-br from-[#FFF0EB] to-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-[#E8DFD3]">
        <div className="flex items-center gap-2 mb-1">
          <Loader2 className="w-3.5 h-3.5 text-[#C45830] animate-spin" />
          <span className="text-sm font-medium text-[#C45830]">
            {toolInfo.label}
          </span>
        </div>
        <p className="text-xs text-[#8B7355]">
          {toolInfo.hint}
        </p>

        {/* Progress dots */}
        <div className="flex gap-1 mt-2">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[#D4A853]"
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>

        {/* Additional tools indicator */}
        {tools.length > 1 && (
          <p className="text-[10px] text-[#D4C4B0] mt-2">
            +{tools.length - 1} more {tools.length - 1 === 1 ? 'task' : 'tasks'}
          </p>
        )}
      </div>
    </motion.div>
  );
};

// ==================== ERROR MESSAGE COMPONENT ====================

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

const ErrorMessage = ({ message, onRetry }: ErrorMessageProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 max-w-[85%]"
    >
      {/* Error icon */}
      <div className="w-8 h-8 rounded-full bg-[#FFF0EB] flex items-center justify-center flex-shrink-0 shadow-sm">
        <X className="w-4 h-4 text-[#B54A4A]" />
      </div>

      {/* Error content */}
      <div className="flex-1 bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-[#E8C4C4]">
        <p className="text-sm text-[#B54A4A] mb-2">
          {message.replace(/^⚠️\s*/, '')}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-xs text-[#C45830] font-medium hover:underline"
          >
            Try again
          </button>
        )}
      </div>
    </motion.div>
  );
};

// Helper to check if a message is an error
const isErrorMessage = (message: AgentMessage): boolean => {
  return message.role === 'assistant' &&
    (message.content.startsWith('⚠️') ||
     message.content.toLowerCase().includes('error') ||
     message.content.toLowerCase().includes('failed') ||
     message.content.toLowerCase().includes('sorry, i encountered'));
};

// ==================== COMPACT ARTIFACT DISPLAY ====================

interface CompactArtifactProps {
  artifact: Artifact;
  onAddActivity?: (activity: any) => void;
}

const CompactArtifactDisplay = ({ artifact, onAddActivity }: CompactArtifactProps) => {
  if (artifact.type === 'activity_grid' && Array.isArray(artifact.data)) {
    return (
      <div className="bg-[#FAF7F2] rounded-xl p-3 border border-[#E8DFD3] mt-3">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-[#C45830]" />
          <h4 className="text-sm font-semibold text-[#2C2417]">
            {artifact.title}
          </h4>
        </div>
        <div className="space-y-2 max-h-[240px] overflow-y-auto">
          {artifact.data.slice(0, 4).map((activity: any, idx: number) => (
            <div
              key={idx}
              className="flex items-center gap-3 bg-white rounded-lg p-2.5 border border-[#E8DFD3]"
            >
              {activity.photoUrl ? (
                <img
                  src={activity.photoUrl}
                  alt={activity.name}
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-[#F5F0E8] flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-[#8B7355]" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h5 className="text-[13px] font-medium text-[#2C2417] truncate">
                  {activity.name}
                </h5>
                <div className="flex items-center gap-2 mt-0.5">
                  {activity.rating && (
                    <div className="flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-[#D4A853] text-[#D4A853]" />
                      <span className="text-xs text-[#8B7355]">{activity.rating}</span>
                    </div>
                  )}
                  {activity.duration && (
                    <span className="text-xs text-[#8B7355]">{activity.duration}</span>
                  )}
                </div>
              </div>
              {onAddActivity && (
                <button
                  onClick={() => onAddActivity(activity)}
                  className="w-7 h-7 rounded-lg bg-[#FFF0EB] flex items-center justify-center text-[#C45830] hover:bg-[#C45830] hover:text-white transition-colors flex-shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        {artifact.data.length > 4 && (
          <p className="text-xs text-[#8B7355] text-center mt-2">
            +{artifact.data.length - 4} more results
          </p>
        )}
      </div>
    );
  }

  if (artifact.type === 'hotel_list' && Array.isArray(artifact.data)) {
    return (
      <div className="bg-[#FAF7F2] rounded-xl p-3 border border-[#E8DFD3] mt-3">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-[#C45830]" />
          <h4 className="text-sm font-semibold text-[#2C2417]">
            {artifact.title}
          </h4>
        </div>
        <div className="space-y-2 max-h-[240px] overflow-y-auto">
          {artifact.data.slice(0, 3).map((hotel: any, idx: number) => (
            <div
              key={idx}
              className="bg-white rounded-lg p-2.5 border border-[#E8DFD3]"
            >
              <div className="flex items-start gap-3">
                {hotel.photoUrl ? (
                  <img
                    src={hotel.photoUrl}
                    alt={hotel.name}
                    className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-[#F5F0E8] flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-[#8B7355]" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h5 className="text-[13px] font-medium text-[#2C2417] truncate">
                    {hotel.name}
                  </h5>
                  <div className="flex items-center gap-2 mt-0.5">
                    {hotel.rating && (
                      <div className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-[#D4A853] text-[#D4A853]" />
                        <span className="text-xs text-[#8B7355]">{hotel.rating}</span>
                      </div>
                    )}
                    {hotel.priceLevel && (
                      <span className="text-xs text-[#8B7355]">{'$'.repeat(hotel.priceLevel)}</span>
                    )}
                  </div>
                  {hotel.vicinity && (
                    <p className="text-xs text-[#8B7355] truncate mt-0.5">{hotel.vicinity}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (artifact.type === 'weather_display' && artifact.data) {
    const weather = artifact.data;
    return (
      <div className="bg-gradient-to-br from-[#4A90A4]/10 to-[#F5F0E8] rounded-xl p-3 border border-[#E8DFD3] mt-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-[#2C2417]">
              {weather.city || artifact.title}
            </h4>
            <p className="text-xs text-[#8B7355]">
              {weather.current?.condition || 'Weather'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Cloud className="w-6 h-6 text-[#4A90A4]" />
            {weather.current?.temp && (
              <span className="text-2xl font-semibold text-[#2C2417]">
                {Math.round(weather.current.temp)}°
              </span>
            )}
          </div>
        </div>
        {weather.forecast && weather.forecast.length > 0 && (
          <div className="flex gap-2 mt-3 overflow-x-auto">
            {weather.forecast.slice(0, 4).map((day: any, idx: number) => (
              <div
                key={idx}
                className="flex-shrink-0 bg-white/70 rounded-lg px-2 py-1.5 text-center min-w-[48px]"
              >
                <p className="text-[10px] text-[#8B7355]">{day.day}</p>
                <p className="text-sm font-medium text-[#2C2417]">{day.high}°</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (artifact.type === 'directions_map' && artifact.data) {
    const directions = artifact.data;
    return (
      <div className="bg-[#FAF7F2] rounded-xl p-3 border border-[#E8DFD3] mt-3">
        <div className="flex items-center gap-2 mb-2">
          <Navigation className="w-4 h-4 text-[#C45830]" />
          <h4 className="text-sm font-semibold text-[#2C2417]">
            {artifact.title}
          </h4>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div>
            <span className="text-[#8B7355]">Distance:</span>{' '}
            <span className="font-medium text-[#2C2417]">{directions.distance}</span>
          </div>
          <div>
            <span className="text-[#8B7355]">Duration:</span>{' '}
            <span className="font-medium text-[#2C2417]">{directions.duration}</span>
          </div>
        </div>
      </div>
    );
  }

  if (artifact.type === 'city_info' && artifact.data) {
    const city = artifact.data;
    return (
      <div className="bg-[#FAF7F2] rounded-xl p-3 border border-[#E8DFD3] mt-3">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-[#C45830]" />
          <h4 className="text-sm font-semibold text-[#2C2417]">
            {city.name}
          </h4>
          {city.country && (
            <span className="text-xs text-[#8B7355]">{city.country}</span>
          )}
        </div>
        {city.description && (
          <p className="text-sm text-[#5C4D3D] line-clamp-3">
            {city.description}
          </p>
        )}
      </div>
    );
  }

  // Route/Trip Comparison (What-If scenarios)
  if (artifact.type === 'route_comparison' && artifact.data) {
    const { current, alternative, recommendation } = artifact.data;
    return (
      <div className="bg-[#FAF7F2] rounded-xl p-3 border border-[#E8DFD3] mt-3">
        <h4 className="text-sm font-semibold text-[#8B7355] uppercase tracking-wide mb-3">
          {artifact.title || 'Route Comparison'}
        </h4>

        <div className="grid grid-cols-2 gap-3">
          {/* Current Route */}
          <div className="bg-white rounded-lg p-3 border border-[#E8DFD3]">
            <span className="text-xs text-[#8B7355] font-medium">Current</span>
            <p className="text-lg font-semibold text-[#2C2417] mt-1">
              {current?.days || '—'} days
            </p>
            <p className="text-sm text-[#8B7355]">
              €{current?.estimatedCost?.toLocaleString() || '—'}
            </p>
            <p className="text-xs text-[#8B7355] mt-2">
              {current?.cities || '—'} cities
            </p>
          </div>

          {/* Alternative Route */}
          <div className="bg-white rounded-lg p-3 border-2 border-[#C45830]">
            <span className="text-xs text-[#C45830] font-medium">
              {alternative?.label || 'Alternative'}
            </span>
            <p className="text-lg font-semibold text-[#2C2417] mt-1">
              {alternative?.days || '—'} days
            </p>
            <p className="text-sm text-[#8B7355]">
              €{alternative?.estimatedCost?.toLocaleString() || '—'}
              {alternative?.costDiff && (
                <span className={alternative.costDiff > 0 ? 'text-[#B54A4A] ml-1' : 'text-[#4A7C59] ml-1'}>
                  ({alternative.costDiff > 0 ? '+' : ''}€{alternative.costDiff})
                </span>
              )}
            </p>
            <p className="text-xs text-[#8B7355] mt-2">
              {alternative?.cities || '—'} cities
            </p>
          </div>
        </div>

        {/* Recommendation */}
        {recommendation && (
          <p className="text-sm text-[#5C4D3D] mt-3 italic">
            "{recommendation}"
          </p>
        )}

        {/* Action button */}
        <button className="w-full mt-3 py-2.5 bg-[#C45830] text-white rounded-lg text-sm font-medium hover:bg-[#A03820] transition-colors shadow-[0_4px_14px_rgba(196,88,48,0.25)]">
          Apply {alternative?.label || 'Alternative'}
        </button>
      </div>
    );
  }

  // Day Schedule Comparison
  if (artifact.type === 'day_comparison' && artifact.data) {
    const { currentDay, suggestedDay, changes } = artifact.data;
    return (
      <div className="bg-[#FAF7F2] rounded-xl p-3 border border-[#E8DFD3] mt-3">
        <h4 className="text-sm font-semibold text-[#8B7355] uppercase tracking-wide mb-3">
          Day {currentDay?.number || ''} Optimization
        </h4>

        {/* Changes list */}
        <div className="space-y-2">
          {changes?.map((change: { type: string; description: string }, idx: number) => (
            <div
              key={idx}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                change.type === 'add'
                  ? 'bg-[#E8F5EC] text-[#4A7C59]'
                  : change.type === 'remove'
                  ? 'bg-[#FFF0EB] text-[#B54A4A]'
                  : 'bg-white text-[#8B7355] border border-[#E8DFD3]'
              }`}
            >
              <span className="font-medium">
                {change.type === 'add' ? '+' : change.type === 'remove' ? '−' : '↔'}
              </span>
              <span>{change.description}</span>
            </div>
          ))}
        </div>

        {/* Summary */}
        {suggestedDay?.summary && (
          <p className="text-sm text-[#5C4D3D] mt-3">
            {suggestedDay.summary}
          </p>
        )}

        <div className="flex gap-2 mt-3">
          <button className="flex-1 py-2 bg-[#C45830] text-white rounded-lg text-sm font-medium hover:bg-[#A03820] transition-colors">
            Apply Changes
          </button>
          <button className="px-4 py-2 bg-[#F5F0E8] text-[#8B7355] rounded-lg text-sm font-medium hover:bg-[#E8DFD3] transition-colors">
            Keep Current
          </button>
        </div>
      </div>
    );
  }

  // Fallback for unknown artifact types
  return null;
};

// Helper to generate quick replies based on context
const generateQuickReplies = (message: AgentMessage, artifactType?: string): string[] => {
  // Only show quick replies for assistant messages that are complete
  if (message.role !== 'assistant' || message.isStreaming) return [];

  // Context-based quick replies
  if (artifactType === 'activity_grid') {
    return ['Show more', 'Filter by rating', 'Add all to itinerary'];
  }
  if (artifactType === 'hotel_list') {
    return ['Sort by price', 'Show on map', 'More options'];
  }
  if (artifactType === 'weather_display') {
    return ['Weekly forecast', 'Best time to visit', 'Packing tips'];
  }
  if (artifactType === 'route_comparison') {
    return ['Keep current', 'Explain difference', 'Show on map'];
  }
  if (artifactType === 'day_comparison') {
    return ['Apply changes', 'Explain more', 'Try another option'];
  }

  // Generic follow-up suggestions based on content
  const content = message.content.toLowerCase();
  if (content.includes('restaurant') || content.includes('food')) {
    return ['Book a table', 'More restaurants', 'Local dishes'];
  }
  if (content.includes('activity') || content.includes('thing to do')) {
    return ['Add to day', 'More like this', 'Hidden gems'];
  }
  if (content.includes('hotel') || content.includes('stay')) {
    return ['Check prices', 'See location', 'Compare options'];
  }

  // Default replies
  return ['Tell me more', 'Show alternatives'];
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
    currentArtifact,
    addActivityToDay,
  } = useAgent();

  const [inputValue, setInputValue] = useState('');
  const [showArtifact] = useState(true);
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

  // Handle quick reply click
  const handleQuickReply = async (reply: string) => {
    await sendMessage(reply);
  };

  // Handle adding activity from artifact
  const handleAddActivity = async (activity: any) => {
    // Default to day 1 if no specific day context
    const result = await addActivityToDay(activity, 1, 'afternoon');
    if (result.success) {
      await sendMessage(`I've added "${activity.name}" to my itinerary. What else do you recommend?`);
    }
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
      initial={{ x: isExpanded ? 0 : 300 }}
      animate={{ x: isExpanded ? 0 : 300 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className={`
        w-[300px] h-full
        bg-[#FFFBF5]
        border-l border-[#E8DFD3]
        flex flex-col
        overflow-hidden
        ${className}
      `}
    >
      {/* Header - Compact */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#E8DFD3] flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C45830] to-[#D4A853] flex items-center justify-center shadow-sm">
            <Compass className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-[14px] text-[#2C2417]">
              Travel Companion
            </h2>
            <p className="text-[11px] text-[#8B7355]">
              {isLoading ? 'Thinking...' : 'Here to help'}
            </p>
          </div>
        </div>

        {/* Minimize button */}
        {onToggleExpand && (
          <button
            onClick={onToggleExpand}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#8B7355] hover:bg-[#F5F0E8] hover:text-[#2C2417] transition-colors"
            title="Minimize"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scrollbar-hide min-h-0">
        {showEmptyState ? (
          /* Welcome State - Compact */
          <div className="flex flex-col items-center justify-center text-center px-2 py-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FFF0EB] to-[#F5F0E8] flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5 text-[#C45830]" />
            </div>
            <h3 className="text-[15px] font-semibold text-[#2C2417] mb-1">
              Your Travel Companion
            </h3>
            <p className="text-[13px] text-[#8B7355] mb-4 max-w-[220px] leading-relaxed">
              I know everything about your destinations. Ask me anything about activities,
              restaurants, weather, or local tips!
            </p>

            {/* Quick Suggestions - Compact */}
            <div className="w-full">
              <p className="text-[10px] font-medium text-[#8B7355] uppercase tracking-wide mb-2">
                Try asking
              </p>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {defaultSuggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-2.5 py-1 bg-[#F5F0E8] border border-[#E8DFD3] rounded-full text-[12px] text-[#2C2417] hover:bg-[#E8DFD3] transition-colors"
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
            {messages.map((message, index) => {
              const isLastMessage = index === messages.length - 1;
              const isLastAssistant = message.role === 'assistant' && isLastMessage && !message.isStreaming;
              const quickReplies = isLastAssistant
                ? generateQuickReplies(message, currentArtifact?.type)
                : [];

              return (
                <div key={message.id}>
                  {message.role === 'user' ? (
                    <UserMessage message={message} />
                  ) : message.role === 'assistant' ? (
                    isErrorMessage(message) ? (
                      <ErrorMessage
                        message={message.content}
                        onRetry={isLastMessage ? () => {
                          // Find the last user message and retry
                          const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
                          if (lastUserMsg) {
                            sendMessage(lastUserMsg.content);
                          }
                        } : undefined}
                      />
                    ) : (
                      <>
                        <AssistantMessage message={message} />
                        {/* Show quick replies only for last assistant message */}
                        {quickReplies.length > 0 && !isLoading && (
                          <QuickReplyButtons
                            replies={quickReplies}
                            onReply={handleQuickReply}
                          />
                        )}
                      </>
                    )
                  ) : null}
                </div>
              );
            })}

            {/* Typing indicator when loading without content yet */}
            {isLoading &&
              messages.length > 0 &&
              messages[messages.length - 1].role === 'user' && (
                <TypingIndicator />
              )}

            {/* Tool execution status - enhanced card */}
            <AnimatePresence>
              {activeTools.length > 0 && (
                <ToolStatusCard tools={activeTools} />
              )}
            </AnimatePresence>

            {/* Artifact Display - Shows after messages when available */}
            <AnimatePresence>
              {currentArtifact && showArtifact && !isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: 0.2 }}
                >
                  <CompactArtifactDisplay
                    artifact={currentArtifact}
                    onAddActivity={handleAddActivity}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area - Compact */}
      <div className="p-3 border-t border-[#E8DFD3] bg-[#FFFBF5] flex-shrink-0">
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
                px-3 py-2.5
                bg-white
                border border-[#E8DFD3]
                rounded-xl
                text-[14px] text-[#2C2417]
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
              w-10 h-10
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
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
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

// ==================== MOBILE COMPANION DRAWER ====================

interface MobileCompanionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
}

export function MobileCompanionDrawer({
  isOpen,
  onClose,
  onOpen,
}: MobileCompanionDrawerProps) {
  const {
    messages,
    isLoading,
    sendMessage,
    activeTools,
    currentArtifact,
    addActivityToDay,
  } = useAgent();

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Handle message submission
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const message = inputValue.trim();
    setInputValue('');
    await sendMessage(message);
  };

  // Handle quick reply
  const handleQuickReply = async (reply: string) => {
    await sendMessage(reply);
  };

  // Handle adding activity
  const handleAddActivity = async (activity: any) => {
    const result = await addActivityToDay(activity, 1, 'afternoon');
    if (result.success) {
      await sendMessage(`Added "${activity.name}" to my itinerary!`);
    }
  };

  const showEmptyState = messages.length === 0;

  return (
    <>
      {/* Floating trigger button - always visible on mobile */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={onOpen}
            className="
              fixed bottom-6 right-4
              md:hidden
              w-14 h-14
              bg-gradient-to-br from-[#C45830] to-[#D4A853]
              rounded-full
              flex items-center justify-center
              shadow-lg shadow-[#C45830]/30
              z-40
            "
          >
            <Compass className="w-6 h-6 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Drawer Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-50 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Drawer Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="
              fixed inset-x-0 bottom-0
              md:hidden
              bg-[#FFFBF5]
              rounded-t-3xl
              shadow-xl
              z-50
              flex flex-col
              max-h-[85vh]
            "
          >
            {/* Drag handle */}
            <div className="flex justify-center py-3">
              <div className="w-10 h-1 rounded-full bg-[#E8DFD3]" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3 border-b border-[#E8DFD3]">
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
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8B7355] hover:bg-[#F5F0E8] hover:text-[#2C2417] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-[200px]">
              {showEmptyState ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FFF0EB] to-[#F5F0E8] flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-6 h-6 text-[#C45830]" />
                  </div>
                  <h3 className="text-base font-semibold text-[#2C2417] mb-1">
                    Ask me anything
                  </h3>
                  <p className="text-sm text-[#8B7355]">
                    Activities, restaurants, weather, local tips...
                  </p>
                  {/* Quick suggestions */}
                  <div className="flex flex-wrap gap-2 justify-center mt-4">
                    {defaultSuggestions.slice(0, 3).map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(suggestion.prompt)}
                        className="px-3 py-1.5 bg-[#F5F0E8] border border-[#E8DFD3] rounded-full text-sm text-[#2C2417] hover:bg-[#E8DFD3] transition-colors"
                      >
                        {suggestion.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message, index) => {
                    const isLastMessage = index === messages.length - 1;
                    const isLastAssistant = message.role === 'assistant' && isLastMessage && !message.isStreaming;
                    const quickReplies = isLastAssistant
                      ? generateQuickReplies(message, currentArtifact?.type)
                      : [];

                    return (
                      <div key={message.id}>
                        {message.role === 'user' ? (
                          <UserMessage message={message} />
                        ) : message.role === 'assistant' ? (
                          <>
                            <AssistantMessage message={message} />
                            {quickReplies.length > 0 && !isLoading && (
                              <QuickReplyButtons
                                replies={quickReplies}
                                onReply={handleQuickReply}
                              />
                            )}
                          </>
                        ) : null}
                      </div>
                    );
                  })}

                  {/* Typing indicator */}
                  {isLoading &&
                    messages.length > 0 &&
                    messages[messages.length - 1].role === 'user' && (
                      <TypingIndicator />
                    )}

                  {/* Tool status */}
                  {activeTools.length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-[#FFF0EB] rounded-lg border border-[#E8DFD3]">
                      <Loader2 className="w-4 h-4 text-[#C45830] animate-spin" />
                      <span className="text-sm text-[#8B7355]">
                        {activeTools[0].name === 'searchActivities'
                          ? 'Searching...'
                          : activeTools[0].name === 'searchHotels'
                          ? 'Finding hotels...'
                          : 'Working...'}
                      </span>
                    </div>
                  )}

                  {/* Artifact */}
                  {currentArtifact && !isLoading && (
                    <CompactArtifactDisplay
                      artifact={currentArtifact}
                      onAddActivity={handleAddActivity}
                    />
                  )}

                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-[#E8DFD3] bg-[#FFFBF5]">
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask anything..."
                  disabled={isLoading}
                  className="
                    flex-1
                    px-4 py-3
                    bg-white
                    border border-[#E8DFD3]
                    rounded-xl
                    text-[15px] text-[#2C2417]
                    placeholder:text-[#D4C4B0]
                    focus:outline-none focus:ring-2 focus:ring-[#C45830] focus:border-transparent
                    disabled:opacity-50
                  "
                />
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
                    disabled:opacity-50
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
        )}
      </AnimatePresence>
    </>
  );
}

export default CompanionPanel;

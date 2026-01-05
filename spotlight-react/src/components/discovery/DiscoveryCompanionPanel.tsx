/**
 * DiscoveryCompanionPanel
 *
 * The companion interface for the discovery phase.
 *
 * Mobile: Draggable bottom sheet with SWIPEABLE TABS
 *   - Route Tab: Full-height city management with drag-to-reorder
 *   - Chat Tab: Full-height conversation with the planning companion
 *   - Smooth horizontal swipe between tabs
 *   - Unread indicator badge
 *
 * Desktop: Fixed sidebar on the right (380px)
 *
 * Design: Editorial Travel Journal aesthetic
 *   - Sophisticated typography
 *   - Generous whitespace
 *   - Premium interactions
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import {
  MessageCircle,
  ChevronUp,
  Sparkles,
  MapPin,
  X,
  GripVertical,
  Send,
  Loader2,
  Route,
  Map,
  Calendar,
  Compass,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useDiscoveryStore } from '../../stores/discoveryStore';
import { getStoredItineraryId } from '../../hooks/useItineraryGeneration';
import type { DiscoveryRoute, TripSummary, DiscoveryCity } from '../../stores/discoveryStore';
import { SortableCityList } from './SortableCityList';
import { useDiscoveryCompanion } from '../../hooks/useDiscoveryCompanion';
import {
  VoyagerThinkingIndicator,
  VoyagerToolBadge,
  VoyagerProactiveSuggestion,
} from './VoyagerStreamingUI';

interface QuickChip {
  id: string;
  label: string;
  emoji?: string;
}

/**
 * Stub QuickActionChips component
 */
function QuickActionChips({
  options,
  onSelect,
  visible,
}: {
  options: QuickChip[];
  onSelect: (chip: QuickChip) => void;
  visible: boolean;
  dismissDelay?: number;
}) {
  if (!visible) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((chip) => (
        <button
          key={chip.id}
          onClick={() => onSelect(chip)}
          className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 rounded-full text-sm text-stone-700 transition-colors"
        >
          {chip.emoji && <span className="mr-1">{chip.emoji}</span>}
          {chip.label}
        </button>
      ))}
    </div>
  );
}

function createVibeChips(): QuickChip[] {
  return [
    { id: 'adventure', label: 'Adventure', emoji: '🏔️' },
    { id: 'culture', label: 'Culture', emoji: '🏛️' },
    { id: 'food', label: 'Food & Wine', emoji: '🍷' },
    { id: 'relaxation', label: 'Relaxation', emoji: '🌴' },
  ];
}

function createTextChips(labels: string[]): QuickChip[] {
  return labels.map((label, i) => ({
    id: `chip-${i}`,
    label,
  }));
}

interface DiscoveryCompanionPanelProps {
  route: DiscoveryRoute | null;
  tripSummary: TripSummary | null;
  isDesktop: boolean;
  isExpanded: boolean;
  onProceed: () => void;
}

// Mobile bottom sheet heights - taller for better usability
const COLLAPSED_HEIGHT = 140;
const EXPANDED_HEIGHT = 520;

// Tab configuration
type TabId = 'route' | 'chat';
const TABS: { id: TabId; label: string; icon: typeof Route }[] = [
  { id: 'route', label: 'Your Route', icon: Map },
  { id: 'chat', label: 'Assistant', icon: MessageCircle },
];

/**
 * DiscoveryCompanionPanel
 */
export function DiscoveryCompanionPanel({
  route,
  tripSummary,
  isDesktop,
  isExpanded: _isExpanded,
  onProceed,
}: DiscoveryCompanionPanelProps) {
  void _isExpanded;
  const { companionMessages, toggleCitySelection } = useDiscoveryStore();
  const reorderCities = useDiscoveryStore((state) => state.reorderCities);
  const selectCity = useDiscoveryStore((state) => state.selectCity);
  const getSelectedCities = useDiscoveryStore((state) => state.getSelectedCities);
  const selectedCities = getSelectedCities();

  // Mobile drag state
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const y = useMotionValue(0);
  const dragAmount = EXPANDED_HEIGHT - COLLAPSED_HEIGHT;

  const height = useTransform(
    y,
    [-dragAmount, 0],
    [EXPANDED_HEIGHT, COLLAPSED_HEIGHT]
  );

  const handleDragEnd = (_: any, info: { velocity: { y: number }; offset: { y: number } }) => {
    const shouldExpand = info.velocity.y < -500 || info.offset.y < -dragAmount / 2;
    const shouldCollapse = info.velocity.y > 500 || info.offset.y > dragAmount / 2;

    if (shouldExpand) {
      animate(y, -dragAmount, { type: 'spring', stiffness: 300, damping: 30 });
      setMobileExpanded(true);
    } else if (shouldCollapse) {
      animate(y, 0, { type: 'spring', stiffness: 300, damping: 30 });
      setMobileExpanded(false);
    } else {
      animate(y, mobileExpanded ? -dragAmount : 0, {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      });
    }
  };

  if (isDesktop) {
    return (
      <DesktopSidebar
        route={route}
        tripSummary={tripSummary}
        companionMessages={companionMessages}
        selectedCities={selectedCities}
        selectedCityId={useDiscoveryStore.getState().selectedCityId}
        onToggleCity={toggleCitySelection}
        onReorderCities={reorderCities}
        onSelectCity={selectCity}
        onProceed={onProceed}
      />
    );
  }

  return (
    <MobileBottomSheet
      route={route}
      tripSummary={tripSummary}
      selectedCities={selectedCities}
      companionMessages={companionMessages}
      onToggleCity={toggleCitySelection}
      onReorderCities={reorderCities}
      onSelectCity={selectCity}
      onProceed={onProceed}
      y={y}
      height={height}
      isExpanded={mobileExpanded}
      onDragEnd={handleDragEnd}
      onToggleExpand={() => {
        const newExpanded = !mobileExpanded;
        animate(y, newExpanded ? -dragAmount : 0, {
          type: 'spring',
          stiffness: 300,
          damping: 30,
        });
        setMobileExpanded(newExpanded);
      }}
    />
  );
}

// ============================================================================
// Desktop Sidebar (kept similar, with minor refinements)
// ============================================================================

interface DesktopSidebarProps {
  route: DiscoveryRoute | null;
  tripSummary: TripSummary | null;
  companionMessages: any[];
  selectedCities: DiscoveryCity[];
  selectedCityId: string | null;
  onToggleCity: (cityId: string) => void;
  onReorderCities: (orderedCityIds: string[]) => void;
  onSelectCity: (cityId: string | null) => void;
  onProceed: () => void;
}

function DesktopSidebar({
  route,
  tripSummary: _tripSummary,
  companionMessages,
  selectedCities,
  selectedCityId,
  onToggleCity,
  onReorderCities,
  onSelectCity,
  onProceed: _onProceed,
}: DesktopSidebarProps) {
  void _tripSummary;
  void _onProceed;
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Use real Voyager companion hook
  const {
    messages: conversation,
    sendMessage,
    isLoading,
    thinking,
    activeTool,
    proactiveSuggestion,
    dismissProactiveSuggestion,
    handleQuickAction,
  } = useDiscoveryCompanion();

  const [inputValue, setInputValue] = useState('');
  const [showChat, setShowChat] = useState(false);

  // Check if an itinerary was previously generated
  const storedItineraryId = getStoredItineraryId();
  const hasExistingItinerary = !!storedItineraryId;

  useEffect(() => {
    if (messagesEndRef.current && conversation.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation]);

  const handleSend = useCallback(() => {
    if (!inputValue.trim() || isLoading) return;
    sendMessage(inputValue.trim());
    setInputValue('');
    setShowChat(true);
  }, [inputValue, isLoading, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.aside
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1], delay: 0.2 }}
      className="
        fixed top-0 right-0 bottom-0
        w-[380px] bg-white
        border-l border-stone-200
        flex flex-col
        z-20
      "
    >
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-stone-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-stone-900 tracking-tight">Your Journey</h2>
            <p className="text-sm text-stone-500">
              {selectedCities.length} stops selected
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {/* Chat section */}
        <div className="p-4 border-b border-stone-100">
          {/* Proactive suggestion from Voyager */}
          {proactiveSuggestion && (
            <div className="mb-3">
              <VoyagerProactiveSuggestion
                suggestion={proactiveSuggestion}
                onAction={handleQuickAction}
                onDismiss={dismissProactiveSuggestion}
              />
            </div>
          )}

          {showChat && conversation.length > 0 ? (
            <div className="space-y-3 max-h-[200px] overflow-y-auto mb-3">
              {conversation
                .filter((msg: any, idx: number, arr: any[]) =>
                  arr.findIndex((m: any) => m.id === msg.id) === idx
                )
                .map((msg: any) => (
                <div
                  key={msg.id}
                  className={`
                    ${msg.role === 'user'
                      ? 'ml-8 bg-gradient-to-br from-stone-800 to-stone-900 text-white'
                      : 'mr-8 bg-gradient-to-br from-stone-50 to-stone-100/80 border border-stone-200/60'
                    }
                    rounded-2xl ${msg.role === 'user' ? 'rounded-br-md' : 'rounded-tl-md'} p-3 text-sm
                  `}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 border border-amber-200/60 flex items-center justify-center">
                        <Compass className="w-2.5 h-2.5 text-amber-700" />
                      </div>
                      <span className="text-xs font-medium text-stone-500 tracking-wide" style={{ fontFamily: 'Fraunces, serif' }}>
                        Voyager
                      </span>
                    </div>
                  )}
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none text-stone-700">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-1 last:mb-0 leading-relaxed">{children}</p>,
                          strong: ({ children }) => <strong className="font-semibold text-stone-900">{children}</strong>,
                          ul: ({ children }) => <ul className="list-disc pl-4 my-1">{children}</ul>,
                          li: ({ children }) => <li className="text-sm">{children}</li>,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="leading-relaxed">{msg.content}</p>
                  )}
                </div>
              ))}

              {/* Voyager thinking indicator */}
              <VoyagerThinkingIndicator isThinking={thinking.isThinking} text={thinking.text} />

              {/* Active tool badge */}
              {activeTool && !thinking.isThinking && (
                <div className="ml-10">
                  <VoyagerToolBadge tool={activeTool} />
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          ) : companionMessages.length > 0 ? (
            <div className="bg-gradient-to-br from-stone-50 to-stone-100 rounded-2xl p-4 mb-3 border border-stone-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 border border-amber-200/60 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Compass className="w-4 h-4 text-amber-700" />
                </div>
                <p className="text-sm text-stone-700 leading-relaxed flex-1" style={{ fontFamily: 'Satoshi, system-ui, sans-serif' }}>
                  {companionMessages[companionMessages.length - 1]?.content}
                </p>
              </div>
            </div>
          ) : null}

          {/* Chat input */}
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Voyager anything..."
              disabled={isLoading || thinking.isThinking}
              className="
                flex-1 px-4 py-2.5
                bg-stone-50 rounded-xl
                text-sm text-stone-900
                placeholder:text-stone-400
                border border-stone-200
                focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20
                focus:outline-none focus:bg-white
                disabled:opacity-50
                transition-all duration-200
              "
              style={{ fontFamily: 'Satoshi, system-ui, sans-serif' }}
            />
            <motion.button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading || thinking.isThinking}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="
                w-10 h-10 rounded-xl
                bg-gradient-to-br from-amber-500 to-orange-500 text-white
                flex items-center justify-center
                shadow-lg shadow-amber-500/25
                disabled:from-stone-300 disabled:to-stone-400 disabled:shadow-none
                transition-all duration-200
              "
            >
              {isLoading || thinking.isThinking ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </motion.button>
          </div>

          {/* Vibe chips */}
          {!showChat && (
            <div className="mt-3">
              <p className="text-xs text-stone-500 mb-2 uppercase tracking-wide font-medium">What vibe are you after?</p>
              <QuickActionChips
                options={createVibeChips()}
                onSelect={(chip) => {
                  sendMessage(`I'm interested in ${chip.label.toLowerCase()} experiences`);
                  setShowChat(true);
                }}
                visible={true}
                dismissDelay={0}
              />
            </div>
          )}

          {showChat && conversation.length > 0 && !isLoading && !thinking.isThinking && (
            <div className="mt-3">
              <QuickActionChips
                options={createTextChips(['Tell me more', 'What else is nearby?', 'Show hidden gems'])}
                onSelect={(chip) => sendMessage(chip.label)}
                visible={true}
                dismissDelay={300}
              />
            </div>
          )}
        </div>

        {/* Route list */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wide">Your Route</h3>
            <p className="text-xs text-stone-400 flex items-center gap-1">
              <GripVertical className="w-3 h-3" />
              Drag to reorder
            </p>
          </div>

          <SortableCityList
            cities={selectedCities}
            selectedCityId={selectedCityId}
            onReorder={onReorderCities}
            onRemoveCity={onToggleCity}
            onSelectCity={onSelectCity}
          />
        </div>

        {/* Suggested cities */}
        {route && route.suggestedCities.filter((c) => !c.isSelected).length > 0 && (
          <div className="p-4 border-t border-stone-100">
            <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-3">Add More Stops</h3>
            <div className="space-y-2">
              {route.suggestedCities
                .filter((c) => !c.isSelected)
                .map((city) => (
                  <SuggestedCityCard key={city.id} city={city} onAdd={() => onToggleCity(city.id)} />
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 p-4 border-t border-stone-100 bg-white">
        {/* View Itinerary button - shown if one exists */}
        {hasExistingItinerary && (
          <motion.button
            onClick={() => navigate('/itinerary')}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="
              w-full flex items-center justify-center gap-2
              py-3 rounded-xl
              bg-gradient-to-r from-amber-50 to-orange-50
              border border-amber-200
              text-amber-700
              font-medium
              hover:border-amber-300 hover:bg-amber-50
              transition-all duration-200
            "
          >
            <Calendar className="w-4 h-4" />
            <span>View Your Itinerary</span>
          </motion.button>
        )}
      </div>
    </motion.aside>
  );
}

// ============================================================================
// Mobile Bottom Sheet with Swipeable Tabs
// ============================================================================

interface MobileBottomSheetProps {
  route: DiscoveryRoute | null;
  tripSummary: TripSummary | null;
  selectedCities: DiscoveryCity[];
  companionMessages: any[];
  onToggleCity: (cityId: string) => void;
  onReorderCities: (orderedCityIds: string[]) => void;
  onSelectCity: (cityId: string | null) => void;
  onProceed: () => void;
  y: any;
  height: any;
  isExpanded: boolean;
  onDragEnd: any;
  onToggleExpand: () => void;
}

function MobileBottomSheet({
  route,
  selectedCities,
  companionMessages,
  onToggleCity,
  onReorderCities,
  onSelectCity,
  onProceed: _onProceed,
  y,
  height,
  isExpanded,
  onDragEnd,
  onToggleExpand,
}: MobileBottomSheetProps) {
  const navigate = useNavigate();

  // Tab state
  const [activeTab, setActiveTab] = useState<TabId>('route');
  const [hasUnreadChat, setHasUnreadChat] = useState(false);

  // Check if an itinerary was previously generated
  const storedItineraryId = getStoredItineraryId();
  const hasExistingItinerary = !!storedItineraryId;

  // Swipe tracking
  const tabContentRef = useRef<HTMLDivElement>(null);
  const swipeX = useMotionValue(0);

  // Chat state - use real Voyager companion hook
  const {
    messages: conversation,
    sendMessage,
    isLoading,
    thinking,
    activeTool,
    proactiveSuggestion,
    dismissProactiveSuggestion,
    handleQuickAction,
  } = useDiscoveryCompanion();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Track unread messages when on route tab
  useEffect(() => {
    if (activeTab === 'route' && conversation.length > 0) {
      const lastMsg = conversation[conversation.length - 1];
      if (lastMsg.role === 'assistant') {
        setHasUnreadChat(true);
      }
    }
  }, [conversation, activeTab]);

  // Clear unread when switching to chat tab
  useEffect(() => {
    if (activeTab === 'chat') {
      setHasUnreadChat(false);
    }
  }, [activeTab]);

  // Auto-scroll chat
  useEffect(() => {
    if (messagesEndRef.current && activeTab === 'chat') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation, activeTab]);

  // Handle tab swipe
  const handleSwipeEnd = (_: any, info: PanInfo) => {
    const threshold = 50;
    const velocity = info.velocity.x;
    const offset = info.offset.x;

    if (velocity < -500 || offset < -threshold) {
      // Swipe left → go to chat
      if (activeTab === 'route') setActiveTab('chat');
    } else if (velocity > 500 || offset > threshold) {
      // Swipe right → go to route
      if (activeTab === 'chat') setActiveTab('route');
    }

    animate(swipeX, 0, { type: 'spring', stiffness: 500, damping: 50 });
  };

  // Handle send
  const handleSend = useCallback(() => {
    if (!inputValue.trim() || isLoading) return;
    sendMessage(inputValue.trim());
    setInputValue('');
  }, [inputValue, isLoading, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div
      style={{ height }}
      className="
        fixed bottom-0 left-0 right-0
        bg-white rounded-t-[28px]
        shadow-[0_-8px_40px_rgba(0,0,0,0.12)]
        z-30
        flex flex-col
        overflow-hidden
      "
    >
      {/* Drag handle + Header */}
      <motion.div
        drag="y"
        dragConstraints={{ top: -(EXPANDED_HEIGHT - COLLAPSED_HEIGHT), bottom: 0 }}
        dragElastic={0.1}
        onDragEnd={onDragEnd}
        style={{ y }}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing"
      >
        {/* Drag pill */}
        <div className="flex flex-col items-center pt-3 pb-2">
          <div className="w-12 h-1.5 rounded-full bg-stone-300" />
        </div>

        {/* Collapse/expand header */}
        <button
          onClick={onToggleExpand}
          className="w-full flex items-center justify-between px-5 pb-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <span className="font-semibold text-stone-900 block text-[15px]">
                {selectedCities.length} stops
              </span>
              <span className="text-xs text-stone-500">
                {isExpanded ? 'Tap to collapse' : 'Tap to expand'}
              </span>
            </div>
          </div>

          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronUp className="w-5 h-5 text-stone-400" />
          </motion.div>
        </button>
      </motion.div>

      {/* Tab Bar - only visible when expanded */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex-shrink-0 px-4 pb-2"
          >
            <div className="relative flex bg-stone-100 rounded-2xl p-1">
              {/* Animated background pill */}
              <motion.div
                className="absolute top-1 bottom-1 bg-white rounded-xl shadow-sm"
                initial={false}
                animate={{
                  x: activeTab === 'route' ? 0 : '100%',
                  width: '50%',
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />

              {/* Tab buttons */}
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const showBadge = tab.id === 'chat' && hasUnreadChat && !isActive;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      relative flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                      text-sm font-medium transition-colors duration-200 z-10
                      ${isActive ? 'text-stone-900' : 'text-stone-500'}
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>

                    {/* Unread badge */}
                    {showBadge && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-0.5 right-3 w-2.5 h-2.5 bg-teal-500 rounded-full border-2 border-stone-100"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Content - Swipeable */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <motion.div
          ref={tabContentRef}
          drag={isExpanded ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleSwipeEnd}
          style={{ x: swipeX }}
          className="h-full"
        >
          <AnimatePresence mode="wait">
            {activeTab === 'route' ? (
              <motion.div
                key="route"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="h-full overflow-y-auto"
              >
                <RouteTabContent
                  route={route}
                  selectedCities={selectedCities}
                  selectedCityId={useDiscoveryStore.getState().selectedCityId}
                  onToggleCity={onToggleCity}
                  onReorderCities={onReorderCities}
                  onSelectCity={onSelectCity}
                  isExpanded={isExpanded}
                />
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="h-full flex flex-col"
              >
                <ChatTabContent
                  companionMessages={companionMessages}
                  conversation={conversation}
                  isLoading={isLoading}
                  thinking={thinking}
                  activeTool={activeTool}
                  proactiveSuggestion={proactiveSuggestion}
                  dismissProactiveSuggestion={dismissProactiveSuggestion}
                  handleQuickAction={handleQuickAction}
                  inputValue={inputValue}
                  setInputValue={setInputValue}
                  onSend={handleSend}
                  onKeyDown={handleKeyDown}
                  messagesEndRef={messagesEndRef}
                  sendMessage={sendMessage}
                  isExpanded={isExpanded}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 p-4 border-t border-stone-100 bg-white">
        {/* View Itinerary button - shown if one exists */}
        {hasExistingItinerary && (
          <motion.button
            onClick={() => navigate('/itinerary')}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.98 }}
            className="
              w-full flex items-center justify-center gap-2
              py-3 rounded-xl
              bg-gradient-to-r from-amber-50 to-orange-50
              border border-amber-200
              text-amber-700
              font-medium text-sm
            "
          >
            <Calendar className="w-4 h-4" />
            <span>View Your Itinerary</span>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// Route Tab Content
// ============================================================================

interface RouteTabContentProps {
  route: DiscoveryRoute | null;
  selectedCities: DiscoveryCity[];
  selectedCityId: string | null;
  onToggleCity: (cityId: string) => void;
  onReorderCities: (orderedCityIds: string[]) => void;
  onSelectCity: (cityId: string | null) => void;
  isExpanded: boolean;
}

function RouteTabContent({
  route,
  selectedCities,
  selectedCityId,
  onToggleCity,
  onReorderCities,
  onSelectCity,
  isExpanded,
}: RouteTabContentProps) {
  if (!isExpanded) {
    // Collapsed: show horizontal scroll of city chips
    return (
      <div className="px-4 py-2">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {selectedCities.map((city, index) => (
            <CompactCityChip
              key={city.id}
              city={city}
              index={index}
              onRemove={city.isFixed ? undefined : () => onToggleCity(city.id)}
            />
          ))}
        </div>
      </div>
    );
  }

  // Expanded: full route management
  return (
    <div className="px-4 py-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-stone-500 uppercase tracking-wide font-medium">
          Your stops
        </p>
        <p className="text-xs text-stone-400 flex items-center gap-1">
          <GripVertical className="w-3 h-3" />
          Drag to reorder
        </p>
      </div>

      {/* Sortable city list */}
      <SortableCityList
        cities={selectedCities}
        selectedCityId={selectedCityId}
        onReorder={onReorderCities}
        onRemoveCity={onToggleCity}
        onSelectCity={onSelectCity}
      />

      {/* Add more stops */}
      {route && route.suggestedCities.filter((c) => !c.isSelected).length > 0 && (
        <div className="mt-4 pt-4 border-t border-stone-100">
          <p className="text-xs text-stone-500 uppercase tracking-wide font-medium mb-3">
            Add more stops
          </p>
          <div className="space-y-2">
            {route.suggestedCities
              .filter((c) => !c.isSelected)
              .map((city) => (
                <SuggestedCityCard
                  key={city.id}
                  city={city}
                  onAdd={() => onToggleCity(city.id)}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Chat Tab Content
// ============================================================================

interface ChatTabContentProps {
  companionMessages: any[];
  conversation: any[];
  isLoading: boolean;
  thinking: { isThinking: boolean; text?: string };
  activeTool: { name: string; displayName: string } | null;
  proactiveSuggestion: {
    message: string;
    quickActions: Array<{ label: string; action: string; data?: unknown }>;
    priority: 'high' | 'medium' | 'low';
  } | null;
  dismissProactiveSuggestion: () => void;
  handleQuickAction: (action: string, data?: unknown) => void;
  inputValue: string;
  setInputValue: (v: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  sendMessage: (msg: string) => void;
  isExpanded: boolean;
}

function ChatTabContent({
  companionMessages,
  conversation,
  isLoading,
  thinking,
  activeTool,
  proactiveSuggestion,
  dismissProactiveSuggestion,
  handleQuickAction,
  inputValue,
  setInputValue,
  onSend,
  onKeyDown,
  messagesEndRef,
  sendMessage,
  isExpanded,
}: ChatTabContentProps) {
  const hasConversation = conversation.length > 0;

  if (!isExpanded) {
    // Collapsed: show latest message preview
    const latestMessage = hasConversation
      ? conversation[conversation.length - 1]
      : companionMessages[companionMessages.length - 1];

    return (
      <div className="px-4 py-2">
        <div className="bg-gradient-to-br from-stone-50 to-stone-100/80 rounded-xl p-3 border border-stone-200/60">
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 border border-amber-200/60 flex items-center justify-center flex-shrink-0">
              <Compass className="w-2.5 h-2.5 text-amber-700" />
            </div>
            <p className="text-sm text-stone-600 line-clamp-2 leading-relaxed" style={{ fontFamily: 'Satoshi, system-ui, sans-serif' }}>
              {latestMessage?.content || 'Ask me anything about your trip...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Expanded: full chat interface
  return (
    <>
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {/* Proactive suggestion */}
        {proactiveSuggestion && (
          <div className="mb-2">
            <VoyagerProactiveSuggestion
              suggestion={proactiveSuggestion}
              onAction={handleQuickAction}
              onDismiss={dismissProactiveSuggestion}
            />
          </div>
        )}

        {!hasConversation ? (
          // Welcome state - Voyager branded
          <div className="text-center py-6">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 border border-amber-200/60 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-200/30"
            >
              <Compass className="w-7 h-7 text-amber-700" />
            </motion.div>
            <h3 className="font-semibold text-stone-900 text-lg mb-1" style={{ fontFamily: 'Fraunces, serif' }}>
              Voyager
            </h3>
            <p className="text-sm text-stone-500 leading-relaxed max-w-[260px] mx-auto" style={{ fontFamily: 'Satoshi, system-ui, sans-serif' }}>
              I'm your well-traveled companion. Ask me about hidden gems, local tips, or let me help design your route.
            </p>

            {/* Static companion message if exists */}
            {companionMessages.length > 0 && (
              <div className="mt-4 bg-gradient-to-br from-stone-50 to-stone-100/80 rounded-2xl p-4 text-left border border-stone-200/60">
                <p className="text-sm text-stone-700 leading-relaxed" style={{ fontFamily: 'Satoshi, system-ui, sans-serif' }}>
                  {companionMessages[companionMessages.length - 1]?.content}
                </p>
              </div>
            )}

            {/* Vibe chips */}
            <div className="mt-4">
              <p className="text-xs text-stone-500 uppercase tracking-wide mb-2">What vibe are you after?</p>
              <QuickActionChips
                options={createVibeChips()}
                onSelect={(chip) => {
                  sendMessage(`I'm interested in ${chip.label.toLowerCase()} experiences`);
                }}
                visible={true}
                dismissDelay={0}
              />
            </div>
          </div>
        ) : (
          // Conversation messages
          <>
            {conversation
              .filter((msg: any, idx: number, arr: any[]) =>
                arr.findIndex((m: any) => m.id === msg.id) === idx
              )
              .map((msg: any) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`
                  ${msg.role === 'user'
                    ? 'ml-10'
                    : 'mr-6'
                  }
                `}
              >
                {/* Voyager avatar for assistant messages */}
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 border border-amber-200/60 flex items-center justify-center">
                      <Compass className="w-2.5 h-2.5 text-amber-700" />
                    </div>
                    <span className="text-xs font-medium text-stone-500 tracking-wide" style={{ fontFamily: 'Fraunces, serif' }}>
                      Voyager
                    </span>
                  </div>
                )}
                <div
                  className={`
                    rounded-2xl p-3.5
                    ${msg.role === 'user'
                      ? 'rounded-br-md bg-gradient-to-br from-stone-800 to-stone-900 text-white'
                      : 'rounded-tl-md bg-gradient-to-br from-stone-50 to-stone-100/80 border border-stone-200/60'
                    }
                  `}
                >
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none text-stone-700">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-1.5 last:mb-0 leading-relaxed text-[15px]" style={{ fontFamily: 'Satoshi, system-ui, sans-serif' }}>{children}</p>,
                          strong: ({ children }) => <strong className="font-semibold text-stone-900">{children}</strong>,
                          ul: ({ children }) => <ul className="list-disc pl-4 my-1.5">{children}</ul>,
                          li: ({ children }) => <li className="text-[15px] leading-relaxed">{children}</li>,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-[15px] leading-relaxed">{msg.content}</p>
                  )}
                </div>
              </motion.div>
            ))}

            {/* Voyager thinking indicator */}
            <VoyagerThinkingIndicator isThinking={thinking.isThinking} text={thinking.text} />

            {/* Active tool badge */}
            {activeTool && !thinking.isThinking && (
              <div className="ml-8">
                <VoyagerToolBadge tool={activeTool} />
              </div>
            )}

            {/* Quick follow-ups */}
            {!isLoading && !thinking.isThinking && (
              <div className="pt-2">
                <QuickActionChips
                  options={createTextChips(['Tell me more', 'Hidden gems?', 'Best food?'])}
                  onSelect={(chip) => sendMessage(chip.label)}
                  visible={true}
                  dismissDelay={0}
                />
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 px-4 pb-3 pt-2 border-t border-stone-100 bg-white">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask Voyager anything..."
            disabled={isLoading || thinking.isThinking}
            className="
              flex-1 px-4 py-3
              bg-stone-50 rounded-xl
              text-[15px] text-stone-900
              placeholder:text-stone-400
              border border-stone-200
              focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20
              focus:outline-none focus:bg-white
              disabled:opacity-50
              transition-all duration-200
            "
            style={{ fontFamily: 'Satoshi, system-ui, sans-serif' }}
          />
          <motion.button
            onClick={onSend}
            disabled={!inputValue.trim() || isLoading || thinking.isThinking}
            whileTap={{ scale: 0.95 }}
            className="
              w-11 h-11 rounded-xl
              bg-gradient-to-br from-amber-500 to-orange-500 text-white
              flex items-center justify-center
              shadow-lg shadow-amber-500/25
              disabled:from-stone-300 disabled:to-stone-400 disabled:shadow-none
              transition-all duration-200
            "
          >
            {isLoading || thinking.isThinking ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </motion.button>
        </div>
      </div>
    </>
  );
}

// ============================================================================
// Supporting Components
// ============================================================================

interface SuggestedCityCardProps {
  city: DiscoveryCity;
  onAdd: () => void;
}

function SuggestedCityCard({ city, onAdd }: SuggestedCityCardProps) {
  return (
    <motion.button
      onClick={onAdd}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="
        w-full flex items-center gap-3 p-3
        bg-stone-50 rounded-xl
        border border-dashed border-stone-300
        hover:border-teal-400 hover:bg-teal-50/50
        transition-all duration-200
        text-left
      "
    >
      <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center">
        <MapPin className="w-4 h-4 text-stone-500" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-stone-900 truncate text-sm">
          {city.name}
        </p>
        <p className="text-xs text-stone-500 truncate">
          {city.placeCount} places to discover
        </p>
      </div>

      <div className="text-teal-600 text-sm font-medium">
        + Add
      </div>
    </motion.button>
  );
}

interface CompactCityChipProps {
  city: DiscoveryCity;
  index: number;
  onRemove?: () => void;
}

function CompactCityChip({ city, index, onRemove }: CompactCityChipProps) {
  return (
    <div
      className={`
        flex-shrink-0 flex items-center gap-2
        pl-2 pr-3 py-2 rounded-full
        ${city.isFixed
          ? 'bg-teal-50 border border-teal-200'
          : 'bg-stone-100 border border-stone-200'
        }
      `}
    >
      <div
        className={`
          w-6 h-6 rounded-full flex items-center justify-center
          text-xs font-bold
          ${city.isFixed
            ? 'bg-gradient-to-br from-teal-500 to-emerald-600 text-white'
            : 'bg-stone-300 text-stone-700'
          }
        `}
      >
        {index + 1}
      </div>

      <span className="text-sm font-medium text-stone-800 whitespace-nowrap">
        {city.name}
      </span>

      {onRemove && (
        <button
          onClick={onRemove}
          className="
            w-5 h-5 rounded-full
            bg-stone-200 hover:bg-red-100
            flex items-center justify-center
            text-stone-500 hover:text-red-600
            transition-colors duration-200
          "
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

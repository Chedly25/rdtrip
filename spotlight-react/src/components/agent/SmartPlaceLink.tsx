/**
 * SmartPlaceLink - Contextual Smart Links for place names
 *
 * WI: Idea 6 - Contextual Smart Links
 *
 * Detects place names in agent messages (typically in **bold**) and
 * makes them tappable. Tapping shows a quick action sheet with options:
 * - Add to Trip (with day/time selector)
 * - Get Directions
 * - Save for Later (Ideas Board)
 * - Search for more info
 *
 * Design: Vintage travel aesthetic with tactile feedback
 */

import { useState, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Plus,
  Navigation2,
  Bookmark,
  Search,
  Calendar,
  Sunrise,
  Sun,
  Moon,
  X,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { ResponsiveSheet } from '../ui/ResponsiveSheet';
import { useAgent } from '../../contexts/AgentProvider';
import { hapticTap, hapticImpact } from '../../utils/haptics';

// ============================================================================
// Types
// ============================================================================

export interface SmartPlaceLinkProps {
  /** The place name to display */
  placeName: string;
  /** Children to render (usually the place name text) */
  children: ReactNode;
  /** Optional city context */
  city?: string;
  /** Custom className */
  className?: string;
}

interface QuickAction {
  id: string;
  label: string;
  icon: typeof MapPin;
  color: string;
  bg: string;
  action: () => void;
}

interface TimeSlotOption {
  id: 'morning' | 'afternoon' | 'evening';
  label: string;
  icon: typeof Sunrise;
  color: string;
  time: string;
}

// ============================================================================
// Constants
// ============================================================================

const timeSlots: TimeSlotOption[] = [
  { id: 'morning', label: 'Morning', icon: Sunrise, color: 'text-amber-500', time: '9:00 AM' },
  { id: 'afternoon', label: 'Afternoon', icon: Sun, color: 'text-orange-500', time: '2:00 PM' },
  { id: 'evening', label: 'Evening', icon: Moon, color: 'text-indigo-500', time: '7:00 PM' },
];

// ============================================================================
// SmartPlaceLink Component
// ============================================================================

export function SmartPlaceLink({
  placeName,
  children,
  city,
  className = '',
}: SmartPlaceLinkProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const { sendMessage, pageContext } = useAgent();

  // Get available days from route context - use duration or default to 7
  const totalDays = pageContext?.route?.duration || 7;

  const handleLinkClick = useCallback(() => {
    hapticTap('light');
    setIsSheetOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsSheetOpen(false);
    setShowDayPicker(false);
    setSelectedDay(null);
  }, []);

  // Action handlers
  const handleAddToTrip = useCallback(() => {
    hapticTap('medium');
    setShowDayPicker(true);
  }, []);

  const handleDaySelect = useCallback((day: number) => {
    hapticTap('light');
    setSelectedDay(day);
  }, []);

  const handleTimeSlotSelect = useCallback((timeSlot: TimeSlotOption) => {
    hapticImpact('medium');
    const message = `Add ${placeName} to day ${selectedDay} ${timeSlot.id}`;
    sendMessage(message);
    handleClose();
  }, [placeName, selectedDay, sendMessage, handleClose]);

  const handleGetDirections = useCallback(() => {
    hapticTap('medium');
    const query = encodeURIComponent(placeName + (city ? `, ${city}` : ''));
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    handleClose();
  }, [placeName, city, handleClose]);

  const handleSaveForLater = useCallback(() => {
    hapticTap('medium');
    // Add to Ideas Board via agent
    sendMessage(`Save ${placeName} to my ideas board`);
    handleClose();
  }, [placeName, sendMessage, handleClose]);

  const handleSearchMore = useCallback(() => {
    hapticTap('medium');
    sendMessage(`Tell me more about ${placeName}${city ? ` in ${city}` : ''}`);
    handleClose();
  }, [placeName, city, sendMessage, handleClose]);

  const quickActions: QuickAction[] = [
    {
      id: 'add',
      label: 'Add to Trip',
      icon: Plus,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      action: handleAddToTrip,
    },
    {
      id: 'directions',
      label: 'Get Directions',
      icon: Navigation2,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      action: handleGetDirections,
    },
    {
      id: 'save',
      label: 'Save for Later',
      icon: Bookmark,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      action: handleSaveForLater,
    },
    {
      id: 'search',
      label: 'Learn More',
      icon: Search,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      action: handleSearchMore,
    },
  ];

  return (
    <>
      {/* Tappable Link */}
      <button
        onClick={handleLinkClick}
        className={`
          inline-flex items-center gap-0.5
          font-semibold text-teal-600
          hover:text-teal-700 hover:underline
          active:text-teal-800
          transition-colors cursor-pointer
          ${className}
        `}
        title={`Quick actions for ${placeName}`}
      >
        {children}
        <MapPin className="w-3 h-3 opacity-60 ml-0.5" />
      </button>

      {/* Quick Action Sheet */}
      <ResponsiveSheet
        isOpen={isSheetOpen}
        onClose={handleClose}
        title={placeName}
        subtitle={city || 'Quick Actions'}
        size="sm"
      >
        <AnimatePresence mode="wait">
          {!showDayPicker ? (
            // Main Actions View
            <motion.div
              key="actions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-2"
            >
              {/* Quick action buttons */}
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={action.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={action.action}
                    className={`
                      w-full flex items-center gap-4 p-4 rounded-xl
                      ${action.bg} hover:brightness-95
                      active:scale-[0.98] transition-all
                      text-left
                    `}
                  >
                    <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm`}>
                      <Icon className={`w-5 h-5 ${action.color}`} />
                    </div>
                    <span className={`font-medium text-gray-800`}>
                      {action.label}
                    </span>
                    <ExternalLink className="w-4 h-4 ml-auto text-gray-400" />
                  </motion.button>
                );
              })}

              {/* Decorative sparkle */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="flex justify-center pt-3"
              >
                <Sparkles className="w-5 h-5 text-amber-400" />
              </motion.div>
            </motion.div>
          ) : selectedDay === null ? (
            // Day Selection View
            <motion.div
              key="days"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* Back button */}
              <button
                onClick={() => setShowDayPicker(false)}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 text-sm"
              >
                <X className="w-4 h-4" /> Back
              </button>

              <p className="text-sm text-gray-600 mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Select day for <strong>{placeName}</strong>
              </p>

              {/* Day grid */}
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => (
                  <motion.button
                    key={day}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: day * 0.03 }}
                    onClick={() => handleDaySelect(day)}
                    className={`
                      aspect-square rounded-xl
                      bg-gray-50 hover:bg-teal-50 hover:border-teal-200
                      border-2 border-gray-100
                      flex flex-col items-center justify-center
                      active:scale-95 transition-all
                      font-medium text-gray-700
                    `}
                  >
                    <span className="text-xs text-gray-400">Day</span>
                    <span className="text-lg">{day}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            // Time Slot Selection View
            <motion.div
              key="timeslots"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* Back button */}
              <button
                onClick={() => setSelectedDay(null)}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 text-sm"
              >
                <X className="w-4 h-4" /> Back
              </button>

              <p className="text-sm text-gray-600 mb-4 flex items-center gap-2">
                <Sunrise className="w-4 h-4" />
                Pick time for Day {selectedDay}
              </p>

              {/* Time slot options */}
              <div className="space-y-3">
                {timeSlots.map((slot, index) => {
                  const Icon = slot.icon;
                  return (
                    <motion.button
                      key={slot.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.08 }}
                      onClick={() => handleTimeSlotSelect(slot)}
                      className={`
                        w-full flex items-center gap-4 p-4 rounded-xl
                        bg-gray-50 hover:bg-teal-50 hover:border-teal-200
                        border-2 border-gray-100
                        active:scale-[0.98] transition-all
                      `}
                    >
                      <div className={`w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm`}>
                        <Icon className={`w-6 h-6 ${slot.color}`} />
                      </div>
                      <div className="text-left">
                        <span className="font-medium text-gray-800 block">
                          {slot.label}
                        </span>
                        <span className="text-sm text-gray-500">
                          ~{slot.time}
                        </span>
                      </div>
                      <Plus className="w-5 h-5 ml-auto text-teal-500" />
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </ResponsiveSheet>
    </>
  );
}

// ============================================================================
// Helper: Detect if text looks like a place name
// ============================================================================

/**
 * Heuristics to detect if bold text is likely a place name:
 * - Contains capital letters (proper noun)
 * - Common place indicators: Café, Restaurant, Museum, Park, etc.
 * - NOT a common action word or phrase
 */
export function isProbablyPlaceName(text: string): boolean {
  const trimmed = text.trim();

  // Skip very short or very long text
  if (trimmed.length < 3 || trimmed.length > 80) return false;

  // Skip common non-place bold words
  const skipWords = [
    'note', 'important', 'warning', 'tip', 'pro tip', 'example',
    'summary', 'overview', 'weather', 'temperature', 'day',
    'morning', 'afternoon', 'evening', 'night', 'option', 'step'
  ];
  if (skipWords.some(w => trimmed.toLowerCase() === w)) return false;

  // Skip if starts with common action words
  const actionStarts = ['how to', 'what to', 'where to', 'when to', 'don\'t'];
  if (actionStarts.some(s => trimmed.toLowerCase().startsWith(s))) return false;

  // Positive indicators - definitely a place
  const placeIndicators = [
    'café', 'cafe', 'restaurant', 'bar', 'pub', 'bistro', 'bakery',
    'museum', 'gallery', 'park', 'garden', 'plaza', 'square',
    'church', 'cathedral', 'temple', 'mosque', 'shrine',
    'beach', 'harbor', 'port', 'marina', 'pier', 'wharf',
    'market', 'mall', 'shop', 'store', 'boutique',
    'hotel', 'hostel', 'inn', 'resort', 'lodge',
    'tower', 'castle', 'palace', 'bridge', 'monument', 'fountain',
    'street', 'avenue', 'boulevard', 'lane', 'road', 'way',
    'district', 'quarter', 'neighborhood', 'village', 'town'
  ];
  const lowerText = trimmed.toLowerCase();
  if (placeIndicators.some(p => lowerText.includes(p))) return true;

  // Check if it looks like a proper noun (starts with capital, has capital letters)
  const hasProperNounFormat = /^[A-Z][a-zA-ZÀ-ÿ\s'-]+$/.test(trimmed);
  const hasMultipleWords = trimmed.split(/\s+/).length >= 2;

  // Likely a place if it's a proper noun with multiple words
  if (hasProperNounFormat && hasMultipleWords) return true;

  // Also treat single capitalized words > 5 chars as potential places
  if (hasProperNounFormat && trimmed.length > 5) return true;

  return false;
}

// ============================================================================
// Export
// ============================================================================

export default SmartPlaceLink;

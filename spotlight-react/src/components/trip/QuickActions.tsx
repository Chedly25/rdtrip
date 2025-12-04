/**
 * Quick Actions - Context-Aware Travel Companion
 *
 * A beautiful floating action sheet that provides contextual actions
 * based on your current activity and situation during the trip.
 *
 * Design: "Travel Concierge" - elegant, helpful, anticipatory
 *
 * Context Types:
 * - At restaurant → Tip calculator, call for reservation
 * - At hotel → Check-out reminder, nearby breakfast
 * - Driving → Gas stations, rest stops, scenic detours
 * - Walking → Coffee nearby, restrooms, photo spots
 * - Any time → What's nearby, need help, modify plan
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
  X,
  Navigation,
  Phone,
  Camera,
  Coffee,
  Fuel,
  Utensils,
  MapPin,
  Calculator,
  Clock,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Search,
  Compass,
  Landmark,
  Pill,
  CreditCard,
  MessageCircle,
} from 'lucide-react';

// Wanderlust Editorial Colors
const colors = {
  cream: '#FFFBF5',
  warmWhite: '#FAF7F2',
  terracotta: '#C45830',
  terracottaLight: '#D96A42',
  golden: '#D4A853',
  goldenLight: '#E4BE73',
  goldenDark: '#B8923D',
  sage: '#6B8E7B',
  sageLight: '#8BA99A',
  darkBrown: '#2C2417',
  mediumBrown: '#4A3F35',
  lightBrown: '#8B7355',
  border: '#E8E2D9',
};

// Action categories with icons and colors
const actionCategories = {
  navigation: { icon: Navigation, color: colors.sage, label: 'Navigate' },
  food: { icon: Utensils, color: colors.terracotta, label: 'Food & Drink' },
  practical: { icon: MapPin, color: colors.golden, label: 'Practical' },
  help: { icon: AlertCircle, color: '#E07B39', label: 'Need Help' },
};

// Context-specific action sets
type ContextType = 'restaurant' | 'hotel' | 'driving' | 'walking' | 'attraction' | 'general';

interface QuickAction {
  id: string;
  icon: React.ElementType;
  label: string;
  description?: string;
  category: keyof typeof actionCategories;
  action: () => void;
}

// Quick Action Button Component
const ActionButton = ({
  action,
  index,
  onAction,
}: {
  action: QuickAction;
  index: number;
  onAction: (action: QuickAction) => void;
}) => {
  const category = actionCategories[action.category];

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
      onClick={() => onAction(action)}
      className="flex items-center gap-4 w-full p-4 rounded-2xl transition-all"
      style={{
        background: colors.warmWhite,
        border: `1px solid ${colors.border}`,
      }}
      whileHover={{
        scale: 1.02,
        background: colors.cream,
        borderColor: category.color,
        boxShadow: `0 4px 20px ${category.color}15`,
      }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Icon */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: `${category.color}15`,
          border: `1px solid ${category.color}30`,
        }}
      >
        <action.icon className="w-6 h-6" style={{ color: category.color }} />
      </div>

      {/* Content */}
      <div className="flex-1 text-left">
        <h4
          className="text-base font-medium"
          style={{ color: colors.darkBrown }}
        >
          {action.label}
        </h4>
        {action.description && (
          <p className="text-sm" style={{ color: colors.lightBrown }}>
            {action.description}
          </p>
        )}
      </div>

      {/* Arrow */}
      <ChevronRight className="w-5 h-5" style={{ color: colors.lightBrown }} />
    </motion.button>
  );
};

// Category Chip Component
const CategoryChip = ({
  category,
  isActive,
  onClick,
}: {
  category: keyof typeof actionCategories;
  isActive: boolean;
  onClick: () => void;
}) => {
  const config = actionCategories[category];

  return (
    <motion.button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all"
      style={{
        background: isActive ? config.color : colors.warmWhite,
        border: `1px solid ${isActive ? config.color : colors.border}`,
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <config.icon
        className="w-4 h-4"
        style={{ color: isActive ? 'white' : config.color }}
      />
      <span
        className="text-sm font-medium"
        style={{ color: isActive ? 'white' : colors.mediumBrown }}
      >
        {config.label}
      </span>
    </motion.button>
  );
};

// Nearby Search Result (reserved for future nearby places feature)
export interface NearbyPlace {
  id: string;
  name: string;
  type: string;
  distance: string;
  rating?: number;
  isOpen?: boolean;
}

export const NearbyPlaceCard = ({
  place,
  index,
  onNavigate,
}: {
  place: NearbyPlace;
  index: number;
  onNavigate: (place: NearbyPlace) => void;
}) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.05 }}
    className="flex items-center gap-3 p-3 rounded-xl"
    style={{
      background: colors.warmWhite,
      border: `1px solid ${colors.border}`,
    }}
  >
    <div
      className="w-10 h-10 rounded-lg flex items-center justify-center"
      style={{ background: `${colors.golden}15` }}
    >
      <MapPin className="w-5 h-5" style={{ color: colors.golden }} />
    </div>
    <div className="flex-1 min-w-0">
      <h5 className="text-sm font-medium truncate" style={{ color: colors.darkBrown }}>
        {place.name}
      </h5>
      <div className="flex items-center gap-2 text-xs" style={{ color: colors.lightBrown }}>
        <span>{place.distance}</span>
        {place.rating && (
          <>
            <span>•</span>
            <span>★ {place.rating}</span>
          </>
        )}
        {place.isOpen !== undefined && (
          <>
            <span>•</span>
            <span style={{ color: place.isOpen ? colors.sage : colors.terracotta }}>
              {place.isOpen ? 'Open' : 'Closed'}
            </span>
          </>
        )}
      </div>
    </div>
    <motion.button
      onClick={() => onNavigate(place)}
      className="w-8 h-8 rounded-full flex items-center justify-center"
      style={{ background: colors.sage }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <Navigation className="w-4 h-4 text-white" />
    </motion.button>
  </motion.div>
);

// Tip Calculator Mini Component
const TipCalculator = () => {
  const [amount, setAmount] = useState('');
  const [tipPercent, setTipPercent] = useState(18);

  const tipAmount = amount ? (parseFloat(amount) * tipPercent / 100) : 0;
  const total = amount ? parseFloat(amount) + tipAmount : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl"
      style={{
        background: `linear-gradient(135deg, ${colors.golden}10 0%, ${colors.terracotta}05 100%)`,
        border: `1px solid ${colors.golden}30`,
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-5 h-5" style={{ color: colors.golden }} />
        <span className="text-sm font-medium" style={{ color: colors.darkBrown }}>
          Tip Calculator
        </span>
      </div>

      {/* Bill amount input */}
      <div className="mb-4">
        <label className="text-xs uppercase tracking-wider mb-1 block" style={{ color: colors.lightBrown }}>
          Bill Amount
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg" style={{ color: colors.lightBrown }}>
            $
          </span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full pl-8 pr-4 py-3 rounded-xl text-lg font-medium"
            style={{
              background: 'white',
              border: `1px solid ${colors.border}`,
              color: colors.darkBrown,
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Tip percentage buttons */}
      <div className="flex gap-2 mb-4">
        {[15, 18, 20, 25].map((percent) => (
          <motion.button
            key={percent}
            onClick={() => setTipPercent(percent)}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: tipPercent === percent ? colors.golden : colors.warmWhite,
              color: tipPercent === percent ? 'white' : colors.mediumBrown,
              border: `1px solid ${tipPercent === percent ? colors.golden : colors.border}`,
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {percent}%
          </motion.button>
        ))}
      </div>

      {/* Results */}
      {amount && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-2 gap-4"
        >
          <div className="p-3 rounded-xl bg-white text-center">
            <span className="text-xs uppercase tracking-wider" style={{ color: colors.lightBrown }}>
              Tip
            </span>
            <p className="text-xl font-serif font-medium" style={{ color: colors.golden }}>
              ${tipAmount.toFixed(2)}
            </p>
          </div>
          <div className="p-3 rounded-xl text-center" style={{ background: colors.sage }}>
            <span className="text-xs uppercase tracking-wider text-white/80">
              Total
            </span>
            <p className="text-xl font-serif font-medium text-white">
              ${total.toFixed(2)}
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

interface QuickActionsProps {
  isOpen: boolean;
  onClose: () => void;
  context?: ContextType;
  currentActivity?: {
    name: string;
    type: string;
    phone?: string;
    coordinates?: { lat: number; lng: number };
  };
  onNavigate?: (destination: { lat: number; lng: number; name: string }) => void;
  onCall?: (phone: string) => void;
  onCheckin?: () => void;
  onFindNearby?: (category: string) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  isOpen,
  onClose,
  context = 'general',
  currentActivity,
  onNavigate,
  onCall,
  onCheckin,
  onFindNearby,
}) => {
  const [activeCategory, setActiveCategory] = useState<keyof typeof actionCategories | null>(null);
  const [showTipCalculator, setShowTipCalculator] = useState(false);
  // Reserved for future nearby search feature
  const [_searchQuery, _setSearchQuery] = useState('');
  void _searchQuery; void _setSearchQuery;

  // Build context-specific actions
  const contextActions = useMemo((): QuickAction[] => {
    const baseActions: QuickAction[] = [];

    // Context-specific actions
    switch (context) {
      case 'restaurant':
        baseActions.push(
          {
            id: 'tip',
            icon: Calculator,
            label: 'Calculate Tip',
            description: 'Split the bill and calculate gratuity',
            category: 'practical',
            action: () => setShowTipCalculator(true),
          },
          {
            id: 'call-restaurant',
            icon: Phone,
            label: 'Call Restaurant',
            description: currentActivity?.phone || 'Confirm your reservation',
            category: 'practical',
            action: () => currentActivity?.phone && onCall?.(currentActivity.phone),
          }
        );
        break;

      case 'hotel':
        baseActions.push(
          {
            id: 'checkout',
            icon: Clock,
            label: 'Check-out Time',
            description: 'Typically 11:00 AM',
            category: 'practical',
            action: () => {},
          },
          {
            id: 'breakfast',
            icon: Coffee,
            label: 'Find Breakfast',
            description: 'Cafes and bakeries nearby',
            category: 'food',
            action: () => onFindNearby?.('breakfast'),
          }
        );
        break;

      case 'driving':
        baseActions.push(
          {
            id: 'gas',
            icon: Fuel,
            label: 'Find Gas Station',
            description: 'Fuel up nearby',
            category: 'practical',
            action: () => onFindNearby?.('gas_station'),
          },
          {
            id: 'rest-stop',
            icon: Coffee,
            label: 'Rest Stop',
            description: 'Take a break',
            category: 'practical',
            action: () => onFindNearby?.('rest_stop'),
          },
          {
            id: 'scenic',
            icon: Landmark,
            label: 'Scenic Detour',
            description: 'Worth the extra miles',
            category: 'navigation',
            action: () => onFindNearby?.('scenic'),
          }
        );
        break;

      case 'walking':
        baseActions.push(
          {
            id: 'coffee',
            icon: Coffee,
            label: 'Coffee Break',
            description: 'Cafes within walking distance',
            category: 'food',
            action: () => onFindNearby?.('cafe'),
          },
          {
            id: 'photo-spot',
            icon: Camera,
            label: 'Photo Spots',
            description: 'Instagram-worthy views',
            category: 'navigation',
            action: () => onFindNearby?.('viewpoint'),
          }
        );
        break;

      case 'attraction':
        baseActions.push(
          {
            id: 'checkin',
            icon: Camera,
            label: 'Check In',
            description: 'Capture this moment',
            category: 'practical',
            action: () => onCheckin?.(),
          }
        );
        break;
    }

    // Always available actions
    baseActions.push(
      {
        id: 'navigate',
        icon: Navigation,
        label: 'Navigate Here',
        description: currentActivity?.name || 'Get directions',
        category: 'navigation',
        action: () => currentActivity?.coordinates && onNavigate?.({
          ...currentActivity.coordinates,
          name: currentActivity.name,
        }),
      },
      {
        id: 'whats-nearby',
        icon: Search,
        label: "What's Nearby",
        description: 'Explore your surroundings',
        category: 'navigation',
        action: () => onFindNearby?.('all'),
      },
      {
        id: 'pharmacy',
        icon: Pill,
        label: 'Find Pharmacy',
        description: 'Medical essentials',
        category: 'practical',
        action: () => onFindNearby?.('pharmacy'),
      },
      {
        id: 'atm',
        icon: CreditCard,
        label: 'Find ATM',
        description: 'Get local currency',
        category: 'practical',
        action: () => onFindNearby?.('atm'),
      },
      {
        id: 'help',
        icon: MessageCircle,
        label: 'Need Help?',
        description: 'Something not going as planned?',
        category: 'help',
        action: () => {},
      }
    );

    return baseActions;
  }, [context, currentActivity, onNavigate, onCall, onCheckin, onFindNearby]);

  // Filter actions by category
  const filteredActions = useMemo(() => {
    if (!activeCategory) return contextActions;
    return contextActions.filter(a => a.category === activeCategory);
  }, [contextActions, activeCategory]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999]"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
          style={{ background: 'rgba(44, 36, 23, 0.6)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}
        />

        {/* Sheet */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="absolute bottom-0 left-0 right-0 max-h-[85vh] rounded-t-3xl overflow-hidden"
          style={{
            background: colors.cream,
            boxShadow: '0 -10px 40px rgba(0,0,0,0.2)',
          }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div
              className="w-12 h-1 rounded-full"
              style={{ background: colors.border }}
            />
          </div>

          {/* Header */}
          <div className="px-6 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${colors.golden} 0%, ${colors.goldenDark} 100%)`,
                  boxShadow: `0 4px 15px ${colors.golden}40`,
                }}
              >
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-serif font-medium" style={{ color: colors.darkBrown }}>
                  Quick Actions
                </h2>
                <p className="text-sm" style={{ color: colors.lightBrown }}>
                  What can I help you with?
                </p>
              </div>
            </div>

            <motion.button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: colors.warmWhite, border: `1px solid ${colors.border}` }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-4 h-4" style={{ color: colors.lightBrown }} />
            </motion.button>
          </div>

          {/* Category filters */}
          <div className="px-6 pb-4 flex gap-2 overflow-x-auto hide-scrollbar">
            <motion.button
              onClick={() => setActiveCategory(null)}
              className="flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all"
              style={{
                background: !activeCategory ? colors.darkBrown : colors.warmWhite,
                border: `1px solid ${!activeCategory ? colors.darkBrown : colors.border}`,
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Compass
                className="w-4 h-4"
                style={{ color: !activeCategory ? 'white' : colors.lightBrown }}
              />
              <span
                className="text-sm font-medium"
                style={{ color: !activeCategory ? 'white' : colors.mediumBrown }}
              >
                All
              </span>
            </motion.button>

            {(Object.keys(actionCategories) as Array<keyof typeof actionCategories>).map((cat) => (
              <CategoryChip
                key={cat}
                category={cat}
                isActive={activeCategory === cat}
                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              />
            ))}
          </div>

          {/* Content */}
          <div className="px-6 pb-8 overflow-y-auto max-h-[60vh]">
            {/* Tip Calculator (if shown) */}
            <AnimatePresence>
              {showTipCalculator && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4"
                >
                  <TipCalculator />
                  <motion.button
                    onClick={() => setShowTipCalculator(false)}
                    className="mt-2 text-sm w-full text-center py-2"
                    style={{ color: colors.lightBrown }}
                    whileHover={{ color: colors.terracotta }}
                  >
                    Close calculator
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions Grid */}
            <div className="space-y-3">
              {filteredActions.map((action, index) => (
                <ActionButton
                  key={action.id}
                  action={action}
                  index={index}
                  onAction={(a) => {
                    a.action();
                    if (a.id !== 'tip') {
                      // Don't close for tip calculator
                      // onClose();
                    }
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default QuickActions;

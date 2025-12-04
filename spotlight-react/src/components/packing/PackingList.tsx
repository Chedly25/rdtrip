/**
 * Packing List - The Traveler's Trunk
 *
 * A smart, AI-powered packing list with vintage luggage aesthetics.
 * Design: "The Traveler's Trunk" - leather textures, brass accents,
 * luggage tags, and satisfying latch-like interactions.
 *
 * Features:
 * - AI-generated suggestions based on trip details
 * - Categorized expandable sections (compartments)
 * - Progress visualization (trunk filling)
 * - Weather-based recommendations
 * - Activity-specific items
 * - Custom item addition
 * - "Why this?" explanations
 */

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Luggage,
  Sun,
  CloudRain,
  Thermometer,
  Shirt,
  Sparkles,
  Plus,
  CheckCircle2,
  ChevronDown,
  Info,
  X,
  Zap,
  Utensils,
  Camera,
  Pill,
  FileText,
  Smartphone,
  Briefcase,
  Umbrella,
} from 'lucide-react';

// Wanderlust Editorial Colors with Trunk Accents
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
  // Trunk-specific colors
  leather: '#8B4513',
  leatherLight: '#A0522D',
  leatherDark: '#5D2E0C',
  brass: '#B8860B',
  brassLight: '#DAA520',
  brassDark: '#8B6914',
  canvas: '#F5F5DC',
  strap: '#654321',
};

// Category configurations with icons
const categoryConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  clothing: { icon: Shirt, color: colors.terracotta, label: 'Clothing' },
  toiletries: { icon: Sparkles, color: colors.sage, label: 'Toiletries' },
  electronics: { icon: Smartphone, color: colors.brass, label: 'Electronics' },
  documents: { icon: FileText, color: colors.mediumBrown, label: 'Documents' },
  health: { icon: Pill, color: '#E07B7B', label: 'Health & Medicine' },
  accessories: { icon: Camera, color: colors.golden, label: 'Accessories' },
  food: { icon: Utensils, color: colors.goldenDark, label: 'Snacks & Food' },
  work: { icon: Briefcase, color: colors.darkBrown, label: 'Work Items' },
  weather: { icon: Umbrella, color: '#6B9BD1', label: 'Weather Gear' },
  misc: { icon: Zap, color: colors.lightBrown, label: 'Miscellaneous' },
};

// Types
export interface PackingItem {
  id: string;
  name: string;
  category: string;
  isPacked: boolean;
  quantity?: number;
  isEssential?: boolean;
  reason?: string; // Why this item is suggested
  weatherBased?: boolean;
  activityBased?: string; // Activity name
  isCustom?: boolean;
}

export interface WeatherInfo {
  tempRange: { min: number; max: number };
  conditions: ('sunny' | 'rainy' | 'cloudy' | 'snowy')[];
  humidity: 'low' | 'moderate' | 'high';
}

export interface PackingListData {
  tripName: string;
  destination: string;
  duration: number;
  items: PackingItem[];
  weather?: WeatherInfo;
  activities?: string[];
}

// Leather texture background
const LeatherTexture = () => (
  <div
    className="absolute inset-0 pointer-events-none opacity-[0.03]"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
    }}
  />
);

// Brass corner decoration
const BrassCorner = ({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) => {
  const positionClasses = {
    tl: 'top-0 left-0 rounded-tl-2xl',
    tr: 'top-0 right-0 rounded-tr-2xl rotate-90',
    bl: 'bottom-0 left-0 rounded-bl-2xl -rotate-90',
    br: 'bottom-0 right-0 rounded-br-2xl rotate-180',
  };

  return (
    <div
      className={`absolute w-8 h-8 ${positionClasses[position]}`}
      style={{
        background: `linear-gradient(135deg, ${colors.brass} 0%, ${colors.brassLight} 50%, ${colors.brassDark} 100%)`,
        clipPath: 'polygon(0 0, 100% 0, 0 100%)',
        boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3)',
      }}
    />
  );
};

// Luggage tag component
const LuggageTag = ({
  category,
  itemCount,
  packedCount,
}: {
  category: string;
  itemCount: number;
  packedCount: number;
}) => {
  const config = categoryConfig[category] || categoryConfig.misc;
  const Icon = config.icon;
  const progress = itemCount > 0 ? (packedCount / itemCount) * 100 : 0;

  return (
    <div className="relative">
      {/* Tag hole */}
      <div
        className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full"
        style={{
          background: colors.darkBrown,
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
        }}
      />
      {/* String */}
      <div
        className="absolute -top-4 left-1/2 w-px h-4"
        style={{ background: colors.strap }}
      />
      {/* Tag body */}
      <div
        className="relative px-4 py-2 rounded-lg"
        style={{
          background: `linear-gradient(180deg, ${colors.canvas} 0%, ${colors.cream} 100%)`,
          border: `1px solid ${colors.border}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" style={{ color: config.color }} />
          <span className="text-sm font-medium" style={{ color: colors.darkBrown }}>
            {packedCount}/{itemCount}
          </span>
        </div>
        {/* Progress bar */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1 rounded-b-lg overflow-hidden"
          style={{ background: colors.border }}
        >
          <motion.div
            className="h-full"
            style={{ background: config.color }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    </div>
  );
};

// Weather badge
const WeatherBadge = ({ weather }: { weather: WeatherInfo }) => {
  const getWeatherIcon = () => {
    if (weather.conditions.includes('rainy')) return CloudRain;
    if (weather.conditions.includes('sunny')) return Sun;
    return Thermometer;
  };
  const Icon = getWeatherIcon();

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-lg"
      style={{
        background: `linear-gradient(135deg, ${colors.sage}15 0%, ${colors.sageLight}10 100%)`,
        border: `1px solid ${colors.sage}30`,
      }}
    >
      <Icon className="w-4 h-4" style={{ color: colors.sage }} />
      <span className="text-sm" style={{ color: colors.darkBrown }}>
        {weather.tempRange.min}° - {weather.tempRange.max}°C
      </span>
      {weather.conditions.includes('rainy') && (
        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#6B9BD120', color: '#6B9BD1' }}>
          Rain likely
        </span>
      )}
    </div>
  );
};

// Individual packing item
const PackingItemRow = ({
  item,
  onToggle,
  onRemove,
}: {
  item: PackingItem;
  onToggle: () => void;
  onRemove?: () => void;
}) => {
  const [showReason, setShowReason] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="relative"
    >
      <motion.div
        className="flex items-center gap-3 p-3 rounded-xl group"
        style={{
          background: item.isPacked ? `${colors.sage}08` : colors.warmWhite,
          border: `1px solid ${item.isPacked ? colors.sage + '30' : colors.border}`,
        }}
        whileHover={{ scale: 1.01 }}
      >
        {/* Checkbox - Brass latch style */}
        <motion.button
          onClick={onToggle}
          className="relative w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
          style={{
            background: item.isPacked
              ? `linear-gradient(135deg, ${colors.brass} 0%, ${colors.brassLight} 100%)`
              : `linear-gradient(135deg, ${colors.warmWhite} 0%, ${colors.cream} 100%)`,
            border: `2px solid ${item.isPacked ? colors.brass : colors.border}`,
            boxShadow: item.isPacked
              ? `0 2px 8px ${colors.brass}40, inset 0 1px 2px rgba(255,255,255,0.3)`
              : 'inset 0 2px 4px rgba(0,0,0,0.05)',
          }}
          whileTap={{ scale: 0.9 }}
        >
          <AnimatePresence>
            {item.isPacked && (
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 45 }}
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Item details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-medium ${item.isPacked ? 'line-through' : ''}`}
              style={{ color: item.isPacked ? colors.lightBrown : colors.darkBrown }}
            >
              {item.name}
            </span>
            {item.quantity && item.quantity > 1 && (
              <span
                className="text-xs px-1.5 py-0.5 rounded"
                style={{ background: colors.border, color: colors.mediumBrown }}
              >
                ×{item.quantity}
              </span>
            )}
            {item.isEssential && (
              <span
                className="text-xs px-1.5 py-0.5 rounded"
                style={{ background: `${colors.terracotta}15`, color: colors.terracotta }}
              >
                Essential
              </span>
            )}
          </div>

          {/* Tags */}
          <div className="flex items-center gap-2 mt-1">
            {item.weatherBased && (
              <span className="text-xs flex items-center gap-1" style={{ color: colors.sage }}>
                <Thermometer className="w-3 h-3" />
                Weather
              </span>
            )}
            {item.activityBased && (
              <span className="text-xs flex items-center gap-1" style={{ color: colors.golden }}>
                <Zap className="w-3 h-3" />
                {item.activityBased}
              </span>
            )}
          </div>
        </div>

        {/* Info button */}
        {item.reason && (
          <motion.button
            onClick={() => setShowReason(!showReason)}
            className="w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: colors.warmWhite, border: `1px solid ${colors.border}` }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Info className="w-4 h-4" style={{ color: colors.lightBrown }} />
          </motion.button>
        )}

        {/* Remove button for custom items */}
        {item.isCustom && onRemove && (
          <motion.button
            onClick={onRemove}
            className="w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: `${colors.terracotta}10` }}
            whileHover={{ scale: 1.1, background: `${colors.terracotta}20` }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-4 h-4" style={{ color: colors.terracotta }} />
          </motion.button>
        )}
      </motion.div>

      {/* Reason tooltip */}
      <AnimatePresence>
        {showReason && item.reason && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="mx-3 mt-1 mb-2 px-3 py-2 rounded-lg text-xs"
            style={{
              background: `linear-gradient(135deg, ${colors.golden}10 0%, ${colors.goldenLight}05 100%)`,
              border: `1px solid ${colors.golden}20`,
              color: colors.mediumBrown,
            }}
          >
            <span className="font-medium" style={{ color: colors.golden }}>Why this? </span>
            {item.reason}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Category section (trunk compartment)
const CategorySection = ({
  category,
  items,
  onToggleItem,
  onRemoveItem,
}: {
  category: string;
  items: PackingItem[];
  onToggleItem: (itemId: string) => void;
  onRemoveItem: (itemId: string) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const config = categoryConfig[category] || categoryConfig.misc;
  const Icon = config.icon;
  const packedCount = items.filter(i => i.isPacked).length;
  const isComplete = packedCount === items.length;

  return (
    <motion.div
      layout
      className="rounded-2xl overflow-hidden"
      style={{
        background: colors.cream,
        border: `1px solid ${isComplete ? colors.sage + '50' : colors.border}`,
        boxShadow: isComplete ? `0 0 0 2px ${colors.sage}20` : '0 2px 8px rgba(0,0,0,0.05)',
      }}
    >
      {/* Header - Trunk compartment label */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4"
        style={{
          background: `linear-gradient(180deg, ${colors.warmWhite} 0%, ${colors.cream} 100%)`,
          borderBottom: isExpanded ? `1px solid ${colors.border}` : 'none',
        }}
      >
        <div className="flex items-center gap-3">
          {/* Icon badge */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${config.color}15 0%, ${config.color}05 100%)`,
              border: `1px solid ${config.color}30`,
            }}
          >
            <Icon className="w-5 h-5" style={{ color: config.color }} />
          </div>

          <div className="text-left">
            <h3 className="font-medium" style={{ color: colors.darkBrown }}>
              {config.label}
            </h3>
            <p className="text-xs" style={{ color: colors.lightBrown }}>
              {packedCount} of {items.length} packed
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Progress indicator */}
          <div
            className="w-16 h-2 rounded-full overflow-hidden"
            style={{ background: colors.border }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ background: isComplete ? colors.sage : config.color }}
              initial={{ width: 0 }}
              animate={{ width: `${(packedCount / items.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Expand icon */}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5" style={{ color: colors.lightBrown }} />
          </motion.div>
        </div>
      </motion.button>

      {/* Items */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-3 space-y-2">
              {items.map((item) => (
                <PackingItemRow
                  key={item.id}
                  item={item}
                  onToggle={() => onToggleItem(item.id)}
                  onRemove={item.isCustom ? () => onRemoveItem(item.id) : undefined}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Add custom item input
const AddItemInput = ({
  onAdd,
  category: _category,
}: {
  onAdd: (name: string) => void;
  category: string;
}) => {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = () => {
    if (value.trim()) {
      onAdd(value.trim());
      setValue('');
    }
  };

  return (
    <motion.div
      className="flex items-center gap-2 p-2 rounded-xl"
      style={{
        background: isFocused ? colors.warmWhite : 'transparent',
        border: `1px dashed ${isFocused ? colors.brass : colors.border}`,
      }}
      animate={{ borderColor: isFocused ? colors.brass : colors.border }}
    >
      <Plus className="w-5 h-5 flex-shrink-0" style={{ color: colors.lightBrown }} />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        placeholder="Add custom item..."
        className="flex-1 bg-transparent outline-none text-sm"
        style={{ color: colors.darkBrown }}
      />
      {value.trim() && (
        <motion.button
          onClick={handleSubmit}
          className="px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{
            background: `linear-gradient(135deg, ${colors.brass} 0%, ${colors.brassLight} 100%)`,
            color: 'white',
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          Add
        </motion.button>
      )}
    </motion.div>
  );
};

// Progress trunk visualization
const TrunkProgress = ({
  totalItems,
  packedItems,
}: {
  totalItems: number;
  packedItems: number;
}) => {
  const progress = totalItems > 0 ? (packedItems / totalItems) * 100 : 0;
  const isComplete = packedItems === totalItems && totalItems > 0;

  return (
    <motion.div
      className="relative p-6 rounded-2xl overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${colors.leather} 0%, ${colors.leatherDark} 100%)`,
        boxShadow: '0 8px 30px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
      }}
    >
      <LeatherTexture />
      <BrassCorner position="tl" />
      <BrassCorner position="tr" />
      <BrassCorner position="bl" />
      <BrassCorner position="br" />

      {/* Trunk strap decoration */}
      <div
        className="absolute top-1/2 left-4 right-4 h-4 -translate-y-1/2 rounded"
        style={{
          background: `linear-gradient(180deg, ${colors.strap} 0%, ${colors.leatherDark} 100%)`,
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
        }}
      >
        {/* Brass buckle */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-6 rounded"
          style={{
            background: `linear-gradient(135deg, ${colors.brass} 0%, ${colors.brassLight} 50%, ${colors.brassDark} 100%)`,
            boxShadow: '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.4)',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center">
        <motion.div
          className="text-5xl font-serif font-bold text-white mb-1"
          animate={{ scale: isComplete ? [1, 1.1, 1] : 1 }}
          transition={{ duration: 0.5 }}
        >
          {Math.round(progress)}%
        </motion.div>
        <p className="text-white/70 text-sm mb-4">
          {packedItems} of {totalItems} items packed
        </p>

        {/* Progress bar */}
        <div
          className="h-3 rounded-full overflow-hidden mx-auto max-w-xs"
          style={{
            background: 'rgba(0,0,0,0.3)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              background: isComplete
                ? `linear-gradient(90deg, ${colors.sage} 0%, ${colors.sageLight} 100%)`
                : `linear-gradient(90deg, ${colors.brass} 0%, ${colors.brassLight} 100%)`,
              boxShadow: `0 0 10px ${isComplete ? colors.sage : colors.brass}60`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>

        {isComplete && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center justify-center gap-2 text-white"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">Ready to go!</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

interface PackingListProps {
  data: PackingListData;
  onToggleItem: (itemId: string) => void;
  onAddItem: (item: Omit<PackingItem, 'id'>) => void;
  onRemoveItem: (itemId: string) => void;
  className?: string;
}

export const PackingList: React.FC<PackingListProps> = ({
  data,
  onToggleItem,
  onAddItem,
  onRemoveItem,
  className = '',
}) => {
  // Reserved for future category filtering feature
  const [_selectedCategory, _setSelectedCategory] = useState<string | null>(null);

  // Group items by category
  const itemsByCategory = useMemo(() => {
    const grouped: Record<string, PackingItem[]> = {};
    data.items.forEach((item) => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    });
    return grouped;
  }, [data.items]);

  // Calculate totals
  const totalItems = data.items.length;
  const packedItems = data.items.filter((i) => i.isPacked).length;

  // Handle adding custom item
  const handleAddItem = useCallback(
    (name: string, category: string) => {
      onAddItem({
        name,
        category,
        isPacked: false,
        isCustom: true,
      });
    },
    [onAddItem]
  );

  // Categories to display
  const categories = Object.keys(itemsByCategory);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Luggage className="w-6 h-6" style={{ color: colors.leather }} />
          <h1 className="text-2xl font-serif font-medium" style={{ color: colors.darkBrown }}>
            Packing List
          </h1>
        </div>
        <p className="text-sm" style={{ color: colors.lightBrown }}>
          {data.tripName} • {data.destination} • {data.duration} days
        </p>
      </div>

      {/* Weather info */}
      {data.weather && (
        <div className="flex justify-center">
          <WeatherBadge weather={data.weather} />
        </div>
      )}

      {/* Trunk Progress */}
      <TrunkProgress totalItems={totalItems} packedItems={packedItems} />

      {/* Category tags carousel */}
      <div className="overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        <div className="flex gap-3">
          {categories.map((category) => {
            const catItems = itemsByCategory[category];
            const catPacked = catItems.filter((i) => i.isPacked).length;
            return (
              <LuggageTag
                key={category}
                category={category}
                itemCount={catItems.length}
                packedCount={catPacked}
              />
            );
          })}
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-4">
        {categories.map((category) => (
          <CategorySection
            key={category}
            category={category}
            items={itemsByCategory[category]}
            onToggleItem={onToggleItem}
            onRemoveItem={onRemoveItem}
          />
        ))}
      </div>

      {/* Add custom item */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium" style={{ color: colors.darkBrown }}>
          Add Custom Items
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {['clothing', 'toiletries', 'electronics', 'misc'].map((cat) => (
            <div key={cat}>
              <p className="text-xs mb-1 capitalize" style={{ color: colors.lightBrown }}>
                {categoryConfig[cat]?.label || cat}
              </p>
              <AddItemInput
                category={cat}
                onAdd={(name) => handleAddItem(name, cat)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PackingList;

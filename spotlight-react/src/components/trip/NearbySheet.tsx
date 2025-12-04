/**
 * Nearby Sheet - Local Discovery
 *
 * A beautiful discovery sheet that shows nearby places based on
 * current location and user preferences.
 *
 * Design: "Explorer's Field Guide" - curated discoveries, not generic results
 *
 * Features:
 * - Category filtering (Food, Coffee, Sights, Gas, Pharmacy)
 * - Distance and walking/driving time
 * - User preference integration
 * - Beautiful card layout
 * - One-tap navigation
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
  X,
  Search,
  Utensils,
  Coffee,
  Camera,
  Fuel,
  Pill,
  MapPin,
  Navigation,
  Star,
  Clock,
  Sparkles,
  Heart,
  ShoppingBag,
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

// Categories with icons and colors
const categories = [
  { id: 'all', icon: Sparkles, label: 'All', color: colors.golden },
  { id: 'food', icon: Utensils, label: 'Food', color: colors.terracotta },
  { id: 'coffee', icon: Coffee, label: 'Coffee', color: '#6F4E37' },
  { id: 'sights', icon: Camera, label: 'Sights', color: colors.sage },
  { id: 'shopping', icon: ShoppingBag, label: 'Shopping', color: '#9B59B6' },
  { id: 'gas', icon: Fuel, label: 'Gas', color: '#3498DB' },
  { id: 'pharmacy', icon: Pill, label: 'Pharmacy', color: '#E74C3C' },
];

// Mock nearby places (in real app, this comes from API)
interface NearbyPlaceData {
  id: string;
  name: string;
  category: string;
  distance: string;
  walkingTime: number;
  drivingTime: number;
  rating?: number;
  reviewCount?: number;
  priceLevel?: number;
  isOpen?: boolean;
  closingTime?: string;
  photo?: string;
  tags?: string[];
  matchReason?: string;
  coordinates: { lat: number; lng: number };
}

// Category Chip Component
const CategoryChip = ({
  category,
  isActive,
  onClick,
}: {
  category: typeof categories[0];
  isActive: boolean;
  onClick: () => void;
}) => (
  <motion.button
    onClick={onClick}
    className="flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap transition-all"
    style={{
      background: isActive ? category.color : colors.warmWhite,
      border: `1.5px solid ${isActive ? category.color : colors.border}`,
      boxShadow: isActive ? `0 4px 15px ${category.color}30` : 'none',
    }}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    <category.icon
      className="w-4 h-4"
      style={{ color: isActive ? 'white' : category.color }}
    />
    <span
      className="text-sm font-medium"
      style={{ color: isActive ? 'white' : colors.mediumBrown }}
    >
      {category.label}
    </span>
  </motion.button>
);

// Nearby Place Card
const NearbyPlaceCard = ({
  place,
  index,
  onNavigate,
  onSave,
}: {
  place: NearbyPlaceData;
  index: number;
  onNavigate: (place: NearbyPlaceData) => void;
  onSave?: (place: NearbyPlaceData) => void;
}) => {
  const categoryConfig = categories.find((c) => c.id === place.category) || categories[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: colors.warmWhite,
        border: `1px solid ${colors.border}`,
      }}
    >
      {/* Photo header (if available) */}
      {place.photo && (
        <div className="relative h-32 overflow-hidden">
          <img
            src={place.photo}
            alt={place.name}
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.4) 100%)',
            }}
          />
          {/* Save button */}
          {onSave && (
            <motion.button
              onClick={() => onSave(place)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.9)' }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Heart className="w-4 h-4" style={{ color: colors.terracotta }} />
            </motion.button>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Category badge + Open status */}
        <div className="flex items-center justify-between mb-2">
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium"
            style={{
              background: `${categoryConfig.color}15`,
              color: categoryConfig.color,
            }}
          >
            <categoryConfig.icon className="w-3 h-3" />
            {place.category}
          </div>
          {place.isOpen !== undefined && (
            <span
              className="text-xs font-medium"
              style={{ color: place.isOpen ? colors.sage : colors.terracotta }}
            >
              {place.isOpen ? `Open · Closes ${place.closingTime}` : 'Closed'}
            </span>
          )}
        </div>

        {/* Name and rating */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3
            className="text-base font-medium leading-tight"
            style={{ color: colors.darkBrown }}
          >
            {place.name}
          </h3>
          {place.rating && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <Star className="w-4 h-4 fill-current" style={{ color: colors.golden }} />
              <span className="text-sm font-medium" style={{ color: colors.darkBrown }}>
                {place.rating}
              </span>
              {place.reviewCount && (
                <span className="text-xs" style={{ color: colors.lightBrown }}>
                  ({place.reviewCount})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Tags */}
        {place.tags && place.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {place.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: colors.cream,
                  color: colors.lightBrown,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Match reason (if personalized) */}
        {place.matchReason && (
          <div
            className="flex items-center gap-2 p-2 rounded-lg mb-3"
            style={{ background: `${colors.golden}10` }}
          >
            <Sparkles className="w-4 h-4 flex-shrink-0" style={{ color: colors.golden }} />
            <span className="text-xs" style={{ color: colors.mediumBrown }}>
              {place.matchReason}
            </span>
          </div>
        )}

        {/* Distance and time */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm" style={{ color: colors.lightBrown }}>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{place.distance}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{place.walkingTime} min walk</span>
            </div>
          </div>

          {/* Navigate button */}
          <motion.button
            onClick={() => onNavigate(place)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg"
            style={{
              background: colors.sage,
              color: 'white',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Navigation className="w-4 h-4" />
            <span className="text-sm font-medium">Go</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

// Empty State
const EmptyState = ({ category }: { category: string }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex flex-col items-center justify-center py-12"
  >
    <div
      className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
      style={{ background: colors.warmWhite }}
    >
      <Search className="w-8 h-8" style={{ color: colors.lightBrown }} />
    </div>
    <h3 className="text-lg font-medium mb-1" style={{ color: colors.darkBrown }}>
      No {category} nearby
    </h3>
    <p className="text-sm text-center" style={{ color: colors.lightBrown }}>
      Try a different category or expand your search area
    </p>
  </motion.div>
);

interface NearbySheetProps {
  isOpen: boolean;
  onClose: () => void;
  places?: NearbyPlaceData[];
  onNavigate?: (place: NearbyPlaceData) => void;
  onSave?: (place: NearbyPlaceData) => void;
  onCategoryChange?: (category: string) => void;
  isLoading?: boolean;
}

export const NearbySheet: React.FC<NearbySheetProps> = ({
  isOpen,
  onClose,
  places = [],
  onNavigate,
  onSave,
  onCategoryChange,
  isLoading = false,
}) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter places by category
  const filteredPlaces = useMemo(() => {
    let filtered = places;
    if (activeCategory !== 'all') {
      filtered = filtered.filter((p) => p.category === activeCategory);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.tags?.some((t) => t.toLowerCase().includes(query))
      );
    }
    return filtered;
  }, [places, activeCategory, searchQuery]);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    onCategoryChange?.(category);
  };

  const handleNavigate = (place: NearbyPlaceData) => {
    onNavigate?.(place);
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999]"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
          style={{
            background: 'rgba(44, 36, 23, 0.7)',
            backdropFilter: 'blur(8px)',
          }}
          onClick={onClose}
        />

        {/* Sheet */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="absolute bottom-0 left-0 right-0 max-h-[85vh] rounded-t-3xl overflow-hidden flex flex-col"
          style={{
            background: colors.cream,
            boxShadow: '0 -10px 40px rgba(0,0,0,0.2)',
          }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
            <div className="w-12 h-1 rounded-full" style={{ background: colors.border }} />
          </div>

          {/* Header */}
          <div className="px-6 pb-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${colors.golden} 0%, ${colors.goldenDark} 100%)`,
                  boxShadow: `0 4px 15px ${colors.golden}30`,
                }}
              >
                <Search className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2
                  className="text-lg font-serif font-medium"
                  style={{ color: colors.darkBrown }}
                >
                  What's Nearby
                </h2>
                <p className="text-sm" style={{ color: colors.lightBrown }}>
                  Discover your surroundings
                </p>
              </div>
            </div>

            <motion.button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: colors.warmWhite, border: `1px solid ${colors.border}` }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-4 h-4" style={{ color: colors.lightBrown }} />
            </motion.button>
          </div>

          {/* Search Input */}
          <div className="px-6 pb-4 flex-shrink-0">
            <div
              className="relative rounded-xl overflow-hidden"
              style={{ background: colors.warmWhite, border: `1px solid ${colors.border}` }}
            >
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                style={{ color: colors.lightBrown }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search places..."
                className="w-full pl-12 pr-4 py-3 bg-transparent outline-none"
                style={{ color: colors.darkBrown }}
              />
            </div>
          </div>

          {/* Category Chips */}
          <div className="px-6 pb-4 flex-shrink-0">
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
              {categories.map((cat) => (
                <CategoryChip
                  key={cat.id}
                  category={cat}
                  isActive={activeCategory === cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                />
              ))}
            </div>
          </div>

          {/* Places List */}
          <div className="px-6 pb-8 overflow-y-auto flex-1">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                >
                  <Search className="w-8 h-8" style={{ color: colors.golden }} />
                </motion.div>
                <p className="mt-4 text-sm" style={{ color: colors.lightBrown }}>
                  Finding places nearby...
                </p>
              </div>
            ) : filteredPlaces.length === 0 ? (
              <EmptyState
                category={categories.find((c) => c.id === activeCategory)?.label || 'places'}
              />
            ) : (
              <div className="space-y-4">
                {filteredPlaces.map((place, index) => (
                  <NearbyPlaceCard
                    key={place.id}
                    place={place}
                    index={index}
                    onNavigate={handleNavigate}
                    onSave={onSave}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default NearbySheet;

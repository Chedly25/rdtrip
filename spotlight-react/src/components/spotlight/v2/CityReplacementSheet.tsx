/**
 * City Replacement Sheet
 *
 * A beautiful bottom sheet for replacing cities in the route.
 * Features AI-powered suggestions with personalization matching.
 *
 * Design: Wanderlust Editorial with warm, organic aesthetic
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
  X,
  RefreshCw,
  MapPin,
  Sparkles,
  Mountain,
  Utensils,
  Palette,
  Compass,
  Heart,
  ChevronRight,
  Star,
  Route,
  Check
} from 'lucide-react';
import { useSpotlightStoreV2, type CityCoordinates } from '../../../stores/spotlightStoreV2';
import { fetchCityImage } from '../../../services/cityImages';

interface CitySuggestion {
  name: string;
  country: string;
  coordinates: CityCoordinates;
  whyReplace: string;
  highlights: string[];
  matchScore: number;
  matchReasons: string[];
  estimatedDetourKm: number;
  bestFor: 'culture' | 'nature' | 'food' | 'adventure' | 'relaxation';
}

interface CityReplacementSheetProps {
  isOpen: boolean;
  cityIndex: number;
  cityName: string;
  onClose: () => void;
  onReplace: (newCity: CitySuggestion) => void;
}

// Wanderlust Editorial colors
const colors = {
  cream: '#FFFBF5',
  warmWhite: '#FAF7F2',
  terracotta: '#C45830',
  terracottaDark: '#A84828',
  golden: '#D4A853',
  darkBrown: '#2C2417',
  warmGray: '#8B7355',
  sage: '#6B8E7B',
  border: '#E5DDD0',
  skyBlue: '#5B9BD5',
};

// Category icons and colors
const categoryConfig: Record<string, { icon: typeof Mountain; color: string; label: string }> = {
  culture: { icon: Palette, color: colors.golden, label: 'Culture' },
  nature: { icon: Mountain, color: colors.sage, label: 'Nature' },
  food: { icon: Utensils, color: colors.terracotta, label: 'Food' },
  adventure: { icon: Compass, color: colors.skyBlue, label: 'Adventure' },
  relaxation: { icon: Heart, color: '#E8A0BF', label: 'Relaxation' },
};

// Quick reason presets
const reasonPresets = [
  { label: 'Too touristy', value: 'too crowded and touristy' },
  { label: 'Not enough to do', value: 'not enough activities and attractions' },
  { label: 'Too expensive', value: 'too expensive for my budget' },
  { label: 'Want more nature', value: 'looking for more nature and outdoor activities' },
  { label: 'Want more culture', value: 'looking for more cultural experiences' },
  { label: 'Better food scene', value: 'looking for a better food and dining scene' },
];

function SuggestionCard({
  suggestion,
  index,
  isSelected,
  onSelect
}: {
  suggestion: CitySuggestion;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const category = categoryConfig[suggestion.bestFor] || categoryConfig.culture;
  const CategoryIcon = category.icon;

  useEffect(() => {
    fetchCityImage(suggestion.name).then(setImageUrl);
  }, [suggestion.name]);

  return (
    <motion.button
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={onSelect}
      className={`w-full text-left rounded-2xl overflow-hidden transition-all duration-300 ${
        isSelected
          ? 'ring-2 shadow-xl scale-[1.02]'
          : 'hover:shadow-lg hover:scale-[1.01]'
      }`}
      style={{
        background: colors.warmWhite,
        border: `1px solid ${isSelected ? colors.terracotta : colors.border}`,
        boxShadow: isSelected
          ? `0 8px 30px ${colors.terracotta}20`
          : '0 2px 8px rgba(44, 36, 23, 0.06)',
        ['--tw-ring-color' as any]: colors.terracotta
      }}
    >
      {/* Image header */}
      <div className="relative h-32 bg-gradient-to-br from-stone-100 to-stone-200">
        {imageUrl && (
          <img
            src={imageUrl}
            alt={suggestion.name}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Category badge */}
        <div
          className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5"
          style={{
            background: `${category.color}20`,
            color: category.color,
            backdropFilter: 'blur(8px)'
          }}
        >
          <CategoryIcon className="w-3.5 h-3.5" />
          {category.label}
        </div>

        {/* Match score */}
        <div
          className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1"
          style={{
            background: 'rgba(255,255,255,0.95)',
            color: suggestion.matchScore >= 80 ? colors.sage : colors.warmGray
          }}
        >
          <Star className="w-3.5 h-3.5 fill-current" />
          {suggestion.matchScore}%
        </div>

        {/* City name overlay */}
        <div className="absolute bottom-3 left-3 right-3">
          <h4
            className="text-lg font-bold text-white mb-0.5"
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
          >
            {suggestion.name}
          </h4>
          <p className="text-xs text-white/80">{suggestion.country}</p>
        </div>

        {/* Selected indicator */}
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: colors.terracotta }}
          >
            <Check className="w-4 h-4 text-white" />
          </motion.div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Why replace */}
        <p className="text-sm mb-3" style={{ color: colors.darkBrown }}>
          {suggestion.whyReplace}
        </p>

        {/* Highlights */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {suggestion.highlights.slice(0, 3).map((highlight, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-full text-xs"
              style={{
                background: `${colors.golden}15`,
                color: colors.warmGray
              }}
            >
              {highlight}
            </span>
          ))}
        </div>

        {/* Match reasons */}
        {suggestion.matchReasons.length > 0 && (
          <div className="flex items-start gap-2 pt-2 border-t" style={{ borderColor: colors.border }}>
            <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: colors.golden }} />
            <p className="text-xs" style={{ color: colors.warmGray }}>
              {suggestion.matchReasons[0]}
            </p>
          </div>
        )}

        {/* Detour info */}
        <div className="flex items-center gap-1.5 mt-3 text-xs" style={{ color: colors.warmGray }}>
          <Route className="w-3.5 h-3.5" />
          <span>
            {suggestion.estimatedDetourKm > 0
              ? `+${suggestion.estimatedDetourKm} km from current route`
              : 'Same distance as current route'}
          </span>
        </div>
      </div>
    </motion.button>
  );
}

export function CityReplacementSheet({
  isOpen,
  cityIndex,
  cityName,
  onClose,
  onReplace
}: CityReplacementSheetProps) {
  const { route } = useSpotlightStoreV2();
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<CitySuggestion | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch suggestions when opened or reason changes
  useEffect(() => {
    if (!isOpen || !route) return;

    const fetchSuggestions = async () => {
      setIsLoading(true);
      setError(null);
      setSuggestions([]);

      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${apiUrl}/api/route/suggest-replacement`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentCity: { name: cityName },
            cityIndex,
            routeContext: {
              cities: route.cities,
              personalization: route.personalization
            },
            reason: selectedReason
          })
        });

        if (!response.ok) throw new Error('Failed to get suggestions');

        const data = await response.json();
        setSuggestions(data.suggestions || []);
      } catch (err) {
        console.error('Failed to fetch suggestions:', err);
        setError('Unable to load suggestions. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [isOpen, cityIndex, cityName, selectedReason, route]);

  const handleConfirmReplacement = () => {
    if (selectedSuggestion) {
      onReplace(selectedSuggestion);
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-end justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 backdrop-blur-sm"
          style={{ background: 'rgba(44, 36, 23, 0.5)' }}
        />

        {/* Sheet */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative w-full max-w-2xl max-h-[85vh] rounded-t-3xl overflow-hidden flex flex-col"
          style={{
            background: colors.cream,
            boxShadow: '0 -10px 50px rgba(44, 36, 23, 0.2)'
          }}
        >
          {/* Decorative top line */}
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{
              background: `linear-gradient(90deg, ${colors.terracotta}, ${colors.golden}, ${colors.sage})`
            }}
          />

          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div
              className="w-10 h-1 rounded-full"
              style={{ background: colors.border }}
            />
          </div>

          {/* Header */}
          <div className="px-6 pb-4 flex items-start justify-between">
            <div>
              <h2
                className="text-xl font-bold mb-1"
                style={{
                  fontFamily: "'Fraunces', Georgia, serif",
                  color: colors.darkBrown
                }}
              >
                Replace {cityName}
              </h2>
              <p className="text-sm" style={{ color: colors.warmGray }}>
                Find a better fit for your journey
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
              style={{
                background: colors.warmWhite,
                border: `1px solid ${colors.border}`
              }}
            >
              <X className="w-5 h-5" style={{ color: colors.warmGray }} />
            </button>
          </div>

          {/* Reason presets */}
          <div className="px-6 pb-4">
            <p className="text-xs font-medium mb-2" style={{ color: colors.warmGray }}>
              Why are you looking for alternatives?
            </p>
            <div className="flex flex-wrap gap-2">
              {reasonPresets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setSelectedReason(
                    selectedReason === preset.value ? null : preset.value
                  )}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedReason === preset.value
                      ? 'text-white'
                      : 'hover:scale-105'
                  }`}
                  style={{
                    background: selectedReason === preset.value
                      ? colors.terracotta
                      : colors.warmWhite,
                    border: `1px solid ${selectedReason === preset.value ? colors.terracotta : colors.border}`,
                    color: selectedReason === preset.value ? 'white' : colors.warmGray
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                >
                  <RefreshCw className="w-8 h-8" style={{ color: colors.terracotta }} />
                </motion.div>
                <p className="mt-4 text-sm" style={{ color: colors.warmGray }}>
                  Finding perfect alternatives...
                </p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                  style={{ background: `${colors.terracotta}15` }}
                >
                  <MapPin className="w-7 h-7" style={{ color: colors.terracotta }} />
                </div>
                <p className="text-sm text-center" style={{ color: colors.warmGray }}>
                  {error}
                </p>
                <button
                  onClick={() => setSelectedReason(selectedReason)} // Trigger refresh
                  className="mt-4 px-4 py-2 rounded-xl text-sm font-medium"
                  style={{
                    background: colors.warmWhite,
                    border: `1px solid ${colors.border}`,
                    color: colors.darkBrown
                  }}
                >
                  Try Again
                </button>
              </div>
            ) : suggestions.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4" style={{ color: colors.golden }} />
                  <p className="text-sm font-medium" style={{ color: colors.darkBrown }}>
                    AI-powered suggestions for you
                  </p>
                </div>
                {suggestions.map((suggestion, index) => (
                  <SuggestionCard
                    key={suggestion.name}
                    suggestion={suggestion}
                    index={index}
                    isSelected={selectedSuggestion?.name === suggestion.name}
                    onSelect={() => setSelectedSuggestion(suggestion)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                  style={{ background: `${colors.golden}15` }}
                >
                  <Compass className="w-7 h-7" style={{ color: colors.golden }} />
                </div>
                <p className="text-sm text-center" style={{ color: colors.warmGray }}>
                  Select a reason above to get personalized suggestions
                </p>
              </div>
            )}
          </div>

          {/* Footer action */}
          {selectedSuggestion && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="px-6 py-4 border-t"
              style={{
                background: colors.warmWhite,
                borderColor: colors.border
              }}
            >
              <button
                onClick={handleConfirmReplacement}
                className="w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: `linear-gradient(135deg, ${colors.terracotta}, ${colors.terracottaDark})`,
                  boxShadow: `0 4px 14px ${colors.terracotta}40`
                }}
              >
                <RefreshCw className="w-5 h-5" />
                Replace with {selectedSuggestion.name}
                <ChevronRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}

export default CityReplacementSheet;

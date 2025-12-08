/**
 * AddActivitySheet
 *
 * WI-5.6: Bottom sheet for adding an activity to the itinerary
 *
 * Sources:
 * - From favourites (saved places)
 * - Search for new places
 * - AI suggestion (fills slot intelligently)
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Heart,
  Search,
  Sparkles,
  MapPin,
  Star,
  Clock,
  ChevronRight,
  Loader2,
  Gem,
} from 'lucide-react';
import type { ItineraryPlace, TimeSlot } from '../../services/itinerary';

type AddSource = 'favourites' | 'search' | 'ai-suggest';

interface AddActivitySheetProps {
  isOpen: boolean;
  dayNumber: number;
  slot: TimeSlot;
  cityName: string;
  /** User's favourited places */
  favourites?: ItineraryPlace[];
  /** AI is suggesting */
  isAiLoading?: boolean;
  /** AI suggested places */
  aiSuggestions?: ItineraryPlace[];
  onClose: () => void;
  onAddPlace: (place: ItineraryPlace) => void;
  onSearch: (query: string) => void;
  onRequestAiSuggestion: () => void;
  /** Search results */
  searchResults?: ItineraryPlace[];
  isSearching?: boolean;
}

export function AddActivitySheet({
  isOpen,
  dayNumber,
  slot,
  cityName,
  favourites = [],
  isAiLoading = false,
  aiSuggestions = [],
  onClose,
  onAddPlace,
  onSearch,
  onRequestAiSuggestion,
  searchResults = [],
  isSearching = false,
}: AddActivitySheetProps) {
  const [activeSource, setActiveSource] = useState<AddSource>('favourites');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  const slotLabel = {
    morning: 'Morning',
    afternoon: 'Afternoon',
    evening: 'Evening',
  }[slot];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
              <div className="w-10 h-1 bg-stone-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-6 pb-4 border-b border-stone-100 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-terracotta/20 to-gold/20 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-terracotta" />
                  </div>
                  <div>
                    <h2
                      className="text-lg font-bold text-stone-900"
                      style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                    >
                      Add Activity
                    </h2>
                    <p className="text-sm text-stone-500">
                      Day {dayNumber} • {slotLabel} • {cityName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-stone-100 text-stone-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Source tabs */}
            <div className="px-6 py-3 border-b border-stone-100 flex-shrink-0">
              <div className="flex bg-stone-100 rounded-xl p-1">
                <SourceTab
                  active={activeSource === 'favourites'}
                  onClick={() => setActiveSource('favourites')}
                  icon={<Heart className="w-4 h-4" />}
                  label="Favourites"
                  count={favourites.length}
                />
                <SourceTab
                  active={activeSource === 'search'}
                  onClick={() => setActiveSource('search')}
                  icon={<Search className="w-4 h-4" />}
                  label="Search"
                />
                <SourceTab
                  active={activeSource === 'ai-suggest'}
                  onClick={() => {
                    setActiveSource('ai-suggest');
                    if (aiSuggestions.length === 0 && !isAiLoading) {
                      onRequestAiSuggestion();
                    }
                  }}
                  icon={<Sparkles className="w-4 h-4" />}
                  label="AI Suggest"
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                {/* Favourites */}
                {activeSource === 'favourites' && (
                  <motion.div
                    key="favourites"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="p-6"
                  >
                    {favourites.length > 0 ? (
                      <div className="space-y-3">
                        {favourites.map((place) => (
                          <PlaceCard
                            key={place.placeId}
                            place={place}
                            onSelect={() => onAddPlace(place)}
                          />
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        icon={<Heart className="w-8 h-8 text-stone-400" />}
                        title="No favourites yet"
                        description="Save places while exploring to add them to your itinerary quickly."
                      />
                    )}
                  </motion.div>
                )}

                {/* Search */}
                {activeSource === 'search' && (
                  <motion.div
                    key="search"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="p-6"
                  >
                    {/* Search input */}
                    <div className="flex gap-2 mb-4">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                          placeholder={`Search places in ${cityName}...`}
                          className="w-full pl-10 pr-4 py-3 bg-stone-100 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-terracotta/30"
                        />
                      </div>
                      <button
                        onClick={handleSearch}
                        disabled={!searchQuery.trim() || isSearching}
                        className="px-4 py-3 bg-terracotta text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSearching ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          'Search'
                        )}
                      </button>
                    </div>

                    {/* Search results */}
                    {searchResults.length > 0 ? (
                      <div className="space-y-3">
                        {searchResults.map((place) => (
                          <PlaceCard
                            key={place.placeId}
                            place={place}
                            onSelect={() => onAddPlace(place)}
                          />
                        ))}
                      </div>
                    ) : searchQuery && !isSearching ? (
                      <EmptyState
                        icon={<Search className="w-8 h-8 text-stone-400" />}
                        title="No results"
                        description={`Try a different search term for ${cityName}.`}
                      />
                    ) : (
                      <EmptyState
                        icon={<Search className="w-8 h-8 text-stone-400" />}
                        title="Search for places"
                        description={`Find restaurants, attractions, and more in ${cityName}.`}
                      />
                    )}
                  </motion.div>
                )}

                {/* AI Suggestions */}
                {activeSource === 'ai-suggest' && (
                  <motion.div
                    key="ai-suggest"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="p-6"
                  >
                    {isAiLoading ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                          className="w-12 h-12 rounded-full bg-gradient-to-br from-terracotta/20 to-gold/20 flex items-center justify-center mb-4"
                        >
                          <Sparkles className="w-6 h-6 text-terracotta" />
                        </motion.div>
                        <p className="text-stone-600 font-medium">Finding perfect activities...</p>
                        <p className="text-sm text-stone-500 mt-1">Based on your preferences and schedule</p>
                      </div>
                    ) : aiSuggestions.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-sm text-stone-500 mb-4">
                          <Sparkles className="w-4 h-4 inline mr-1 text-gold" />
                          AI-curated suggestions for your {slotLabel.toLowerCase()}
                        </p>
                        {aiSuggestions.map((place) => (
                          <PlaceCard
                            key={place.placeId}
                            place={place}
                            onSelect={() => onAddPlace(place)}
                            highlight
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-terracotta/10 to-gold/10 flex items-center justify-center mb-4">
                          <Sparkles className="w-8 h-8 text-terracotta" />
                        </div>
                        <h3 className="text-lg font-semibold text-stone-900 mb-2">AI Suggestions</h3>
                        <p className="text-sm text-stone-500 text-center max-w-xs mb-4">
                          Let our AI suggest the perfect activity based on your preferences and what's nearby.
                        </p>
                        <button
                          onClick={onRequestAiSuggestion}
                          className="px-6 py-3 bg-gradient-to-r from-terracotta to-gold text-white rounded-xl font-medium shadow-lg shadow-terracotta/20"
                        >
                          Get Suggestions
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Safe area padding */}
            <div className="h-safe-bottom flex-shrink-0" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Source tab component
function SourceTab({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
        ${active
          ? 'bg-white text-stone-900 shadow-sm'
          : 'text-stone-600 hover:text-stone-900'
        }
      `}
    >
      <span className={active ? 'text-terracotta' : ''}>{icon}</span>
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span
          className={`
            px-1.5 py-0.5 rounded-full text-xs
            ${active ? 'bg-terracotta/10 text-terracotta' : 'bg-stone-200 text-stone-600'}
          `}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// Place card component
function PlaceCard({
  place,
  onSelect,
  highlight = false,
}: {
  place: ItineraryPlace;
  onSelect: () => void;
  highlight?: boolean;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onSelect}
      className={`
        w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left
        ${highlight
          ? 'border-gold/30 bg-gradient-to-r from-amber-50/50 to-white hover:border-gold/50'
          : 'border-stone-200 hover:border-terracotta/30 hover:bg-stone-50'
        }
      `}
    >
      {/* Photo */}
      {place.photoUrl ? (
        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-stone-100">
          <img
            src={place.photoUrl}
            alt={place.name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-16 h-16 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
          <MapPin className="w-6 h-6 text-stone-400" />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-stone-900 truncate">{place.name}</h4>
          {place.hiddenGemScore && place.hiddenGemScore > 0.5 && (
            <Gem className="w-4 h-4 text-amber-500 flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-stone-500">
          <span className="capitalize">{place.category.replace('_', ' ')}</span>
          {place.rating && (
            <>
              <span>•</span>
              <span className="flex items-center gap-0.5">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                {place.rating.toFixed(1)}
              </span>
            </>
          )}
        </div>
        {place.address && (
          <p className="text-xs text-stone-400 truncate mt-0.5">{place.address}</p>
        )}
      </div>

      {/* Duration indicator */}
      <div className="flex items-center gap-1 text-xs text-stone-400">
        <Clock className="w-3.5 h-3.5" />
        <span>~1h</span>
      </div>

      {/* Arrow */}
      <ChevronRight className="w-5 h-5 text-stone-400" />
    </motion.button>
  );
}

// Empty state component
function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-stone-900 mb-2">{title}</h3>
      <p className="text-sm text-stone-500 max-w-xs">{description}</p>
    </div>
  );
}

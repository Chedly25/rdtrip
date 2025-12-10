/**
 * InlinePlaceCard - Compact place card for chat messages
 *
 * A polaroid-style travel card that appears inline in agent messages.
 * Designed to feel like a travel memory/recommendation you'd pin to a board.
 *
 * Features:
 * - Compact photo with gradient overlay
 * - Quick info (rating, price, type)
 * - Add to Trip + Directions actions
 * - Expands on click for more details
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  MapPin,
  Plus,
  Navigation,
  ExternalLink,
  ChevronDown,
  Heart,
  Clock,
  DollarSign,
  X
} from 'lucide-react';
import { useAgent } from '../../contexts/AgentProvider';

export interface PlaceData {
  name: string;
  rating?: number;
  userRatingsTotal?: number;
  photo?: string;
  types?: string[];
  address?: string;
  vicinity?: string;
  priceLevel?: number;
  isOpen?: boolean;
  lat?: number;
  lng?: number;
  placeId?: string;
  website?: string;
  phoneNumber?: string;
}

interface InlinePlaceCardProps {
  place: PlaceData;
  variant?: 'compact' | 'expanded';
}

export function InlinePlaceCard({ place, variant: _variant = 'compact' }: InlinePlaceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const { itineraryId, addActivityToDay } = useAgent();

  // Format price level
  const getPriceDisplay = (level?: number) => {
    if (!level) return null;
    return '€'.repeat(level);
  };

  // Get primary type
  const getPrimaryType = (types?: string[]) => {
    if (!types || types.length === 0) return null;
    const type = types[0].replace(/_/g, ' ');
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Handle add to trip
  const handleAddToTrip = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!itineraryId) {
      // No itinerary - show tooltip or alert
      alert('Generate an itinerary first to add places!');
      return;
    }
    setShowDayPicker(true);
  };

  // Handle day selection
  const handleDaySelect = async (dayNumber: number, block: 'morning' | 'afternoon' | 'evening') => {
    const result = await addActivityToDay(place, dayNumber, block);
    if (result.success) {
      setShowDayPicker(false);
      // Could show success toast here
    } else {
      alert(`Failed to add: ${result.error}`);
    }
  };

  // Handle get directions
  const handleGetDirections = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (place.lat && place.lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`, '_blank');
    } else if (place.address || place.vicinity) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place.address || place.vicinity || place.name)}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`, '_blank');
    }
  };

  // Handle favorite
  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorited(!isFavorited);
    // TODO: Persist to favorites store
  };

  return (
    <>
      <motion.div
        layout
        onClick={() => setIsExpanded(!isExpanded)}
        className="inline-block my-2 cursor-pointer group"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Card Container - Polaroid style */}
        <div className="relative bg-white rounded-xl shadow-lg border border-stone-200/60 overflow-hidden w-[280px] transition-all duration-300 hover:shadow-xl hover:border-amber-200/60">

          {/* Photo Section */}
          <div className="relative h-32 overflow-hidden">
            {place.photo ? (
              <img
                src={place.photo}
                alt={place.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-amber-100 via-orange-50 to-rose-100 flex items-center justify-center">
                <MapPin className="w-8 h-8 text-amber-400/60" />
              </div>
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

            {/* Top badges */}
            <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
              {/* Open/Closed badge */}
              {place.isOpen !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide backdrop-blur-sm ${
                  place.isOpen
                    ? 'bg-emerald-500/90 text-white'
                    : 'bg-rose-500/90 text-white'
                }`}>
                  {place.isOpen ? 'Open' : 'Closed'}
                </span>
              )}

              {/* Favorite button */}
              <button
                onClick={handleFavorite}
                className={`w-7 h-7 rounded-full backdrop-blur-sm flex items-center justify-center transition-all ${
                  isFavorited
                    ? 'bg-rose-500 text-white'
                    : 'bg-white/80 text-stone-600 hover:bg-white hover:text-rose-500'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${isFavorited ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Bottom info overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <h4 className="text-white font-semibold text-sm leading-tight line-clamp-2 drop-shadow-md">
                {place.name}
              </h4>
            </div>
          </div>

          {/* Info Section */}
          <div className="p-3 space-y-2">
            {/* Meta row */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {/* Rating */}
                {place.rating && (
                  <span className="flex items-center gap-1 text-amber-600 font-medium">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {place.rating.toFixed(1)}
                    {place.userRatingsTotal && (
                      <span className="text-stone-400">({place.userRatingsTotal > 1000 ? `${(place.userRatingsTotal / 1000).toFixed(1)}k` : place.userRatingsTotal})</span>
                    )}
                  </span>
                )}

                {/* Price */}
                {place.priceLevel && (
                  <span className="text-stone-500 font-medium">
                    {getPriceDisplay(place.priceLevel)}
                  </span>
                )}
              </div>

              {/* Type badge */}
              {getPrimaryType(place.types) && (
                <span className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded-full text-[10px] font-medium">
                  {getPrimaryType(place.types)}
                </span>
              )}
            </div>

            {/* Actions row */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleAddToTrip}
                className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white text-xs font-medium py-2 px-3 rounded-lg transition-all shadow-sm hover:shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                Add to Trip
              </button>
              <button
                onClick={handleGetDirections}
                className="flex items-center justify-center w-9 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg transition-colors"
                title="Get directions"
              >
                <Navigation className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Expand indicator */}
          <div className="absolute bottom-1 right-1">
            <ChevronDown className={`w-4 h-4 text-stone-300 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </motion.div>

      {/* Expanded Details Modal */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center p-4"
            onClick={() => setIsExpanded(false)}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              {/* Close button */}
              <button
                onClick={() => setIsExpanded(false)}
                className="absolute top-4 right-4 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
              >
                <X className="w-4 h-4 text-stone-600" />
              </button>

              {/* Large photo */}
              <div className="relative h-48">
                {place.photo ? (
                  <img
                    src={place.photo}
                    alt={place.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-amber-100 via-orange-50 to-rose-100 flex items-center justify-center">
                    <MapPin className="w-16 h-16 text-amber-400/40" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                {/* Title on image */}
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-white font-bold text-xl drop-shadow-lg">{place.name}</h3>
                  {getPrimaryType(place.types) && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-white/20 backdrop-blur-sm text-white/90 rounded-full text-xs">
                      {getPrimaryType(place.types)}
                    </span>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="p-5 space-y-4">
                {/* Rating + Price row */}
                <div className="flex items-center gap-4">
                  {place.rating && (
                    <div className="flex items-center gap-1.5">
                      <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-stone-800">{place.rating.toFixed(1)}</span>
                      {place.userRatingsTotal && (
                        <span className="text-stone-500 text-sm">({place.userRatingsTotal.toLocaleString()} reviews)</span>
                      )}
                    </div>
                  )}
                  {place.priceLevel && (
                    <div className="flex items-center gap-1.5 text-stone-600">
                      <DollarSign className="w-4 h-4" />
                      <span>{getPriceDisplay(place.priceLevel)}</span>
                    </div>
                  )}
                </div>

                {/* Address */}
                {(place.address || place.vicinity) && (
                  <div className="flex items-start gap-2 text-stone-600 text-sm">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{place.address || place.vicinity}</span>
                  </div>
                )}

                {/* Open status */}
                {place.isOpen !== undefined && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-stone-400" />
                    <span className={place.isOpen ? 'text-emerald-600 font-medium' : 'text-rose-600'}>
                      {place.isOpen ? 'Open now' : 'Currently closed'}
                    </span>
                  </div>
                )}

                {/* Website */}
                {place.website && (
                  <a
                    href={place.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-teal-600 hover:text-teal-700 text-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Visit website
                  </a>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleAddToTrip}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-medium py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg"
                  >
                    <Plus className="w-5 h-5" />
                    Add to Trip
                  </button>
                  <button
                    onClick={handleGetDirections}
                    className="flex items-center justify-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium py-3 px-4 rounded-xl transition-colors"
                  >
                    <Navigation className="w-5 h-5" />
                    Directions
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Day Picker Modal */}
      <AnimatePresence>
        {showDayPicker && (
          <DayPickerModal
            place={place}
            onClose={() => setShowDayPicker(false)}
            onSelect={handleDaySelect}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * Day Picker Modal - Select day and time block for adding place
 */
function DayPickerModal({
  place,
  onClose,
  onSelect
}: {
  place: PlaceData;
  onClose: () => void;
  onSelect: (day: number, block: 'morning' | 'afternoon' | 'evening') => void;
}) {
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedBlock, setSelectedBlock] = useState<'morning' | 'afternoon' | 'evening'>('afternoon');

  const blocks = [
    { id: 'morning' as const, label: 'Morning', icon: '🌅', time: '8am - 12pm' },
    { id: 'afternoon' as const, label: 'Afternoon', icon: '☀️', time: '12pm - 6pm' },
    { id: 'evening' as const, label: 'Evening', icon: '🌆', time: '6pm - 10pm' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[2100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-emerald-500 p-5 text-white">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-lg">Add to Itinerary</h3>
            <button
              onClick={onClose}
              className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-white/80 text-sm truncate">{place.name}</p>
        </div>

        <div className="p-5 space-y-5">
          {/* Day selector */}
          <div>
            <label className="text-sm font-medium text-stone-700 mb-2 block">
              Select Day
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`h-10 rounded-lg font-medium text-sm transition-all ${
                    selectedDay === day
                      ? 'bg-teal-600 text-white shadow-md scale-105'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Time block selector */}
          <div>
            <label className="text-sm font-medium text-stone-700 mb-2 block">
              Select Time
            </label>
            <div className="space-y-2">
              {blocks.map((block) => (
                <button
                  key={block.id}
                  onClick={() => setSelectedBlock(block.id)}
                  className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${
                    selectedBlock === block.id
                      ? 'bg-teal-50 border-2 border-teal-500 shadow-sm'
                      : 'bg-stone-50 border-2 border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <span className="text-xl">{block.icon}</span>
                  <div className="text-left flex-1">
                    <div className={`font-medium ${selectedBlock === block.id ? 'text-teal-800' : 'text-stone-700'}`}>
                      {block.label}
                    </div>
                    <div className={`text-xs ${selectedBlock === block.id ? 'text-teal-600' : 'text-stone-500'}`}>
                      {block.time}
                    </div>
                  </div>
                  {selectedBlock === block.id && (
                    <div className="w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onSelect(selectedDay, selectedBlock)}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-500 hover:to-emerald-400 text-white font-medium rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add to Day {selectedDay}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default InlinePlaceCard;

/**
 * ActivityGridArtifact - Enhanced activity grid with interactivity
 *
 * Features:
 * - 2-column grid of activity cards
 * - Add to itinerary button
 * - Get directions button
 * - Activity detail modal
 * - Staggered animations
 */

import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Star, ExternalLink, Plus, Navigation, X, Phone, Globe, DollarSign, Calendar, Clock } from 'lucide-react';
import { useState } from 'react';
import { useAgent } from '../../../contexts/AgentProvider';

interface Activity {
  name: string;
  rating?: number;
  userRatingsTotal?: number;
  types?: string[];
  photo?: string;
  address?: string;
  distance?: number;
  isOpen?: boolean;
  priceLevel?: number;
  phoneNumber?: string;
  website?: string;
  vicinity?: string;
}

interface ActivityGridArtifactProps {
  activities: Activity[];
  metadata?: {
    city?: string;
    category?: string;
    [key: string]: any;
  };
}

export function ActivityGridArtifact({ activities }: ActivityGridArtifactProps) {
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [addingActivity, setAddingActivity] = useState<Activity | null>(null); // For day selector modal
  const { itineraryId, addActivityToDay } = useAgent();

  // Debug logging
  console.log('🔍 [ActivityGridArtifact] Received activities:', activities);
  console.log('🔍 [ActivityGridArtifact] First activity:', activities[0]);
  console.log('🔍 [ActivityGridArtifact] First activity keys:', activities[0] ? Object.keys(activities[0]) : 'none');
  console.log('🔍 [ActivityGridArtifact] Itinerary ID:', itineraryId);

  // Handle adding activity to itinerary
  const handleAddToItinerary = (activity: Activity) => {
    if (!itineraryId) {
      alert('No itinerary available. Please generate a route first.');
      return;
    }
    // Open day selector modal
    setAddingActivity(activity);
  };

  // Handle day and time block selection
  const handleDaySelected = async (dayNumber: number, block: 'morning' | 'afternoon' | 'evening') => {
    if (!addingActivity) return;

    const result = await addActivityToDay(addingActivity, dayNumber, block);

    if (result.success) {
      // Success feedback
      alert(`✅ Added "${addingActivity.name}" to Day ${dayNumber} (${block})`);
      setAddingActivity(null);
    } else {
      // Error feedback
      alert(`❌ Failed to add activity: ${result.error || 'Unknown error'}`);
    }
  };

  return (
    <div className="p-4">
      {/* Grid of activity cards - 1 col on mobile, 2 cols on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {activities.map((activity, index) => (
          <motion.div
            key={activity.name || `activity-${index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
          >
            <ActivityCard
              activity={activity}
              onSelect={() => setSelectedActivity(activity)}
              onAddToItinerary={handleAddToItinerary}
            />
          </motion.div>
        ))}
      </div>

      {/* Selected activity detail modal */}
      <ActivityDetailModal
        activity={selectedActivity}
        onClose={() => setSelectedActivity(null)}
        onAddToItinerary={handleAddToItinerary}
      />

      {/* Day selector modal for adding to itinerary */}
      <DaySelectorModal
        activity={addingActivity}
        onClose={() => setAddingActivity(null)}
        onSelect={handleDaySelected}
      />
    </div>
  );
}

function ActivityCard({
  activity,
  onSelect,
  onAddToItinerary
}: {
  activity: Activity;
  onSelect: () => void;
  onAddToItinerary: (activity: Activity) => void;
}) {
  return (
    <div
      onClick={onSelect}
      className="bg-white rounded-xl overflow-hidden border-2 border-gray-200 hover:border-teal-300 hover:shadow-lg transition-all cursor-pointer group"
    >
      {/* Image */}
      <div className="relative h-24 bg-gradient-to-br from-teal-100 to-blue-100">
        {activity.photo ? (
          <img
            src={activity.photo}
            alt={activity.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin className="w-10 h-10 text-gray-400" />
          </div>
        )}

        {/* Open/Closed badge */}
        {activity.isOpen !== undefined && (
          <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold shadow-lg ${
            activity.isOpen ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {activity.isOpen ? '● Open' : '● Closed'}
          </div>
        )}

        {/* Category badge */}
        {activity.types && activity.types[0] && (
          <div className="absolute bottom-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-gray-700 capitalize">
            {activity.types[0].replace(/_/g, ' ')}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h4 className="font-bold text-gray-900 text-lg mb-3 line-clamp-2 group-hover:text-teal-600 transition-colors">
          {activity.name}
        </h4>

        {/* Rating */}
        {activity.rating && (
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium text-gray-900">{activity.rating}</span>
            </div>
            {activity.userRatingsTotal && (
              <span className="text-sm text-gray-500">({activity.userRatingsTotal.toLocaleString()})</span>
            )}
          </div>
        )}

        {/* Distance */}
        {activity.distance !== undefined && (
          <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
            <MapPin className="w-4 h-4" />
            <span>{activity.distance.toFixed(1)} km away</span>
          </div>
        )}

        {/* Price level */}
        {activity.priceLevel && (
          <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
            <DollarSign className="w-4 h-4" />
            <span>{'$'.repeat(activity.priceLevel)}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToItinerary(activity);
            }}
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-sm py-2 px-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add to Trip
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleGetDirections(activity);
            }}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-lg transition-colors"
            title="Get directions"
          >
            <Navigation className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ActivityDetailModal({
  activity,
  onClose,
  onAddToItinerary
}: {
  activity: Activity | null;
  onClose: () => void;
  onAddToItinerary: (activity: Activity) => void;
}) {
  if (!activity) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header with image */}
          <div className="relative h-64 bg-gradient-to-br from-teal-100 to-blue-100">
            {activity.photo ? (
              <img
                src={activity.photo}
                alt={activity.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <MapPin className="w-20 h-20 text-gray-400" />
              </div>
            )}

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>

            {/* Open/Closed badge */}
            {activity.isOpen !== undefined && (
              <div className={`absolute top-4 left-4 px-4 py-2 rounded-full text-sm font-bold shadow-lg ${
                activity.isOpen ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
              }`}>
                {activity.isOpen ? '● Open Now' : '● Closed'}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{activity.name}</h2>

            {/* Category tags */}
            {activity.types && activity.types.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {activity.types.slice(0, 3).map((type) => (
                  <span
                    key={type}
                    className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-sm font-medium capitalize"
                  >
                    {type.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            )}

            {/* Rating */}
            {activity.rating && (
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold text-gray-900 text-lg">{activity.rating}</span>
                </div>
                {activity.userRatingsTotal && (
                  <span className="text-gray-600">({activity.userRatingsTotal.toLocaleString()} reviews)</span>
                )}
              </div>
            )}

            {/* Details */}
            <div className="space-y-3 mb-6">
              {/* Address */}
              {(activity.address || activity.vicinity) && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{activity.address || activity.vicinity}</span>
                </div>
              )}

              {/* Distance */}
              {activity.distance !== undefined && (
                <div className="flex items-start gap-3">
                  <Navigation className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{activity.distance.toFixed(1)} km from your location</span>
                </div>
              )}

              {/* Phone */}
              {activity.phoneNumber && (
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <a href={`tel:${activity.phoneNumber}`} className="text-teal-600 hover:underline">
                    {activity.phoneNumber}
                  </a>
                </div>
              )}

              {/* Website */}
              {activity.website && (
                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <a
                    href={activity.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-600 hover:underline flex items-center gap-1"
                  >
                    Visit website
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}

              {/* Price Level */}
              {activity.priceLevel && (
                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    {'$'.repeat(activity.priceLevel)} · {getPriceLevelText(activity.priceLevel)}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => onAddToItinerary(activity)}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add to Itinerary
              </button>
              <button
                onClick={() => handleGetDirections(activity)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Navigation className="w-5 h-5" />
                Directions
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function DaySelectorModal({
  activity,
  onClose,
  onSelect
}: {
  activity: Activity | null;
  onClose: () => void;
  onSelect: (dayNumber: number, block: 'morning' | 'afternoon' | 'evening') => void;
}) {
  if (!activity) return null;

  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [selectedBlock, setSelectedBlock] = useState<'morning' | 'afternoon' | 'evening'>('afternoon');

  const blocks = [
    { id: 'morning', label: 'Morning', icon: '🌅', time: '8am - 12pm' },
    { id: 'afternoon', label: 'Afternoon', icon: '☀️', time: '12pm - 6pm' },
    { id: 'evening', label: 'Evening', icon: '🌆', time: '6pm - 10pm' }
  ] as const;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2100] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-500 to-blue-500 p-6 text-white">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-xl font-bold">Add to Itinerary</h3>
              <button
                onClick={onClose}
                className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-white/90 text-sm">{activity.name}</p>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Day selector */}
            <div className="mb-6">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <Calendar className="w-4 h-4" />
                Select Day
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((day) => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`
                      h-12 rounded-lg font-medium transition-all
                      ${selectedDay === day
                        ? 'bg-teal-600 text-white shadow-lg scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Time block selector */}
            <div className="mb-6">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <Clock className="w-4 h-4" />
                Select Time
              </label>
              <div className="space-y-2">
                {blocks.map((block) => (
                  <button
                    key={block.id}
                    onClick={() => setSelectedBlock(block.id)}
                    className={`
                      w-full p-3 rounded-lg flex items-center gap-3 transition-all
                      ${selectedBlock === block.id
                        ? 'bg-teal-50 border-2 border-teal-600 shadow-md'
                        : 'bg-gray-50 border-2 border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <span className="text-2xl">{block.icon}</span>
                    <div className="text-left flex-1">
                      <div className={`font-medium ${selectedBlock === block.id ? 'text-teal-900' : 'text-gray-900'}`}>
                        {block.label}
                      </div>
                      <div className={`text-sm ${selectedBlock === block.id ? 'text-teal-600' : 'text-gray-500'}`}>
                        {block.time}
                      </div>
                    </div>
                    {selectedBlock === block.id && (
                      <div className="w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => onSelect(selectedDay, selectedBlock)}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add to Day {selectedDay}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Helper functions
function getPriceLevelText(level: number): string {
  const levels = ['Free', 'Inexpensive', 'Moderate', 'Expensive', 'Very Expensive'];
  return levels[level] || 'Unknown';
}

function handleGetDirections(activity: Activity) {
  console.log('Get directions to:', activity.name);
  // TODO: Create directions artifact
  // This will call the agent to get directions to this location
  alert(`Getting directions to "${activity.name}" (feature coming soon)`);
}

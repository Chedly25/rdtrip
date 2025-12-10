/**
 * IdeasBoardPanel - Full-screen travel mood board panel
 *
 * Aesthetic: Vintage travel scrapbook / corkboard
 * - Cork texture background
 * - Pinned polaroid cards
 * - Travel stamps and decorations
 * - Tab navigation (Discover / Saved)
 *
 * Features:
 * - Swipeable card stack for discovering
 * - Grid view for saved items
 * - Category filters
 * - Day picker modal for adding to trip
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Heart,
  Compass,
  Sparkles,
  MapPin,
  Utensils,
  Building2,
  Landmark,
  Plus,
  Calendar,
  RotateCcw,
  Trash2
} from 'lucide-react';
import { useIdeasBoard, type IdeaCategory } from '../../../contexts/IdeasBoardContext';
import { useAgent } from '../../../contexts/AgentProvider';
import { IdeaCard } from './IdeaCard';

type TabView = 'discover' | 'saved';

// Category filter options
const categoryFilters: Array<{ value: IdeaCategory | 'all'; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { value: 'all', label: 'All', icon: Sparkles },
  { value: 'attraction', label: 'Attractions', icon: Landmark },
  { value: 'restaurant', label: 'Food', icon: Utensils },
  { value: 'hotel', label: 'Hotels', icon: Building2 },
  { value: 'activity', label: 'Activities', icon: Compass },
];

export function IdeasBoardPanel() {
  const {
    ideas,
    pendingIdeas,
    savedIdeas,
    isOpen,
    closePanel,
    saveIdea,
    skipIdea,
    markAsAdded,
    restoreIdea,
    clearAll,
    pendingCount,
    savedCount,
  } = useIdeasBoard();

  const { addActivityToDay } = useAgent();

  const [activeTab, setActiveTab] = useState<TabView>('discover');
  const [categoryFilter, setCategoryFilter] = useState<IdeaCategory | 'all'>('all');
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [selectedIdeaForAdd, setSelectedIdeaForAdd] = useState<string | null>(null);

  // Filter ideas by category
  const filteredPendingIdeas = useMemo(() => {
    if (categoryFilter === 'all') return pendingIdeas;
    return pendingIdeas.filter(i => i.category === categoryFilter);
  }, [pendingIdeas, categoryFilter]);

  const filteredSavedIdeas = useMemo(() => {
    if (categoryFilter === 'all') return savedIdeas;
    return savedIdeas.filter(i => i.category === categoryFilter);
  }, [savedIdeas, categoryFilter]);

  // Handle add to trip
  const handleAddToTrip = (ideaId: string) => {
    setSelectedIdeaForAdd(ideaId);
    setShowDayPicker(true);
  };

  // Handle day selection
  const handleDaySelected = async (dayNumber: number, block: 'morning' | 'afternoon' | 'evening') => {
    if (!selectedIdeaForAdd) return;

    const idea = ideas.find(i => i.id === selectedIdeaForAdd);
    if (!idea) return;

    // Construct activity object from idea
    const activity = {
      name: idea.name,
      photo: idea.photo,
      rating: idea.rating,
      userRatingsTotal: idea.userRatingsTotal,
      address: idea.address || idea.vicinity,
      priceLevel: idea.priceLevel,
      types: idea.types,
      placeId: idea.placeId,
      coordinates: idea.lat && idea.lng ? { lat: idea.lat, lng: idea.lng } : undefined,
    };

    const result = await addActivityToDay(activity, dayNumber, block);

    if (result.success) {
      markAsAdded(selectedIdeaForAdd, dayNumber);
      setShowDayPicker(false);
      setSelectedIdeaForAdd(null);
    } else {
      alert(`Failed to add: ${result.error}`);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[2000] flex items-center justify-center"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closePanel}
          className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
        />

        {/* Panel */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="
            relative w-full max-w-lg h-[85vh] mx-4
            rounded-2xl overflow-hidden
            shadow-2xl
          "
          style={{
            // Cork board texture
            background: 'linear-gradient(135deg, #dcc9a3 0%, #c7b38e 50%, #b8a57a 100%)',
          }}
        >
          {/* Cork texture overlay */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Header */}
          <div className="relative px-5 pt-5 pb-4">
            {/* Close button */}
            <button
              onClick={closePanel}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-lg z-10"
            >
              <X className="w-5 h-5 text-stone-700" />
            </button>

            {/* Title with decorative stamp */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-rose-500 flex items-center justify-center shadow-lg rotate-[-5deg]">
                <Compass className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2
                  className="text-2xl font-bold text-stone-800"
                  style={{ fontFamily: 'Georgia, serif' }}
                >
                  Ideas Board
                </h2>
                <p className="text-sm text-stone-600">
                  {pendingCount + savedCount} discoveries collected
                </p>
              </div>
            </div>

            {/* Tab navigation */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setActiveTab('discover')}
                className={`
                  flex-1 py-2.5 px-4 rounded-xl font-medium text-sm
                  flex items-center justify-center gap-2
                  transition-all
                  ${activeTab === 'discover'
                    ? 'bg-white shadow-lg text-stone-800'
                    : 'bg-white/40 text-stone-700 hover:bg-white/60'
                  }
                `}
              >
                <Sparkles className="w-4 h-4" />
                Discover
                {pendingCount > 0 && (
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-teal-500 text-white text-xs">
                    {pendingCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('saved')}
                className={`
                  flex-1 py-2.5 px-4 rounded-xl font-medium text-sm
                  flex items-center justify-center gap-2
                  transition-all
                  ${activeTab === 'saved'
                    ? 'bg-white shadow-lg text-stone-800'
                    : 'bg-white/40 text-stone-700 hover:bg-white/60'
                  }
                `}
              >
                <Heart className="w-4 h-4" />
                Saved
                {savedCount > 0 && (
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-rose-500 text-white text-xs">
                    {savedCount}
                  </span>
                )}
              </button>
            </div>

            {/* Category filters */}
            <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1 -mx-1 px-1">
              {categoryFilters.map((filter) => {
                const Icon = filter.icon;
                const isActive = categoryFilter === filter.value;
                return (
                  <button
                    key={filter.value}
                    onClick={() => setCategoryFilter(filter.value)}
                    className={`
                      flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium
                      flex items-center gap-1.5 transition-all
                      ${isActive
                        ? 'bg-stone-800 text-white shadow-md'
                        : 'bg-white/60 text-stone-700 hover:bg-white/80'
                      }
                    `}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content area */}
          <div className="relative flex-1 h-[calc(100%-220px)] overflow-hidden">
            <AnimatePresence mode="wait">
              {activeTab === 'discover' ? (
                <motion.div
                  key="discover"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="h-full px-5 py-4"
                >
                  {filteredPendingIdeas.length > 0 ? (
                    // Card stack
                    <div className="relative h-full flex items-center justify-center">
                      <div className="relative w-full max-w-sm h-[400px]">
                        {filteredPendingIdeas.slice(0, 3).map((idea, index) => (
                          <IdeaCard
                            key={idea.id}
                            idea={idea}
                            isTopCard={index === 0}
                            stackPosition={index}
                            onSave={() => saveIdea(idea.id)}
                            onSkip={() => skipIdea(idea.id)}
                            onAddToTrip={() => handleAddToTrip(idea.id)}
                          />
                        ))}
                      </div>

                      {/* Swipe hints */}
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-8 text-xs text-stone-600">
                        <span className="flex items-center gap-1">
                          <X className="w-3 h-3" /> Swipe left to skip
                        </span>
                        <span className="flex items-center gap-1">
                          Swipe right to save <Heart className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ) : (
                    // Empty state
                    <div className="h-full flex flex-col items-center justify-center text-center px-6">
                      <div className="w-20 h-20 rounded-full bg-white/60 flex items-center justify-center mb-4">
                        <Compass className="w-10 h-10 text-stone-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-stone-700 mb-2">
                        No ideas yet
                      </h3>
                      <p className="text-sm text-stone-500 mb-4">
                        Ask me for recommendations and they'll appear here for you to swipe through!
                      </p>
                      <button
                        onClick={closePanel}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg font-medium text-sm hover:bg-teal-700 transition-colors"
                      >
                        Ask for suggestions
                      </button>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="saved"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full overflow-y-auto px-5 py-4"
                >
                  {filteredSavedIdeas.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {filteredSavedIdeas.map((idea) => (
                        <SavedIdeaCard
                          key={idea.id}
                          idea={idea}
                          onAddToTrip={() => handleAddToTrip(idea.id)}
                          onRestore={() => restoreIdea(idea.id)}
                        />
                      ))}
                    </div>
                  ) : (
                    // Empty saved state
                    <div className="h-full flex flex-col items-center justify-center text-center px-6">
                      <div className="w-20 h-20 rounded-full bg-white/60 flex items-center justify-center mb-4">
                        <Heart className="w-10 h-10 text-stone-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-stone-700 mb-2">
                        No saved ideas
                      </h3>
                      <p className="text-sm text-stone-500">
                        Swipe right on cards to save them here
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer with clear button */}
          {ideas.length > 0 && (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#c7b38e] to-transparent">
              <button
                onClick={clearAll}
                className="w-full py-2 text-stone-600 text-sm font-medium hover:text-stone-800 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear all ideas
              </button>
            </div>
          )}
        </motion.div>

        {/* Day Picker Modal */}
        <AnimatePresence>
          {showDayPicker && (
            <DayPickerModal
              onClose={() => {
                setShowDayPicker(false);
                setSelectedIdeaForAdd(null);
              }}
              onSelect={handleDaySelected}
              ideaName={ideas.find(i => i.id === selectedIdeaForAdd)?.name || ''}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}

// Saved idea mini card
function SavedIdeaCard({
  idea,
  onAddToTrip,
  onRestore,
}: {
  idea: any;
  onAddToTrip: () => void;
  onRestore: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-lg overflow-hidden shadow-md"
    >
      {/* Photo */}
      <div className="relative h-24 bg-stone-200">
        {idea.photo ? (
          <img src={idea.photo} alt={idea.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin className="w-8 h-8 text-stone-400" />
          </div>
        )}
        {idea.status === 'added' && (
          <div className="absolute inset-0 bg-emerald-500/80 flex items-center justify-center">
            <span className="text-white font-bold text-xs">Added to Day {idea.addedToDay}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-2">
        <h4 className="font-semibold text-stone-800 text-sm line-clamp-1">{idea.name}</h4>
        {idea.rating && (
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-amber-500 text-xs">★</span>
            <span className="text-xs text-stone-600">{idea.rating}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-1 mt-2">
          <button
            onClick={onAddToTrip}
            disabled={idea.status === 'added'}
            className="flex-1 py-1.5 bg-teal-600 text-white text-xs font-medium rounded hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
          >
            <Plus className="w-3 h-3" />
            {idea.status === 'added' ? 'Added' : 'Add'}
          </button>
          <button
            onClick={onRestore}
            className="py-1.5 px-2 bg-stone-100 text-stone-600 text-xs rounded hover:bg-stone-200"
            title="Move back to discover"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// Day Picker Modal
function DayPickerModal({
  onClose,
  onSelect,
  ideaName,
}: {
  onClose: () => void;
  onSelect: (day: number, block: 'morning' | 'afternoon' | 'evening') => void;
  ideaName: string;
}) {
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedBlock, setSelectedBlock] = useState<'morning' | 'afternoon' | 'evening'>('afternoon');

  const blocks = [
    { id: 'morning', label: 'Morning', icon: '🌅' },
    { id: 'afternoon', label: 'Afternoon', icon: '☀️' },
    { id: 'evening', label: 'Evening', icon: '🌆' },
  ] as const;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[3000] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-emerald-500 p-4 text-white">
          <h3 className="text-lg font-bold">Add to Trip</h3>
          <p className="text-sm text-white/90 line-clamp-1">{ideaName}</p>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Day selector */}
          <div>
            <label className="text-sm font-medium text-stone-700 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Select Day
            </label>
            <div className="grid grid-cols-5 gap-2 mt-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`
                    h-10 rounded-lg font-medium text-sm transition-all
                    ${selectedDay === day
                      ? 'bg-teal-600 text-white shadow-lg'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }
                  `}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Time block selector */}
          <div>
            <label className="text-sm font-medium text-stone-700 mb-2 block">
              Time of Day
            </label>
            <div className="flex gap-2">
              {blocks.map((block) => (
                <button
                  key={block.id}
                  onClick={() => setSelectedBlock(block.id)}
                  className={`
                    flex-1 py-2 px-3 rounded-lg font-medium text-sm
                    flex flex-col items-center gap-1 transition-all
                    ${selectedBlock === block.id
                      ? 'bg-teal-50 border-2 border-teal-600 text-teal-800'
                      : 'bg-stone-50 border-2 border-stone-200 text-stone-700 hover:border-stone-300'
                    }
                  `}
                >
                  <span className="text-lg">{block.icon}</span>
                  <span>{block.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-stone-100 text-stone-700 rounded-xl font-medium hover:bg-stone-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onSelect(selectedDay, selectedBlock)}
              className="flex-1 py-2.5 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
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

export default IdeasBoardPanel;

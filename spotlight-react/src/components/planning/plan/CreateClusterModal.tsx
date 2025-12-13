/**
 * CreateClusterModal
 *
 * Modal for creating a new geographic cluster/area.
 * Two modes: manual name entry or search-based with auto-suggested name.
 *
 * Design: Editorial modal with warm tones, refined typography, subtle animations
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  MapPin,
  Search,
  Sparkles,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import type { LatLng } from '../../../types/planning';

export interface CreateClusterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCluster: (name: string, center?: LatLng) => void;
  cityName: string;
  cityCenter: LatLng;
}

// Pre-defined area suggestions based on common city areas
const areaSuggestions = [
  'Historic Center',
  'Old Town',
  'Waterfront',
  'Arts District',
  'Local Quarter',
  'Market Area',
  'Garden District',
  'Sunset Strip',
];

// Backdrop animation
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

// Modal animation
const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      duration: 0.15,
    },
  },
};

export function CreateClusterModal({
  isOpen,
  onClose,
  onCreateCluster,
  cityName,
  cityCenter,
}: CreateClusterModalProps) {
  const [areaName, setAreaName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      // Reset state when closing
      setAreaName('');
      setSearchQuery('');
      setIsSearching(false);
      setShowSuggestions(false);
    }
  }, [isOpen]);

  // Handle create
  const handleCreate = () => {
    if (!areaName.trim()) return;
    onCreateCluster(areaName.trim(), cityCenter);
    onClose();
  };

  // Handle keyboard submit
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && areaName.trim()) {
      handleCreate();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: string) => {
    setAreaName(suggestion);
    setShowSuggestions(false);
  };

  // Simulate place search (in production, integrate with Google Places or Mapbox)
  const handleSearchPlace = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Generate area name from search query
    const generatedName = `${searchQuery.trim()} Area`;
    setAreaName(generatedName);
    setIsSearching(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            className="absolute inset-0 bg-[#2C2417]/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            variants={modalVariants}
            className="
              relative w-full max-w-md
              bg-[#FFFBF5] rounded-2xl
              border border-[#E5DDD0]
              shadow-2xl shadow-[#2C2417]/20
              overflow-hidden
            "
          >
            {/* Decorative header gradient */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-[#FEF3EE] via-[#FFFBF5] to-[#F5F0E8] opacity-80" />

            {/* Content */}
            <div className="relative p-6">
              {/* Close button */}
              <button
                onClick={onClose}
                className="
                  absolute top-4 right-4
                  w-8 h-8 rounded-full
                  bg-[#FAF7F2] hover:bg-[#F5F0E8]
                  flex items-center justify-center
                  text-[#8B7355] hover:text-[#2C2417]
                  transition-colors duration-200
                "
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="
                  w-12 h-12 rounded-xl
                  bg-gradient-to-br from-[#FEF3EE] to-[#FCE8DE]
                  flex items-center justify-center
                  shadow-inner
                ">
                  <MapPin className="w-6 h-6 text-[#C45830]" strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="font-['Fraunces',serif] text-xl text-[#2C2417] font-semibold">
                    Create New Area
                  </h2>
                  <p className="text-sm text-[#8B7355] font-['Satoshi',sans-serif]">
                    in {cityName}
                  </p>
                </div>
              </div>

              {/* Area name input */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-['Satoshi',sans-serif] font-medium text-[#2C2417] mb-2">
                    Area Name
                  </label>
                  <div className="relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={areaName}
                      onChange={(e) => setAreaName(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onFocus={() => setShowSuggestions(true)}
                      placeholder="e.g., Notre-Dame area, Old Town..."
                      className="
                        w-full px-4 py-3
                        bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl
                        font-['Satoshi',sans-serif] text-[#2C2417] placeholder:text-[#C4B8A5]
                        focus:outline-none focus:ring-2 focus:ring-[#C45830]/20 focus:border-[#C45830]
                        transition-all duration-200
                      "
                    />

                    {/* Quick suggestions dropdown */}
                    <AnimatePresence>
                      {showSuggestions && !areaName && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="
                            absolute top-full left-0 right-0 mt-2 z-10
                            bg-[#FFFBF5] border border-[#E5DDD0] rounded-xl
                            shadow-lg shadow-[#2C2417]/10
                            overflow-hidden
                          "
                        >
                          <div className="p-2">
                            <p className="px-2 py-1 text-xs text-[#C4B8A5] font-['Satoshi',sans-serif] uppercase tracking-wide">
                              Quick suggestions
                            </p>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {areaSuggestions.map((suggestion) => (
                                <button
                                  key={suggestion}
                                  onClick={() => handleSelectSuggestion(suggestion)}
                                  className="
                                    px-3 py-1.5 rounded-lg
                                    bg-[#FAF7F2] hover:bg-[#FEF3EE]
                                    border border-[#E5DDD0] hover:border-[#C45830]
                                    text-sm font-['Satoshi',sans-serif] text-[#8B7355] hover:text-[#C45830]
                                    transition-all duration-150
                                  "
                                >
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Divider with "or" */}
                <div className="flex items-center gap-3 py-2">
                  <div className="flex-1 h-px bg-[#E5DDD0]" />
                  <span className="text-xs text-[#C4B8A5] font-['Satoshi',sans-serif] uppercase tracking-wider">
                    or search a place
                  </span>
                  <div className="flex-1 h-px bg-[#E5DDD0]" />
                </div>

                {/* Place search */}
                <div>
                  <label className="block text-sm font-['Satoshi',sans-serif] font-medium text-[#2C2417] mb-2">
                    Search for a landmark
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C4B8A5]" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchPlace()}
                        placeholder="e.g., Eiffel Tower, Central Park..."
                        className="
                          w-full pl-10 pr-4 py-3
                          bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl
                          font-['Satoshi',sans-serif] text-[#2C2417] placeholder:text-[#C4B8A5]
                          focus:outline-none focus:ring-2 focus:ring-[#C45830]/20 focus:border-[#C45830]
                          transition-all duration-200
                        "
                      />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSearchPlace}
                      disabled={!searchQuery.trim() || isSearching}
                      className="
                        px-4 py-3 rounded-xl
                        bg-[#FAF7F2] hover:bg-[#FEF3EE]
                        border border-[#E5DDD0] hover:border-[#C45830]
                        text-[#8B7355] hover:text-[#C45830]
                        disabled:opacity-50 disabled:cursor-not-allowed
                        transition-all duration-200
                        flex items-center justify-center
                      "
                    >
                      {isSearching ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Sparkles className="w-5 h-5" />
                      )}
                    </motion.button>
                  </div>
                  <p className="mt-1.5 text-xs text-[#C4B8A5] font-['Satoshi',sans-serif]">
                    We'll name the area based on nearby landmarks
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 mt-8">
                <button
                  onClick={onClose}
                  className="
                    flex-1 py-3 rounded-xl
                    bg-[#FAF7F2] hover:bg-[#F5F0E8]
                    border border-[#E5DDD0]
                    font-['Satoshi',sans-serif] font-medium text-sm text-[#8B7355]
                    transition-colors duration-200
                  "
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: areaName.trim() ? 1.02 : 1 }}
                  whileTap={{ scale: areaName.trim() ? 0.98 : 1 }}
                  onClick={handleCreate}
                  disabled={!areaName.trim()}
                  className={`
                    flex-1 py-3 rounded-xl
                    font-['Satoshi',sans-serif] font-semibold text-sm
                    flex items-center justify-center gap-2
                    transition-all duration-200
                    ${areaName.trim()
                      ? 'bg-gradient-to-r from-[#C45830] to-[#D4724A] text-white shadow-lg shadow-[#C45830]/20 hover:shadow-xl hover:shadow-[#C45830]/30'
                      : 'bg-[#E5DDD0] text-[#C4B8A5] cursor-not-allowed'
                    }
                  `}
                >
                  Create Area
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            {/* Decorative corner accent */}
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-[#FEF3EE] to-transparent opacity-50 pointer-events-none" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default CreateClusterModal;

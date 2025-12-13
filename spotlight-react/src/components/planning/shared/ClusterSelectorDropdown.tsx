/**
 * ClusterSelectorDropdown
 *
 * Dropdown for selecting which cluster to add an item to.
 * Shows existing clusters with item counts, plus "Create new area" option.
 *
 * Design: Editorial dropdown with warm tones, proximity indicators
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Plus,
  ChevronDown,
  Footprints,
  Check,
} from 'lucide-react';
import type { Cluster, LatLng } from '../../../types/planning';

export interface ClusterSelectorDropdownProps {
  clusters: Cluster[];
  onSelectCluster: (clusterId: string) => void;
  onCreateNew: () => void;
  // Optional: for proximity calculation
  itemLocation?: LatLng;
  // Button variant
  variant?: 'primary' | 'compact';
  // Controlled open state (optional)
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// Calculate walking time between two points
function estimateWalkingTime(from: LatLng, to: LatLng): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((from.lat * Math.PI) / 180) *
      Math.cos((to.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return Math.round(distance * 12); // ~12 min per km walking
}

// Get proximity color
function getProximityColor(minutes: number): string {
  if (minutes <= 5) return 'text-[#4A7C59]'; // Green
  if (minutes <= 15) return 'text-[#D4A853]'; // Yellow
  return 'text-[#C45830]'; // Red
}

export function ClusterSelectorDropdown({
  clusters,
  onSelectCluster,
  onCreateNew,
  itemLocation,
  variant = 'primary',
  isOpen: controlledOpen,
  onOpenChange,
}: ClusterSelectorDropdownProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Use controlled or internal state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    } else {
      setInternalOpen(open);
    }
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Sort clusters by proximity if item location is provided
  const sortedClusters = itemLocation
    ? [...clusters].sort((a, b) => {
        const distA = a.center ? estimateWalkingTime(itemLocation, a.center) : Infinity;
        const distB = b.center ? estimateWalkingTime(itemLocation, b.center) : Infinity;
        return distA - distB;
      })
    : clusters;

  // Handle selection
  const handleSelect = (clusterId: string) => {
    onSelectCluster(clusterId);
    setOpen(false);
  };

  // Handle create new
  const handleCreateNew = () => {
    onCreateNew();
    setOpen(false);
  };

  // If no clusters, show "Create first area" button
  if (clusters.length === 0) {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleCreateNew}
        className="
          w-full py-2.5 rounded-lg
          bg-[#C45830] hover:bg-[#A84828]
          text-white font-['Satoshi',sans-serif] font-semibold text-sm
          flex items-center justify-center gap-2
          transition-colors duration-200
          shadow-sm shadow-[#C45830]/20
        "
      >
        <Plus className="w-4 h-4" />
        Create Area & Add
      </motion.button>
    );
  }

  // If only one cluster, show direct add button
  if (clusters.length === 1) {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => handleSelect(clusters[0].id)}
        className="
          w-full py-2.5 rounded-lg
          bg-[#C45830] hover:bg-[#A84828]
          text-white font-['Satoshi',sans-serif] font-semibold text-sm
          flex items-center justify-center gap-2
          transition-colors duration-200
          shadow-sm shadow-[#C45830]/20
        "
      >
        <Plus className="w-4 h-4" />
        Add to {clusters[0].name}
      </motion.button>
    );
  }

  // Multiple clusters - show dropdown
  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger button */}
      {variant === 'primary' ? (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setOpen(!isOpen)}
          className={`
            w-full py-2.5 rounded-lg
            bg-[#C45830] hover:bg-[#A84828]
            text-white font-['Satoshi',sans-serif] font-semibold text-sm
            flex items-center justify-center gap-2
            transition-colors duration-200
            shadow-sm shadow-[#C45830]/20
            ${isOpen ? 'bg-[#A84828]' : ''}
          `}
        >
          <Plus className="w-4 h-4" />
          Add to Plan
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </motion.button>
      ) : (
        <button
          onClick={() => setOpen(!isOpen)}
          className={`
            px-3 py-1.5 rounded-lg
            bg-[#FAF7F2] hover:bg-[#FEF3EE]
            border border-[#E5DDD0] hover:border-[#C45830]
            text-[#8B7355] hover:text-[#C45830]
            font-['Satoshi',sans-serif] font-medium text-xs
            flex items-center gap-1.5
            transition-all duration-200
          `}
        >
          <Plus className="w-3.5 h-3.5" />
          Add
          <ChevronDown
            className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      )}

      {/* Dropdown menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="
              absolute left-0 right-0 top-full mt-2 z-50
              bg-[#FFFBF5] rounded-xl
              border border-[#E5DDD0]
              shadow-xl shadow-[#2C2417]/15
              overflow-hidden
            "
          >
            {/* Header */}
            <div className="px-3 py-2 border-b border-[#F5F0E8]">
              <p className="text-xs text-[#C4B8A5] font-['Satoshi',sans-serif] uppercase tracking-wide">
                Choose an area
              </p>
            </div>

            {/* Cluster options */}
            <div className="py-1 max-h-48 overflow-y-auto">
              {sortedClusters.map((cluster, index) => {
                const walkingTime = itemLocation && cluster.center
                  ? estimateWalkingTime(itemLocation, cluster.center)
                  : null;
                const isNearest = index === 0 && itemLocation;

                return (
                  <button
                    key={cluster.id}
                    onClick={() => handleSelect(cluster.id)}
                    className="
                      w-full px-3 py-2.5 text-left
                      hover:bg-[#FAF7F2]
                      transition-colors duration-150
                      flex items-center gap-3
                    "
                  >
                    {/* Icon */}
                    <div className={`
                      w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                      ${isNearest
                        ? 'bg-gradient-to-br from-[#F0F7F4] to-[#E0F0E8]'
                        : 'bg-[#FAF7F2]'
                      }
                    `}>
                      <MapPin
                        className={`w-4 h-4 ${isNearest ? 'text-[#4A7C59]' : 'text-[#C45830]'}`}
                        strokeWidth={1.5}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-['Satoshi',sans-serif] font-medium text-sm text-[#2C2417] truncate">
                          {cluster.name}
                        </span>
                        {isNearest && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#F0F7F4] text-[#4A7C59]">
                            Nearest
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-[#8B7355]">
                        <span>{cluster.items.length} {cluster.items.length === 1 ? 'place' : 'places'}</span>
                        {walkingTime !== null && (
                          <>
                            <span className="text-[#E5DDD0]">·</span>
                            <span className={`flex items-center gap-1 ${getProximityColor(walkingTime)}`}>
                              <Footprints className="w-3 h-3" />
                              {walkingTime} min
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Add indicator */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Check className="w-4 h-4 text-[#4A7C59]" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Create new option */}
            <div className="border-t border-[#F5F0E8]">
              <button
                onClick={handleCreateNew}
                className="
                  w-full px-3 py-2.5 text-left
                  hover:bg-[#FEF3EE]
                  transition-colors duration-150
                  flex items-center gap-3
                "
              >
                <div className="w-8 h-8 rounded-lg bg-[#FEF3EE] flex items-center justify-center flex-shrink-0">
                  <Plus className="w-4 h-4 text-[#C45830]" />
                </div>
                <span className="font-['Satoshi',sans-serif] font-medium text-sm text-[#C45830]">
                  Create new area
                </span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ClusterSelectorDropdown;

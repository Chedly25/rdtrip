/**
 * ClusterVisualization
 *
 * Visualizes activity clusters discovered for a city.
 * Includes both a card-based list view and data for map overlay.
 *
 * Design Philosophy:
 * - Each cluster is a "zone" with a distinct personality
 * - Visual connection between cluster theme and its places
 * - Walkability prominently displayed (key UX concern)
 * - Expandable to show places within each cluster
 * - Color-coded by theme for quick scanning
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Footprints,
  ChevronDown,
  ChevronRight,
  Building2,
  Utensils,
  TreePine,
  ShoppingBag,
  Wine,
  Star,
  Camera,
  Clock,
  Layers,
} from 'lucide-react';
import type { Cluster, ClusterPlace, ClustersOutput } from '../../types/cityIntelligence';

// =============================================================================
// Types
// =============================================================================

interface ClusterVisualizationProps {
  clusters: Cluster[];
  /** Callback when a cluster is selected */
  onClusterSelect?: (cluster: Cluster) => void;
  /** Currently selected cluster ID */
  selectedClusterId?: string;
  /** Compact card mode */
  compact?: boolean;
  /** Animation delay */
  delay?: number;
}

interface ClusterCardProps {
  cluster: Cluster;
  isSelected: boolean;
  onSelect: () => void;
  delay: number;
  compact: boolean;
}

// =============================================================================
// Configuration
// =============================================================================

const THEME_CONFIG = {
  cultural: {
    icon: Building2,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    gradient: 'from-indigo-500 to-violet-500',
    label: 'Cultural',
  },
  food: {
    icon: Utensils,
    color: 'text-rose-500',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    gradient: 'from-rose-500 to-orange-500',
    label: 'Food & Drink',
  },
  nature: {
    icon: TreePine,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    gradient: 'from-emerald-500 to-teal-500',
    label: 'Nature',
  },
  shopping: {
    icon: ShoppingBag,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    gradient: 'from-amber-500 to-yellow-500',
    label: 'Shopping',
  },
  nightlife: {
    icon: Wine,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    gradient: 'from-purple-500 to-pink-500',
    label: 'Nightlife',
  },
  mixed: {
    icon: Layers,
    color: 'text-slate-600',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    gradient: 'from-slate-500 to-gray-500',
    label: 'Mixed',
  },
};

// =============================================================================
// Main Component
// =============================================================================

export function ClusterVisualization({
  clusters,
  onClusterSelect,
  selectedClusterId,
  compact = false,
  delay = 0,
}: ClusterVisualizationProps) {
  if (!clusters || clusters.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No activity clusters yet</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay }}
      className="space-y-4"
    >
      {/* Header */}
      {!compact && (
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-semibold text-gray-900">
              Activity Zones
            </h3>
            <p className="text-sm text-gray-500">
              {clusters.length} walkable clusters discovered
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium">
            <Footprints className="w-4 h-4" />
            All walkable
          </div>
        </div>
      )}

      {/* Clusters grid/list */}
      <div className={compact ? 'space-y-2' : 'grid gap-4 md:grid-cols-2'}>
        {clusters.map((cluster, idx) => (
          <ClusterCard
            key={cluster.id}
            cluster={cluster}
            isSelected={selectedClusterId === cluster.id}
            onSelect={() => onClusterSelect?.(cluster)}
            delay={delay + idx * 0.1}
            compact={compact}
          />
        ))}
      </div>
    </motion.div>
  );
}

// =============================================================================
// Cluster Card
// =============================================================================

function ClusterCard({
  cluster,
  isSelected,
  onSelect,
  delay,
  compact,
}: ClusterCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const theme = THEME_CONFIG[cluster.theme as keyof typeof THEME_CONFIG] || THEME_CONFIG.mixed;
  const Icon = theme.icon;

  const handleClick = () => {
    if (compact) {
      onSelect();
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      onClick={handleClick}
      className={`
        relative overflow-hidden rounded-2xl
        border-2 transition-all duration-200
        cursor-pointer group
        ${isSelected
          ? `${theme.border} shadow-lg`
          : 'border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-md'
        }
        bg-white
      `}
    >
      {/* Theme accent bar */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${theme.gradient}`}
      />

      {/* Main content */}
      <div className={compact ? 'p-3 pl-4' : 'p-4 pl-5'}>
        <div className="flex items-start gap-3">
          {/* Theme icon */}
          <div
            className={`
              flex items-center justify-center
              ${compact ? 'w-10 h-10' : 'w-12 h-12'}
              rounded-xl ${theme.bg}
            `}
          >
            <Icon className={`${compact ? 'w-5 h-5' : 'w-6 h-6'} ${theme.color}`} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className={`font-semibold text-gray-900 ${compact ? 'text-sm' : ''}`}>
                {cluster.name}
              </h4>
              {!compact && (
                <span
                  className={`
                    px-2 py-0.5 rounded-full text-xs font-medium
                    ${theme.bg} ${theme.color}
                  `}
                >
                  {theme.label}
                </span>
              )}
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-3 mt-1.5">
              <span className="flex items-center gap-1 text-sm text-gray-500">
                <MapPin className="w-3.5 h-3.5" />
                {cluster.places?.length || 0} places
              </span>
              <span className="flex items-center gap-1 text-sm text-gray-500">
                <Footprints className="w-3.5 h-3.5" />
                {cluster.walkingMinutes} min walk
              </span>
              {cluster.bestFor && (
                <span className="flex items-center gap-1 text-sm text-emerald-600">
                  <Clock className="w-3.5 h-3.5" />
                  {cluster.bestFor}
                </span>
              )}
            </div>
          </div>

          {/* Expand indicator */}
          {!compact && cluster.places && cluster.places.length > 0 && (
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-gray-400"
            >
              <ChevronRight className="w-5 h-5" />
            </motion.div>
          )}
        </div>

        {/* Expanded places list */}
        <AnimatePresence>
          {!compact && isExpanded && cluster.places && cluster.places.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 pt-4 border-t border-gray-100"
            >
              <div className="space-y-2">
                {cluster.places.map((place, idx) => (
                  <PlaceItem key={place.id || idx} place={place} index={idx} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// =============================================================================
// Place Item
// =============================================================================

interface PlaceItemProps {
  place: ClusterPlace;
  index: number;
}

function PlaceItem({ place, index }: PlaceItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors"
    >
      {/* Photo or placeholder */}
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
        {place.photoUrl ? (
          <img
            src={place.photoUrl}
            alt={place.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin className="w-5 h-5 text-gray-300" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 text-sm truncate">
          {place.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-500 capitalize">
            {place.type}
          </span>
          {place.rating && (
            <span className="flex items-center gap-0.5 text-xs text-amber-600">
              <Star className="w-3 h-3 fill-current" />
              {place.rating.toFixed(1)}
            </span>
          )}
          {place.priceLevel && (
            <span className="text-xs text-gray-400">
              {'€'.repeat(place.priceLevel)}
            </span>
          )}
        </div>
      </div>

      {/* Action hint */}
      <Camera className="w-4 h-4 text-gray-300 flex-shrink-0" />
    </motion.div>
  );
}

// =============================================================================
// Mini Cluster Pills (for compact inline display)
// =============================================================================

interface ClusterPillsProps {
  clusters: Cluster[];
  maxShow?: number;
}

export function ClusterPills({ clusters, maxShow = 3 }: ClusterPillsProps) {
  const visibleClusters = clusters.slice(0, maxShow);
  const remaining = clusters.length - maxShow;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {visibleClusters.map((cluster) => {
        const theme = THEME_CONFIG[cluster.theme as keyof typeof THEME_CONFIG] || THEME_CONFIG.mixed;
        const Icon = theme.icon;

        return (
          <span
            key={cluster.id}
            className={`
              inline-flex items-center gap-1
              px-2 py-1 rounded-lg
              text-xs font-medium
              ${theme.bg} ${theme.color}
            `}
          >
            <Icon className="w-3 h-3" />
            {cluster.name}
          </span>
        );
      })}
      {remaining > 0 && (
        <span className="text-xs text-gray-400">
          +{remaining} more
        </span>
      )}
    </div>
  );
}

// =============================================================================
// Map Marker Data Helper
// =============================================================================

/**
 * Generate map marker data from clusters for map overlay
 */
export function getClusterMarkers(clusters: Cluster[]) {
  return clusters.map((cluster) => {
    const theme = THEME_CONFIG[cluster.theme as keyof typeof THEME_CONFIG] || THEME_CONFIG.mixed;

    return {
      id: cluster.id,
      position: cluster.centerPoint,
      label: cluster.name,
      theme: cluster.theme,
      color: theme.gradient,
      places: cluster.places?.map((p) => ({
        id: p.id,
        position: p.coordinates,
        name: p.name,
        type: p.type,
      })) || [],
    };
  });
}

export default ClusterVisualization;

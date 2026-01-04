/**
 * PlanningMap
 *
 * Integrated map view for Planning Mode.
 * Shows all planned activities for the current day with visual connections.
 *
 * Features:
 * - Color-coded markers by slot (morning/afternoon/evening/night)
 * - Route lines connecting activities
 * - Click-to-add functionality
 * - Sync with day/slot selection
 * - City center reference
 */

import { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Plus,
  X,
  Layers,
  ZoomIn,
  ZoomOut,
  Crosshair,
} from 'lucide-react';
import { usePlanningStore } from '../../stores/planningStore';
import { CATEGORY_ICONS } from '../../utils/planningEnrichment';
import type { Slot, PlannedItem } from '../../types/planning';

// ============================================================================
// Slot Colors for Markers
// ============================================================================

const SLOT_MARKER_COLORS: Record<Slot, {
  bg: string;
  border: string;
  text: string;
  glow: string;
}> = {
  morning: {
    bg: 'bg-amber-500',
    border: 'border-amber-600',
    text: 'text-white',
    glow: 'shadow-amber-500/40',
  },
  afternoon: {
    bg: 'bg-orange-500',
    border: 'border-orange-600',
    text: 'text-white',
    glow: 'shadow-orange-500/40',
  },
  evening: {
    bg: 'bg-rose-500',
    border: 'border-rose-600',
    text: 'text-white',
    glow: 'shadow-rose-500/40',
  },
  night: {
    bg: 'bg-indigo-500',
    border: 'border-indigo-600',
    text: 'text-white',
    glow: 'shadow-indigo-500/40',
  },
};

const SLOT_LINE_COLORS: Record<Slot, string> = {
  morning: '#f59e0b',
  afternoon: '#f97316',
  evening: '#f43f5e',
  night: '#6366f1',
};

// ============================================================================
// Map Placeholder (for when actual map library isn't available)
// ============================================================================

export function PlanningMap() {
  const {
    tripPlan,
    currentDayIndex,
    getDayItems,
    getCurrentDay,
    openAddPanel,
  } = usePlanningStore();

  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [showLegend, setShowLegend] = useState(true);

  const currentDay = getCurrentDay();
  const dayItems = getDayItems(currentDayIndex);

  // Group items by slot for rendering
  const itemsBySlot = useMemo(() => {
    if (!currentDay) return {};

    return {
      morning: currentDay.slots.morning,
      afternoon: currentDay.slots.afternoon,
      evening: currentDay.slots.evening,
      night: currentDay.slots.night,
    };
  }, [currentDay]);

  // Calculate bounds for map viewport (for future map library integration)
  const _bounds = useMemo(() => {
    if (!currentDay || dayItems.length === 0) {
      return {
        center: currentDay?.city.coordinates || { lat: 0, lng: 0 },
        zoom: 13,
      };
    }

    const lats = dayItems.map((i) => i.place.geometry.location.lat);
    const lngs = dayItems.map((i) => i.place.geometry.location.lng);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    return {
      center: {
        lat: (minLat + maxLat) / 2,
        lng: (minLng + maxLng) / 2,
      },
      zoom: calculateZoom(maxLat - minLat, maxLng - minLng),
    };
  }, [currentDay, dayItems]);
  void _bounds; // Suppress unused variable warning - for future map integration

  // Handle marker click
  const handleMarkerClick = useCallback((itemId: string) => {
    setSelectedMarker(selectedMarker === itemId ? null : itemId);
  }, [selectedMarker]);

  if (!tripPlan || !currentDay) {
    return (
      <div className="h-full flex items-center justify-center bg-rui-grey-5">
        <p className="text-body-2 text-rui-grey-50">No day selected</p>
      </div>
    );
  }

  return (
    <div className="relative h-full bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
      {/* Map Background Pattern */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            radial-gradient(circle at 25% 25%, rgba(196, 88, 48, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(74, 144, 164, 0.05) 0%, transparent 50%)
          `,
        }}
      />

      {/* Grid Pattern (simulated map) */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* City Label */}
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-rui-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-rui-2 border border-rui-grey-10">
          <p className="text-body-3 text-rui-grey-50">Planning in</p>
          <p className="font-display text-lg text-rui-black">{currentDay.city.name}</p>
        </div>
      </div>

      {/* Slot Legend */}
      <AnimatePresence>
        {showLegend && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-4 right-4 z-10"
          >
            <div className="bg-rui-white/90 backdrop-blur-sm rounded-xl p-3 shadow-rui-2 border border-rui-grey-10">
              <div className="flex items-center justify-between mb-2">
                <p className="text-body-3 text-rui-grey-50">Legend</p>
                <button
                  onClick={() => setShowLegend(false)}
                  className="p-1 rounded hover:bg-rui-grey-10 transition-colors"
                >
                  <X className="w-3 h-3 text-rui-grey-40" />
                </button>
              </div>
              <div className="space-y-1.5">
                {(['morning', 'afternoon', 'evening', 'night'] as Slot[]).map((slot) => (
                  <div key={slot} className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${SLOT_MARKER_COLORS[slot].bg}`}
                    />
                    <span className="text-body-3 text-rui-grey-60 capitalize">{slot}</span>
                    <span className="text-body-3 text-rui-grey-40">
                      ({itemsBySlot[slot]?.length || 0})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map Controls */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
        <button className="w-10 h-10 bg-rui-white rounded-xl shadow-rui-2 flex items-center justify-center text-rui-grey-60 hover:text-rui-black transition-colors">
          <ZoomIn className="w-4 h-4" />
        </button>
        <button className="w-10 h-10 bg-rui-white rounded-xl shadow-rui-2 flex items-center justify-center text-rui-grey-60 hover:text-rui-black transition-colors">
          <ZoomOut className="w-4 h-4" />
        </button>
        <button className="w-10 h-10 bg-rui-white rounded-xl shadow-rui-2 flex items-center justify-center text-rui-grey-60 hover:text-rui-black transition-colors">
          <Crosshair className="w-4 h-4" />
        </button>
        {!showLegend && (
          <button
            onClick={() => setShowLegend(true)}
            className="w-10 h-10 bg-rui-white rounded-xl shadow-rui-2 flex items-center justify-center text-rui-grey-60 hover:text-rui-black transition-colors"
          >
            <Layers className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* SVG Route Lines (simulated positions) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {dayItems.length > 1 && dayItems.map((item, index) => {
          if (index === 0) return null;
          const prev = dayItems[index - 1];
          const fromPos = getSimulatedPosition(prev, index - 1, dayItems.length);
          const toPos = getSimulatedPosition(item, index, dayItems.length);

          return (
            <motion.line
              key={`line-${item.id}`}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.6 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              x1={`${fromPos.x}%`}
              y1={`${fromPos.y}%`}
              x2={`${toPos.x}%`}
              y2={`${toPos.y}%`}
              stroke={SLOT_LINE_COLORS[item.slot]}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="8 4"
            />
          );
        })}
      </svg>

      {/* Markers */}
      <div className="absolute inset-0">
        {dayItems.map((item, index) => (
          <MapMarker
            key={item.id}
            item={item}
            index={index}
            total={dayItems.length}
            isSelected={selectedMarker === item.id}
            onClick={() => handleMarkerClick(item.id)}
          />
        ))}

        {/* City Center Marker */}
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2"
          style={{ left: '50%', top: '50%' }}
        >
          <div className="w-3 h-3 rounded-full bg-rui-grey-30 border-2 border-white shadow-sm" />
        </div>
      </div>

      {/* Empty State / Add Prompt */}
      {dayItems.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rui-grey-10 flex items-center justify-center">
              <MapPin className="w-8 h-8 text-rui-grey-40" />
            </div>
            <p className="text-body-1 text-rui-grey-60 mb-2">
              Your map is empty
            </p>
            <p className="text-body-2 text-rui-grey-50 mb-4">
              Add activities to see them on the map
            </p>
            <button
              onClick={() => openAddPanel('morning')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-rui-accent text-white rounded-xl hover:bg-rui-accent/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add your first stop
            </button>
          </div>
        </div>
      )}

      {/* Selected Marker Popup */}
      <AnimatePresence>
        {selectedMarker && (
          <MarkerPopup
            item={dayItems.find((i) => i.id === selectedMarker)!}
            onClose={() => setSelectedMarker(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Map Marker Component
// ============================================================================

interface MapMarkerProps {
  item: PlannedItem;
  index: number;
  total: number;
  isSelected: boolean;
  onClick: () => void;
}

function MapMarker({ item, index, total, isSelected, onClick }: MapMarkerProps) {
  const colors = SLOT_MARKER_COLORS[item.slot];
  const position = getSimulatedPosition(item, index, total);
  const icon = CATEGORY_ICONS[item.place.category] || '📍';

  return (
    <motion.button
      initial={{ scale: 0, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 20 }}
      onClick={onClick}
      className="absolute transform -translate-x-1/2 -translate-y-full group"
      style={{ left: `${position.x}%`, top: `${position.y}%` }}
    >
      {/* Marker Pin */}
      <div
        className={`
          relative flex flex-col items-center
          ${isSelected ? 'z-20' : 'z-10'}
        `}
      >
        {/* Pin Body */}
        <div
          className={`
            flex items-center justify-center
            w-10 h-10 rounded-xl
            ${colors.bg} ${colors.text}
            border-2 ${colors.border}
            shadow-lg ${isSelected ? colors.glow : ''}
            transition-all duration-200
            group-hover:scale-110
          `}
        >
          <span className="text-lg">{icon}</span>
        </div>

        {/* Pin Point */}
        <div
          className={`
            w-0 h-0 -mt-0.5
            border-l-[8px] border-l-transparent
            border-r-[8px] border-r-transparent
            border-t-[10px] ${colors.border.replace('border', 'border-t')}
          `}
          style={{ borderTopColor: colors.bg.includes('amber') ? '#f59e0b' :
                   colors.bg.includes('orange') ? '#f97316' :
                   colors.bg.includes('rose') ? '#f43f5e' : '#6366f1' }}
        />

        {/* Order Badge */}
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rui-white shadow-sm border border-rui-grey-20 flex items-center justify-center">
          <span className="text-[10px] font-bold text-rui-grey-70">{index + 1}</span>
        </div>

        {/* Pulse Animation for Selected */}
        {isSelected && (
          <motion.div
            animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
            className={`absolute inset-0 rounded-xl ${colors.bg} -z-10`}
          />
        )}
      </div>

      {/* Name Label on Hover */}
      <div
        className={`
          absolute left-1/2 -translate-x-1/2 -bottom-8
          px-2 py-1 bg-rui-black/80 text-white text-body-3 rounded-lg
          whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity
          pointer-events-none
        `}
      >
        {item.place.name}
      </div>
    </motion.button>
  );
}

// ============================================================================
// Marker Popup
// ============================================================================

interface MarkerPopupProps {
  item: PlannedItem;
  onClose: () => void;
}

function MarkerPopup({ item, onClose }: MarkerPopupProps) {
  const { place, slot } = item;
  const colors = SLOT_MARKER_COLORS[slot];
  const icon = CATEGORY_ICONS[place.category] || '📍';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="absolute bottom-4 left-4 right-4 z-30"
    >
      <div className="bg-rui-white rounded-xl shadow-rui-4 border border-rui-grey-10 overflow-hidden">
        <div className={`h-1 ${colors.bg}`} />
        <div className="p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">{icon}</span>
            <div className="flex-1 min-w-0">
              <h4 className="font-display text-base text-rui-black font-medium truncate">
                {place.name}
              </h4>
              <p className="text-body-3 text-rui-grey-50 capitalize">
                {slot} · ~{place.estimated_duration_mins} min
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-rui-grey-40 hover:bg-rui-grey-5 hover:text-rui-grey-60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {place.rating && (
            <div className="mt-3 flex items-center gap-4 text-body-3">
              <span className="flex items-center gap-1">
                <span className="text-amber-500">★</span>
                {place.rating.toFixed(1)}
              </span>
              {place.is_hidden_gem && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[11px] font-medium">
                  Hidden Gem
                </span>
              )}
            </div>
          )}

          {item.user_notes && (
            <p className="mt-2 text-body-3 text-rui-grey-60 italic">
              "{item.user_notes}"
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

// Simulate marker positions in a spread pattern (would be real coords in production)
function getSimulatedPosition(_item: PlannedItem, index: number, total: number): { x: number; y: number } {
  // Create a spiral/spread pattern around center
  // _item would be used for actual coordinates in production
  const angle = (index / Math.max(total, 1)) * Math.PI * 2 - Math.PI / 2;
  const radius = 15 + (index % 3) * 8;

  return {
    x: 50 + Math.cos(angle) * radius,
    y: 50 + Math.sin(angle) * radius,
  };
}

// Calculate appropriate zoom level based on bounds
function calculateZoom(latDiff: number, lngDiff: number): number {
  const maxDiff = Math.max(latDiff, lngDiff);
  if (maxDiff > 0.5) return 10;
  if (maxDiff > 0.2) return 12;
  if (maxDiff > 0.1) return 13;
  if (maxDiff > 0.05) return 14;
  return 15;
}

export default PlanningMap;

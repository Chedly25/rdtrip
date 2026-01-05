/**
 * PlanningMap - Premium Vintage Travel Map Edition
 *
 * A beautiful, vintage-inspired map that feels like a cartographer's masterpiece.
 * Warm parchment tones, elegant markers, and refined details.
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
  Compass,
} from 'lucide-react';
import { usePlanningStore } from '../../stores/planningStore';
import { CATEGORY_ICONS } from '../../utils/planningEnrichment';
import type { Slot, PlannedItem } from '../../types/planning';

// ============================================================================
// Slot Colors for Markers - Vintage Travel Palette
// ============================================================================

const SLOT_MARKER_COLORS: Record<Slot, {
  bg: string;
  border: string;
  text: string;
  glow: string;
  line: string;
}> = {
  morning: {
    bg: 'bg-gradient-to-br from-amber-500 to-orange-500',
    border: 'border-amber-700',
    text: 'text-white',
    glow: 'shadow-amber-500/40',
    line: '#f59e0b',
  },
  afternoon: {
    bg: 'bg-gradient-to-br from-orange-500 to-rose-500',
    border: 'border-orange-700',
    text: 'text-white',
    glow: 'shadow-orange-500/40',
    line: '#f97316',
  },
  evening: {
    bg: 'bg-gradient-to-br from-rose-500 to-pink-600',
    border: 'border-rose-700',
    text: 'text-white',
    glow: 'shadow-rose-500/40',
    line: '#f43f5e',
  },
  night: {
    bg: 'bg-gradient-to-br from-indigo-500 to-purple-600',
    border: 'border-indigo-700',
    text: 'text-white',
    glow: 'shadow-indigo-500/40',
    line: '#6366f1',
  },
};

// ============================================================================
// Map Component
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

  // Group items by slot
  const itemsBySlot = useMemo(() => {
    if (!currentDay) return {};

    return {
      morning: currentDay.slots.morning,
      afternoon: currentDay.slots.afternoon,
      evening: currentDay.slots.evening,
      night: currentDay.slots.night,
    };
  }, [currentDay]);

  const handleMarkerClick = useCallback((itemId: string) => {
    setSelectedMarker(selectedMarker === itemId ? null : itemId);
  }, [selectedMarker]);

  if (!tripPlan || !currentDay) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-[#F5EFE0] to-[#E8DCC5]">
        <p className="text-body-1 text-rui-grey-60 font-medium">No day selected</p>
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-hidden bg-gradient-to-br from-[#F5EFE0] via-[#EDE4D3] to-[#E8DCC5]">
      {/* Vintage Paper Texture */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuOSIgbnVtT2N0YXZlcz0iNCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNub2lzZSkiIG9wYWNpdHk9IjAuNSIvPjwvc3ZnPg==')]" />

      {/* Vintage Map Grid */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
        <defs>
          <pattern id="map-grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path
              d="M 60 0 L 0 0 0 60"
              fill="none"
              stroke="#8B7355"
              strokeWidth="0.5"
              opacity="0.3"
            />
          </pattern>
          <pattern id="map-dots" width="30" height="30" patternUnits="userSpaceOnUse">
            <circle cx="15" cy="15" r="1" fill="#8B7355" opacity="0.15" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#map-grid)" />
        <rect width="100%" height="100%" fill="url(#map-dots)" />
      </svg>

      {/* Decorative Compass Rose */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-5"
        animate={{ rotate: 360 }}
        transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
      >
        <Compass className="w-64 h-64 text-rui-accent" strokeWidth={0.5} />
      </motion.div>

      {/* Decorative Border */}
      <div className="absolute inset-0 pointer-events-none border-8 border-double border-[#C4A57B]/20" />

      {/* City Label - Vintage Style */}
      <motion.div
        className="absolute top-6 left-6 z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="relative bg-gradient-to-br from-rui-white/95 to-rui-cream/95 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-rui-3 border-2 border-rui-accent/30">
          {/* Decorative corner */}
          <div className="absolute -top-2 -left-2 w-6 h-6">
            <svg viewBox="0 0 24 24" className="text-rui-accent/30" fill="currentColor">
              <path d="M0 0 L24 0 L0 24 Z" />
            </svg>
          </div>

          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-rui-accent" />
            <span className="text-[10px] uppercase tracking-widest text-rui-grey-50 font-semibold">
              Planning in
            </span>
          </div>
          <p className="font-display text-2xl text-rui-black font-semibold tracking-tight">
            {currentDay.city.name}
          </p>
        </div>
      </motion.div>

      {/* Slot Legend - Vintage Card Style */}
      <AnimatePresence>
        {showLegend && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-6 right-6 z-10"
          >
            <div className="relative bg-gradient-to-br from-rui-white/95 to-rui-cream/95 backdrop-blur-sm rounded-2xl p-4 shadow-rui-3 border-2 border-rui-accent/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-rui-accent" />
                  <span className="font-display text-base text-rui-black font-semibold">
                    Timeline
                  </span>
                </div>
                <button
                  onClick={() => setShowLegend(false)}
                  className="p-1 rounded-lg hover:bg-rui-grey-10 transition-colors"
                >
                  <X className="w-4 h-4 text-rui-grey-50" />
                </button>
              </div>
              <div className="space-y-2">
                {(['morning', 'afternoon', 'evening', 'night'] as Slot[]).map((slot) => (
                  <div key={slot} className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${SLOT_MARKER_COLORS[slot].bg} shadow-md`} />
                    <span className="text-body-2 text-rui-grey-70 font-medium capitalize flex-1">
                      {slot}
                    </span>
                    <span className="text-body-3 text-rui-grey-50 font-semibold bg-rui-grey-5 px-2 py-0.5 rounded-md">
                      {itemsBySlot[slot]?.length || 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map Controls - Vintage Brass Style */}
      <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-2">
        <motion.button
          className="w-12 h-12 bg-gradient-to-br from-[#D4A574] to-[#C4A57B] rounded-xl shadow-rui-3 flex items-center justify-center text-rui-white border-2 border-[#B8975E] hover:shadow-rui-4 transition-all"
          whileHover={{ scale: 1.05, rotate: 90 }}
          whileTap={{ scale: 0.95 }}
        >
          <ZoomIn className="w-5 h-5" strokeWidth={2.5} />
        </motion.button>
        <motion.button
          className="w-12 h-12 bg-gradient-to-br from-[#D4A574] to-[#C4A57B] rounded-xl shadow-rui-3 flex items-center justify-center text-rui-white border-2 border-[#B8975E] hover:shadow-rui-4 transition-all"
          whileHover={{ scale: 1.05, rotate: -90 }}
          whileTap={{ scale: 0.95 }}
        >
          <ZoomOut className="w-5 h-5" strokeWidth={2.5} />
        </motion.button>
        <motion.button
          className="w-12 h-12 bg-gradient-to-br from-[#D4A574] to-[#C4A57B] rounded-xl shadow-rui-3 flex items-center justify-center text-rui-white border-2 border-[#B8975E] hover:shadow-rui-4 transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Crosshair className="w-5 h-5" strokeWidth={2.5} />
        </motion.button>
        {!showLegend && (
          <motion.button
            onClick={() => setShowLegend(true)}
            className="w-12 h-12 bg-gradient-to-br from-[#D4A574] to-[#C4A57B] rounded-xl shadow-rui-3 flex items-center justify-center text-rui-white border-2 border-[#B8975E] hover:shadow-rui-4 transition-all"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Layers className="w-5 h-5" strokeWidth={2.5} />
          </motion.button>
        )}
      </div>

      {/* SVG Route Lines */}
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
              animate={{ pathLength: 1, opacity: 0.4 }}
              transition={{ duration: 0.8, delay: index * 0.15, ease: 'easeOut' }}
              x1={`${fromPos.x}%`}
              y1={`${fromPos.y}%`}
              x2={`${toPos.x}%`}
              y2={`${toPos.y}%`}
              stroke={SLOT_MARKER_COLORS[item.slot].line}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="12 6"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
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

        {/* City Center Marker - Vintage Style */}
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2"
          style={{ left: '50%', top: '50%' }}
        >
          <div className="relative">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-[#8B7355] to-[#6B5A45] border-2 border-rui-white shadow-md" />
            <motion.div
              className="absolute inset-0 w-4 h-4 rounded-full bg-[#8B7355]/30"
              animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </div>
      </div>

      {/* Empty State */}
      {dayItems.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="text-center max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-rui-accent/10 to-rui-accent/5 border-2 border-rui-accent/20" />
              <MapPin className="absolute inset-0 m-auto w-12 h-12 text-rui-accent/60" />
            </div>
            <p className="font-display text-2xl text-rui-black mb-2">
              Your map awaits
            </p>
            <p className="text-body-1 text-rui-grey-60 mb-6 leading-relaxed">
              Add activities to plot your journey across {currentDay.city.name}
            </p>
            <motion.button
              onClick={() => openAddPanel('morning')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rui-accent to-orange-500 text-white rounded-xl hover:shadow-lg transition-all font-semibold text-body-1 shadow-md border-2 border-rui-accent"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-5 h-5" strokeWidth={2.5} />
              Add your first stop
            </motion.button>
          </motion.div>
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
// Map Marker - Vintage Pin Style
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
      initial={{ scale: 0, y: 40 }}
      animate={{ scale: 1, y: 0 }}
      transition={{
        delay: index * 0.1,
        type: 'spring',
        stiffness: 300,
        damping: 20
      }}
      onClick={onClick}
      className="absolute transform -translate-x-1/2 -translate-y-full group"
      style={{ left: `${position.x}%`, top: `${position.y}%` }}
    >
      <div className={`relative flex flex-col items-center ${isSelected ? 'z-30' : 'z-10'}`}>
        {/* Pin Body - Vintage Rounded Rectangle */}
        <div className="relative">
          <motion.div
            className={`
              flex items-center justify-center
              w-14 h-14 rounded-2xl
              ${colors.bg}
              border-3 ${colors.border}
              shadow-xl ${isSelected ? colors.glow : ''}
              transition-all duration-300
            `}
            whileHover={{ scale: 1.15, rotate: 5 }}
            style={{
              boxShadow: `0 8px 20px rgba(0,0,0,0.2), 0 0 0 4px rgba(255,255,255,0.8)`,
            }}
          >
            <span className="text-2xl drop-shadow-md">{icon}</span>
          </motion.div>

          {/* Pin Shadow */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-3 bg-black/20 blur-md rounded-full" />
        </div>

        {/* Pin Stem */}
        <div
          className={`
            w-1.5 h-8 rounded-full
            ${colors.bg}
            ${colors.border}
            shadow-md
          `}
          style={{
            background: colors.line,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        />

        {/* Pin Point */}
        <div
          className="w-3 h-3 rounded-full -mt-1"
          style={{
            background: colors.line,
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
        />

        {/* Order Badge - Vintage Stamp Style */}
        <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br from-rui-white to-rui-grey-2 shadow-lg border-2 border-rui-accent/40 flex items-center justify-center">
          <span className="text-xs font-bold text-rui-black">{index + 1}</span>
        </div>

        {/* Pulse for Selected */}
        {isSelected && (
          <motion.div
            animate={{ scale: [1, 1.6], opacity: [0.8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute top-0 left-0 right-0 bottom-8 rounded-2xl"
            style={{
              background: colors.line,
              opacity: 0.3,
            }}
          />
        )}

        {/* Name Label on Hover */}
        <div
          className="
            absolute left-1/2 -translate-x-1/2 -bottom-12
            px-3 py-1.5 bg-rui-black/90 text-white text-body-3 rounded-lg
            whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity
            pointer-events-none shadow-lg font-medium
          "
        >
          {item.place.name}
        </div>
      </div>
    </motion.button>
  );
}

// ============================================================================
// Marker Popup - Vintage Card
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
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 40, scale: 0.9 }}
      className="absolute bottom-6 left-6 right-6 z-40"
    >
      <div className="bg-gradient-to-br from-rui-white to-rui-cream rounded-2xl shadow-rui-4 border-2 border-rui-accent/30 overflow-hidden">
        {/* Colored Top Bar */}
        <div className={`h-2 ${colors.bg}`} />

        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className={`flex items-center justify-center w-14 h-14 rounded-xl ${colors.bg} shadow-md`}>
              <span className="text-3xl">{icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-display text-xl text-rui-black font-semibold truncate leading-tight">
                {place.name}
              </h4>
              <p className="text-body-2 text-rui-grey-60 capitalize mt-1 font-medium">
                {slot} · ~{place.estimated_duration_mins} min
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-rui-grey-50 hover:bg-rui-grey-5 hover:text-rui-grey-70 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {place.rating && (
            <div className="mt-4 flex items-center gap-4 text-body-2">
              <span className="flex items-center gap-1.5 text-rui-grey-70 font-medium">
                <span className="text-amber-500 text-lg">★</span>
                {place.rating.toFixed(1)}
              </span>
              {place.is_hidden_gem && (
                <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[11px] font-semibold uppercase tracking-wide">
                  Hidden Gem
                </span>
              )}
            </div>
          )}

          {item.user_notes && (
            <p className="mt-3 text-body-2 text-rui-grey-70 italic leading-relaxed bg-rui-grey-2/50 p-3 rounded-xl">
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

function getSimulatedPosition(_item: PlannedItem, index: number, total: number): { x: number; y: number } {
  // Create an elegant spiral pattern
  const angle = (index / Math.max(total, 1)) * Math.PI * 2 - Math.PI / 2;
  const radius = 18 + (index % 4) * 7;

  return {
    x: 50 + Math.cos(angle) * radius,
    y: 50 + Math.sin(angle) * radius,
  };
}

export default PlanningMap;

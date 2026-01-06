/**
 * PlannedItemCard
 *
 * Activity card displayed within a slot.
 * Shows: Icon, Name, Meta info (price, duration, distance), notes, remove button
 *
 * Features:
 * - Draggable for reordering
 * - Hidden gem badge
 * - Lock indicator
 * - Subtle hover effects
 * - Context menu for actions
 */

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  GripVertical,
  Lock,
  Unlock,
  MoreHorizontal,
  Sparkles,
  Clock,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import { usePlanningStore } from '../../stores/planningStore';
import { formatPriceLevel, CATEGORY_ICONS } from '../../utils/planningEnrichment';
import type { PlannedItem } from '../../types/planning';

// ============================================================================
// Props
// ============================================================================

interface PlannedItemCardProps {
  item: PlannedItem;
  isDragging?: boolean;
  dragHandleProps?: Record<string, unknown>;
  showTravelIndicator?: boolean;
  travelMins?: number;
  travelKm?: number;
}

// ============================================================================
// Component
// ============================================================================

export function PlannedItemCard({
  item,
  isDragging = false,
  dragHandleProps,
  showTravelIndicator = false,
  travelMins,
  travelKm,
}: PlannedItemCardProps) {
  const { removeItem, toggleItemLock, updateItemNotes } = usePlanningStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(item.user_notes || '');
  const menuRef = useRef<HTMLDivElement>(null);

  const { place } = item;
  const categoryIcon = CATEGORY_ICONS[place.category] || '📍';
  const priceDisplay = formatPriceLevel(place.price_level);
  const durationDisplay = formatDuration(place.estimated_duration_mins);

  // Save notes
  const handleSaveNotes = () => {
    updateItemNotes(item.id, notesValue);
    setShowNotes(false);
  };

  return (
    <>
      {/* Travel Indicator */}
      {showTravelIndicator && travelMins !== undefined && (
        <TravelIndicator mins={travelMins} km={travelKm} />
      )}

      {/* Card */}
      <motion.div
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className={`
          relative group bg-white rounded-lg border
          transition-all duration-150
          ${isDragging
            ? 'border-teal-400 shadow-md'
            : 'border-slate-200 hover:border-slate-300'
          }
          ${item.is_locked ? 'bg-slate-50' : ''}
        `}
      >
        {/* Main Content */}
        <div className="flex items-start gap-3 p-3">
          {/* Drag Handle */}
          <div
            {...dragHandleProps}
            className={`
              flex-shrink-0 mt-0.5 cursor-grab active:cursor-grabbing
              text-slate-400 hover:text-slate-600
              transition-colors duration-150
              ${isDragging ? 'text-teal-500' : ''}
            `}
          >
            <GripVertical className="w-4 h-4" />
          </div>

          {/* Icon */}
          <div className="flex-shrink-0 text-xl" role="img" aria-label={place.category}>
            {categoryIcon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Name Row */}
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm text-slate-900 font-semibold truncate">
                {place.name}
              </h4>

              {/* Badges */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {place.is_hidden_gem && (
                  <span
                    className="flex items-center justify-center w-4 h-4 rounded bg-teal-100 text-teal-600"
                    title="Hidden Gem"
                  >
                    <Sparkles className="w-2.5 h-2.5" />
                  </span>
                )}
                {item.is_locked && (
                  <span
                    className="flex items-center justify-center w-4 h-4 rounded bg-slate-100 text-slate-600"
                    title="Locked in place"
                  >
                    <Lock className="w-2.5 h-2.5" />
                  </span>
                )}
                {item.added_by === 'ai' && (
                  <span
                    className="px-1.5 py-0.5 bg-blue-100 text-blue-600 text-[9px] font-medium rounded uppercase tracking-wide"
                    title="AI suggestion"
                  >
                    AI
                  </span>
                )}
              </div>
            </div>

            {/* Meta Row */}
            <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1 mt-1 text-xs text-slate-500">
              {priceDisplay && (
                <span className="font-medium text-slate-600">{priceDisplay}</span>
              )}
              {durationDisplay && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {durationDisplay}
                </span>
              )}
              {place.rating && (
                <span className="flex items-center gap-0.5">
                  <span className="text-amber-500">★</span>
                  {place.rating.toFixed(1)}
                </span>
              )}
              {place.vibe_tags.length > 0 && (
                <span className="text-slate-400">
                  {place.vibe_tags.slice(0, 2).join(' · ')}
                </span>
              )}
            </div>

            {/* User Notes */}
            {item.user_notes && (
              <p className="mt-1.5 text-xs text-slate-600 italic line-clamp-2">
                "{item.user_notes}"
              </p>
            )}

            {/* Tip from place */}
            {place.tip && (
              <p className="mt-2 text-body-3 text-rui-accent/80 italic">
                {place.tip}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex-shrink-0 flex items-center gap-1">
            {/* Menu Button */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="
                  p-1 rounded text-slate-400
                  hover:bg-slate-100 hover:text-slate-600
                  transition-all duration-150
                  opacity-0 group-hover:opacity-100 focus:opacity-100
                "
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-full mt-1 z-20 w-44 bg-white rounded-lg shadow-lg border border-slate-200 py-1"
                  >
                    <MenuButton
                      icon={<MessageSquare className="w-4 h-4" />}
                      label={item.user_notes ? 'Edit note' : 'Add note'}
                      onClick={() => {
                        setShowNotes(true);
                        setShowMenu(false);
                      }}
                    />
                    <MenuButton
                      icon={item.is_locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      label={item.is_locked ? 'Unlock' : 'Lock in place'}
                      onClick={() => {
                        toggleItemLock(item.id);
                        setShowMenu(false);
                      }}
                    />
                    {place.website && (
                      <MenuButton
                        icon={<ExternalLink className="w-4 h-4" />}
                        label="Visit website"
                        onClick={() => {
                          window.open(place.website, '_blank');
                          setShowMenu(false);
                        }}
                      />
                    )}
                    <div className="my-1 border-t border-rui-grey-10" />
                    <MenuButton
                      icon={<X className="w-4 h-4" />}
                      label="Remove"
                      variant="danger"
                      onClick={() => {
                        removeItem(item.id);
                        setShowMenu(false);
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Remove Button */}
            <button
              onClick={() => removeItem(item.id)}
              className={`
                p-1.5 rounded-lg text-rui-grey-40
                hover:bg-red-50 hover:text-red-500
                transition-all duration-150
                opacity-0 group-hover:opacity-100 focus:opacity-100
              `}
              aria-label="Remove item"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Notes Modal */}
      <AnimatePresence>
        {showNotes && (
          <NotesModal
            initialValue={notesValue}
            onChange={setNotesValue}
            onSave={handleSaveNotes}
            onCancel={() => setShowNotes(false)}
            placeName={place.name}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================================================
// Travel Indicator
// ============================================================================

interface TravelIndicatorProps {
  mins: number;
  km?: number;
}

export function TravelIndicator({ mins, km }: TravelIndicatorProps) {
  const mode = mins <= 15 ? 'walk' : 'drive';

  return (
    <div className="flex items-center justify-center py-1.5">
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <div className="w-px h-3 bg-slate-300" />
        <span className="flex items-center gap-1">
          <span className="text-sm">{mode === 'walk' ? '🚶' : '🚗'}</span>
          {mins} min
          {km !== undefined && <span className="text-slate-400">· {km.toFixed(1)} km</span>}
        </span>
        <div className="w-px h-3 bg-slate-300" />
      </div>
    </div>
  );
}

// ============================================================================
// Menu Button
// ============================================================================

interface MenuButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

function MenuButton({ icon, label, onClick, variant = 'default' }: MenuButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-2 px-3 py-2 text-sm text-left
        transition-colors duration-150
        ${variant === 'danger'
          ? 'text-red-600 hover:bg-red-50'
          : 'text-slate-700 hover:bg-slate-100'
        }
      `}
    >
      {icon}
      {label}
    </button>
  );
}

// ============================================================================
// Notes Modal
// ============================================================================

interface NotesModalProps {
  initialValue: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  placeName: string;
}

function NotesModal({ initialValue, onChange, onSave, onCancel, placeName }: NotesModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-rui-black/40 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-rui-white rounded-2xl shadow-rui-4 w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-xl text-rui-black mb-1">
          Add a note
        </h3>
        <p className="text-body-2 text-rui-grey-50 mb-4">
          For {placeName}
        </p>

        <textarea
          value={initialValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g., 'Get the anchovies' or 'Cash only'"
          className="w-full h-32 p-3 rounded-xl border border-rui-grey-20 bg-rui-grey-2 text-body-1 text-rui-black placeholder:text-rui-grey-40 resize-none focus:outline-none focus:ring-2 focus:ring-rui-accent/30 focus:border-rui-accent"
          autoFocus
          maxLength={500}
        />

        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-body-2 text-rui-grey-60 hover:text-rui-black transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 bg-rui-accent text-white rounded-lg text-body-2 font-medium hover:bg-rui-accent/90 transition-colors"
          >
            Save
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function formatDuration(mins: number): string {
  if (mins < 60) return `~${mins} min`;
  const hours = Math.floor(mins / 60);
  const remainder = mins % 60;
  if (remainder === 0) return `~${hours} hr`;
  return `~${hours}h ${remainder}m`;
}

export default PlannedItemCard;

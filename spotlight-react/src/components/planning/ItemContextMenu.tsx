/**
 * ItemContextMenu
 *
 * Context menu for planned items with quick actions.
 * Triggered by right-click (desktop) or long-press (mobile).
 *
 * Design: Warm Editorial - clean, floating menu with subtle animations.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MoveVertical,
  Copy,
  Lock,
  Unlock,
  MessageSquare,
  Trash2,
  ChevronRight,
  Calendar,
  Coffee,
  Sun,
  Sunset,
  Moon,
  AlertTriangle,
} from 'lucide-react';
import { usePlanningStore } from '../../stores/planningStore';
import type { PlannedItem, Slot } from '../../types/planning';

// ============================================================================
// Types
// ============================================================================

interface Position {
  x: number;
  y: number;
}

interface ItemContextMenuProps {
  item: PlannedItem;
  position: Position;
  isOpen: boolean;
  onClose: () => void;
  onOpenMoveModal?: (item: PlannedItem) => void;
}

// ============================================================================
// Slot Configuration
// ============================================================================

const SLOT_CONFIG: Record<Slot, { label: string; icon: React.ReactNode; color: string }> = {
  morning: { label: 'Morning', icon: <Coffee className="w-3.5 h-3.5" />, color: 'text-amber-600' },
  afternoon: { label: 'Afternoon', icon: <Sun className="w-3.5 h-3.5" />, color: 'text-orange-600' },
  evening: { label: 'Evening', icon: <Sunset className="w-3.5 h-3.5" />, color: 'text-rose-600' },
  night: { label: 'Night', icon: <Moon className="w-3.5 h-3.5" />, color: 'text-indigo-600' },
};

// ============================================================================
// Main Component
// ============================================================================

export function ItemContextMenu({
  item,
  position,
  isOpen,
  onClose,
  onOpenMoveModal,
}: ItemContextMenuProps) {
  const { tripPlan, removeItem, addItem, updateItemNotes, toggleItemLock } = usePlanningStore();

  const menuRef = useRef<HTMLDivElement>(null);
  const [showMoveSubmenu, setShowMoveSubmenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState(item.user_notes || '');
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  // Adjust menu position to stay within viewport
  useEffect(() => {
    if (isOpen && menuRef.current) {
      const menu = menuRef.current;
      const menuRect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let x = position.x;
      let y = position.y;

      // Adjust horizontal position
      if (x + menuRect.width > viewportWidth - 16) {
        x = viewportWidth - menuRect.width - 16;
      }

      // Adjust vertical position
      if (y + menuRect.height > viewportHeight - 16) {
        y = viewportHeight - menuRect.height - 16;
      }

      setAdjustedPosition({ x: Math.max(16, x), y: Math.max(16, y) });
    }
  }, [isOpen, position]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      // Delay to avoid immediate close from the opening click
      setTimeout(() => {
        window.addEventListener('click', handleClickOutside);
      }, 100);
      return () => window.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen, onClose]);

  // Handle lock toggle
  const handleToggleLock = useCallback(() => {
    toggleItemLock(item.id);
    onClose();
  }, [item.id, toggleItemLock, onClose]);

  // Handle duplicate
  const handleDuplicate = useCallback((targetDay: number, targetSlot: Slot) => {
    addItem(item.place, targetDay, targetSlot);
    onClose();
  }, [item.place, addItem, onClose]);

  // Handle delete
  const handleDelete = useCallback(() => {
    removeItem(item.id);
    onClose();
  }, [item.id, removeItem, onClose]);

  // Handle save note
  const handleSaveNote = useCallback(() => {
    updateItemNotes(item.id, noteText.trim());
    setShowNoteInput(false);
  }, [item.id, noteText, updateItemNotes]);

  // Handle move to different day
  const handleMoveClick = useCallback(() => {
    if (onOpenMoveModal) {
      onOpenMoveModal(item);
      onClose();
    }
  }, [item, onOpenMoveModal, onClose]);

  const totalDays = tripPlan?.days.length || 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop (subtle, just for click detection) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            onClick={onClose}
          />

          {/* Menu */}
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            style={{
              position: 'fixed',
              left: adjustedPosition.x,
              top: adjustedPosition.y,
            }}
            className="z-50 w-56 bg-white rounded-xl shadow-rui-4 border border-rui-grey-10 overflow-hidden"
          >
            {/* Header with item name */}
            <div className="px-3 py-2 bg-rui-grey-5 border-b border-rui-grey-10">
              <p className="text-body-3 text-rui-grey-50 truncate">{item.place.name}</p>
            </div>

            {/* Menu items */}
            <div className="py-1">
              {/* Move to different day */}
              <MenuItem
                icon={<MoveVertical className="w-4 h-4" />}
                label="Move to another day"
                onClick={handleMoveClick}
                hasSubmenu
              />

              {/* Duplicate */}
              <div
                className="relative"
                onMouseEnter={() => setShowMoveSubmenu(true)}
                onMouseLeave={() => setShowMoveSubmenu(false)}
              >
                <MenuItem
                  icon={<Copy className="w-4 h-4" />}
                  label="Duplicate to..."
                  hasSubmenu
                />

                {/* Duplicate submenu */}
                <AnimatePresence>
                  {showMoveSubmenu && (
                    <motion.div
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -5 }}
                      className="absolute left-full top-0 ml-1 w-48 bg-white rounded-xl shadow-rui-3 border border-rui-grey-10 py-1 z-10"
                    >
                      {Array.from({ length: totalDays }, (_, i) => (
                        <div key={i}>
                          <div className="px-3 py-1.5 text-body-3 text-rui-grey-50 font-medium bg-rui-grey-5">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5" />
                              Day {i + 1}
                            </div>
                          </div>
                          {(['morning', 'afternoon', 'evening', 'night'] as Slot[]).map((slot) => (
                            <button
                              key={slot}
                              onClick={() => handleDuplicate(i, slot)}
                              className="w-full flex items-center gap-2 px-4 py-1.5 text-body-3 text-rui-grey-70 hover:bg-rui-grey-5 transition-colors"
                            >
                              <span className={SLOT_CONFIG[slot].color}>
                                {SLOT_CONFIG[slot].icon}
                              </span>
                              {SLOT_CONFIG[slot].label}
                            </button>
                          ))}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="h-px bg-rui-grey-10 my-1" />

              {/* Lock/Unlock */}
              <MenuItem
                icon={item.is_locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                label={item.is_locked ? 'Unlock position' : 'Lock position'}
                onClick={handleToggleLock}
                description={item.is_locked ? 'Allow auto-optimization' : 'Prevent auto-optimization'}
              />

              {/* Add/Edit note */}
              <MenuItem
                icon={<MessageSquare className="w-4 h-4" />}
                label={item.user_notes ? 'Edit note' : 'Add note'}
                onClick={() => setShowNoteInput(true)}
              />

              <div className="h-px bg-rui-grey-10 my-1" />

              {/* Remove */}
              {!showDeleteConfirm ? (
                <MenuItem
                  icon={<Trash2 className="w-4 h-4" />}
                  label="Remove"
                  onClick={() => setShowDeleteConfirm(true)}
                  danger
                />
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-2 py-2"
                >
                  <div className="flex items-center gap-2 px-2 py-2 bg-rose-50 rounded-lg border border-rose-200">
                    <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                    <span className="text-body-3 text-rose-700 flex-1">Remove?</span>
                    <button
                      onClick={handleDelete}
                      className="px-2 py-1 rounded-md bg-rose-500 text-white text-body-3 font-medium hover:bg-rose-600"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-2 py-1 rounded-md text-rose-600 text-body-3 hover:bg-rose-100"
                    >
                      No
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Note input */}
            <AnimatePresence>
              {showNoteInput && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-rui-grey-10 overflow-hidden"
                >
                  <div className="p-3">
                    <textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Add a personal note..."
                      className="w-full h-20 px-3 py-2 rounded-lg border border-rui-grey-20 text-body-3 placeholder:text-rui-grey-40 focus:outline-none focus:border-rui-accent resize-none"
                      autoFocus
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => setShowNoteInput(false)}
                        className="px-3 py-1.5 rounded-lg text-body-3 text-rui-grey-60 hover:bg-rui-grey-10"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveNote}
                        className="px-3 py-1.5 rounded-lg text-body-3 font-medium bg-rui-accent text-white hover:bg-rui-accent/90"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// Menu Item
// ============================================================================

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  description?: string;
  hasSubmenu?: boolean;
  danger?: boolean;
}

function MenuItem({
  icon,
  label,
  onClick,
  description,
  hasSubmenu = false,
  danger = false,
}: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2 transition-colors
        ${danger
          ? 'text-rose-600 hover:bg-rose-50'
          : 'text-rui-grey-70 hover:bg-rui-grey-5'
        }
      `}
    >
      <span className={danger ? 'text-rose-500' : 'text-rui-grey-40'}>{icon}</span>
      <div className="flex-1 text-left">
        <p className="text-body-2">{label}</p>
        {description && (
          <p className="text-body-3 text-rui-grey-50">{description}</p>
        )}
      </div>
      {hasSubmenu && (
        <ChevronRight className="w-4 h-4 text-rui-grey-30" />
      )}
    </button>
  );
}

// ============================================================================
// Context Menu Hook
// ============================================================================

interface UseContextMenuResult {
  contextMenu: {
    isOpen: boolean;
    position: Position;
    item: PlannedItem | null;
  };
  openContextMenu: (e: React.MouseEvent, item: PlannedItem) => void;
  closeContextMenu: () => void;
}

export function useItemContextMenu(): UseContextMenuResult {
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: Position;
    item: PlannedItem | null;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    item: null,
  });

  const openContextMenu = useCallback((e: React.MouseEvent, item: PlannedItem) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      item,
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return {
    contextMenu,
    openContextMenu,
    closeContextMenu,
  };
}

// ============================================================================
// Export
// ============================================================================

export default ItemContextMenu;

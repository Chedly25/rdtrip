/**
 * QuickActionsBar
 *
 * Floating action bar for common planning operations.
 * Elegant, minimal, and context-aware.
 *
 * Design: Warm Editorial - frosted glass effect with terracotta accents.
 * Appears at bottom of screen, dismissible but persistent.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Undo2,
  Redo2,
  Download,
  ChevronLeft,
  ChevronRight,
  WifiOff,
  Check,
  Keyboard,
  X,
  Calendar,
} from 'lucide-react';
import { usePlanningStore } from '../../stores/planningStore';

// ============================================================================
// Props Interface
// ============================================================================

interface QuickActionsBarProps {
  onExportClick: () => void;
  pendingChangesCount?: number;
  isOffline?: boolean;
  className?: string;
}

// ============================================================================
// Main Component
// ============================================================================

export function QuickActionsBar({
  onExportClick,
  pendingChangesCount = 0,
  isOffline = false,
  className = '',
}: QuickActionsBarProps) {
  const {
    tripPlan,
    currentDayIndex,
    setCurrentDay,
    canUndo,
    canRedo,
    undo,
    redo,
  } = usePlanningStore();

  const [showKeyboardHints, setShowKeyboardHints] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [recentAction, setRecentAction] = useState<string | null>(null);

  const totalDays = tripPlan?.days.length || 0;

  // Handle keyboard shortcuts display
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Show hints when holding Meta/Ctrl
      if (e.key === 'Meta' || e.key === 'Control') {
        setShowKeyboardHints(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Meta' || e.key === 'Control') {
        setShowKeyboardHints(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Handle undo with feedback
  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    undo();
    setRecentAction('Undone');
    setTimeout(() => setRecentAction(null), 1500);
  }, [canUndo, undo]);

  // Handle redo with feedback
  const handleRedo = useCallback(() => {
    if (!canRedo) return;
    redo();
    setRecentAction('Redone');
    setTimeout(() => setRecentAction(null), 1500);
  }, [canRedo, redo]);

  // Navigate days
  const goToPrevDay = useCallback(() => {
    if (currentDayIndex > 0) {
      setCurrentDay(currentDayIndex - 1);
    }
  }, [currentDayIndex, setCurrentDay]);

  const goToNextDay = useCallback(() => {
    if (currentDayIndex < totalDays - 1) {
      setCurrentDay(currentDayIndex + 1);
    }
  }, [currentDayIndex, totalDays, setCurrentDay]);

  if (isMinimized) {
    return (
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsMinimized(false)}
        className={`
          fixed bottom-6 left-1/2 -translate-x-1/2 z-40
          w-12 h-12 rounded-full
          bg-white/90 backdrop-blur-xl border border-rui-grey-20
          shadow-rui-3 hover:shadow-rui-4
          flex items-center justify-center
          text-rui-grey-50 hover:text-rui-accent
          transition-all
          ${className}
        `}
        title="Show quick actions"
      >
        <Keyboard className="w-5 h-5" />
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={`
        fixed bottom-6 left-1/2 -translate-x-1/2 z-40
        ${className}
      `}
    >
      {/* Main bar */}
      <div className="relative">
        {/* Glass background */}
        <div
          className="absolute inset-0 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/50 shadow-rui-4"
          style={{
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
          }}
        />

        {/* Content */}
        <div className="relative flex items-center gap-1 px-2 py-2">
          {/* Offline indicator */}
          {isOffline && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1.5 px-3 py-1.5 mr-1 rounded-xl bg-amber-100 border border-amber-200"
            >
              <WifiOff className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-body-3 font-medium text-amber-700">
                Offline
                {pendingChangesCount > 0 && ` · ${pendingChangesCount}`}
              </span>
            </motion.div>
          )}

          {/* Day navigation */}
          <div className="flex items-center gap-1 px-1">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={goToPrevDay}
              disabled={currentDayIndex === 0}
              className={`
                p-2 rounded-xl transition-all
                ${currentDayIndex === 0
                  ? 'text-rui-grey-30 cursor-not-allowed'
                  : 'text-rui-grey-60 hover:bg-rui-grey-10 hover:text-rui-black'
                }
              `}
              title="Previous day"
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.button>

            <div className="flex items-center gap-2 px-2">
              <Calendar className="w-4 h-4 text-rui-grey-40" />
              <span className="text-body-2 font-medium text-rui-grey-70 min-w-[60px] text-center">
                Day {currentDayIndex + 1}/{totalDays}
              </span>
            </div>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={goToNextDay}
              disabled={currentDayIndex >= totalDays - 1}
              className={`
                p-2 rounded-xl transition-all
                ${currentDayIndex >= totalDays - 1
                  ? 'text-rui-grey-30 cursor-not-allowed'
                  : 'text-rui-grey-60 hover:bg-rui-grey-10 hover:text-rui-black'
                }
              `}
              title="Next day"
            >
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-rui-grey-15 mx-1" />

          {/* Undo/Redo */}
          <div className="flex items-center gap-1">
            <ActionButton
              icon={<Undo2 className="w-4 h-4" />}
              onClick={handleUndo}
              disabled={!canUndo}
              tooltip="Undo"
              shortcut={showKeyboardHints ? '⌘Z' : undefined}
            />
            <ActionButton
              icon={<Redo2 className="w-4 h-4" />}
              onClick={handleRedo}
              disabled={!canRedo}
              tooltip="Redo"
              shortcut={showKeyboardHints ? '⇧⌘Z' : undefined}
            />
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-rui-grey-15 mx-1" />

          {/* Export */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onExportClick}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rui-accent text-white text-body-3 font-medium hover:bg-rui-accent/90 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </motion.button>

          {/* Minimize button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsMinimized(true)}
            className="p-2 rounded-xl text-rui-grey-40 hover:bg-rui-grey-10 hover:text-rui-grey-60 transition-colors ml-1"
            title="Minimize"
          >
            <X className="w-3.5 h-3.5" />
          </motion.button>
        </div>

        {/* Recent action feedback */}
        <AnimatePresence>
          {recentAction && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-rui-black text-white text-body-3 font-medium shadow-lg"
            >
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                {recentAction}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Action Button
// ============================================================================

interface ActionButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tooltip: string;
  shortcut?: string;
}

function ActionButton({
  icon,
  onClick,
  disabled = false,
  tooltip,
  shortcut,
}: ActionButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.1 }}
      whileTap={{ scale: disabled ? 1 : 0.9 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        relative p-2.5 rounded-xl transition-all
        ${disabled
          ? 'text-rui-grey-30 cursor-not-allowed'
          : 'text-rui-grey-60 hover:bg-rui-grey-10 hover:text-rui-black'
        }
      `}
      title={tooltip}
    >
      {icon}

      {/* Keyboard shortcut hint */}
      <AnimatePresence>
        {shortcut && (
          <motion.span
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-rui-grey-80 text-white text-[10px] font-mono whitespace-nowrap"
          >
            {shortcut}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// ============================================================================
// Compact Version (for mobile)
// ============================================================================

interface CompactQuickActionsProps {
  onExportClick: () => void;
  className?: string;
}

export function CompactQuickActions({
  onExportClick,
  className = '',
}: CompactQuickActionsProps) {
  const { canUndo, canRedo, undo, redo } = usePlanningStore();

  const canUndoNow = canUndo();
  const canRedoNow = canRedo();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={undo}
        disabled={!canUndoNow}
        className={`p-2 rounded-lg ${canUndoNow ? 'text-rui-grey-60 hover:bg-rui-grey-10' : 'text-rui-grey-30'}`}
      >
        <Undo2 className="w-4 h-4" />
      </button>
      <button
        onClick={redo}
        disabled={!canRedoNow}
        className={`p-2 rounded-lg ${canRedoNow ? 'text-rui-grey-60 hover:bg-rui-grey-10' : 'text-rui-grey-30'}`}
      >
        <Redo2 className="w-4 h-4" />
      </button>
      <button
        onClick={onExportClick}
        className="p-2 rounded-lg text-rui-grey-60 hover:bg-rui-grey-10"
      >
        <Download className="w-4 h-4" />
      </button>
    </div>
  );
}

// ============================================================================
// Export
// ============================================================================

export default QuickActionsBar;

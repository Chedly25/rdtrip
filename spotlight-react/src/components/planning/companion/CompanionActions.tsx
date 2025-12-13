/**
 * CompanionActions
 *
 * Contextual action buttons for companion responses.
 * Styled as warm terracotta chips with clear visual hierarchy.
 *
 * Design: Wanderlust Editorial - warm earth tones
 */

import { motion } from 'framer-motion';
import {
  RefreshCw,
  Plus,
  Map,
  X,
  Sparkles,
  MessageCircle,
  ArrowRight,
  Search,
  ListChecks,
} from 'lucide-react';
import type { CompanionAction } from '../../../types/planning';

// ============================================
// Types
// ============================================

interface CompanionActionsProps {
  actions: CompanionAction[];
  onActionClick: (action: CompanionAction) => void;
  disabled?: boolean;
}

// ============================================
// Icon Mapping
// ============================================

const actionIcons: Record<string, React.ElementType> = {
  show_more: RefreshCw,
  add_card: Plus,
  navigate: Map,
  dismiss: X,
  custom: Sparkles,
};

const getIconForAction = (action: CompanionAction): React.ElementType => {
  // Check payload for hints
  if (action.payload?.query?.toLowerCase().includes('review')) {
    return ListChecks;
  }
  if (action.payload?.query?.toLowerCase().includes('search')) {
    return Search;
  }
  if (action.payload?.query?.toLowerCase().includes('find')) {
    return Search;
  }
  if (action.payload?.query?.toLowerCase().includes('suggest')) {
    return Sparkles;
  }

  return actionIcons[action.type] || MessageCircle;
};

// ============================================
// ActionButton Component
// ============================================

interface ActionButtonProps {
  action: CompanionAction;
  onClick: () => void;
  disabled?: boolean;
  index: number;
  isPrimary?: boolean;
}

function ActionButton({ action, onClick, disabled, index, isPrimary }: ActionButtonProps) {
  const Icon = getIconForAction(action);

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
        font-['Satoshi',sans-serif] text-xs font-medium
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${
          isPrimary
            ? `
              bg-gradient-to-r from-[#C45830] to-[#D4724A] text-white
              hover:from-[#A84828] hover:to-[#C45830]
              shadow-sm shadow-[#C45830]/20
              active:scale-[0.98]
            `
            : `
              bg-[#FEF3EE] text-[#C45830] border border-[#F5D4C5]
              hover:bg-[#FCE8DE] hover:border-[#C45830]/30
              active:scale-[0.98]
            `
        }
      `}
    >
      <Icon className={`w-3 h-3 ${isPrimary ? '' : 'opacity-70'}`} />
      <span>{action.label}</span>
      {isPrimary && <ArrowRight className="w-3 h-3 ml-0.5" />}
    </motion.button>
  );
}

// ============================================
// Main Component
// ============================================

export function CompanionActions({
  actions,
  onActionClick,
  disabled = false,
}: CompanionActionsProps) {
  if (!actions || actions.length === 0) return null;

  // First action is primary, rest are secondary
  const [primary, ...secondary] = actions;

  return (
    <div className="flex flex-wrap items-center gap-2 mt-3">
      {/* Primary action */}
      {primary && (
        <ActionButton
          action={primary}
          onClick={() => onActionClick(primary)}
          disabled={disabled}
          index={0}
          isPrimary
        />
      )}

      {/* Secondary actions */}
      {secondary.map((action, index) => (
        <ActionButton
          key={action.id}
          action={action}
          onClick={() => onActionClick(action)}
          disabled={disabled}
          index={index + 1}
          isPrimary={false}
        />
      ))}
    </div>
  );
}

// ============================================
// Quick Suggestion Chips
// ============================================

interface QuickSuggestionsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  disabled?: boolean;
}

export function QuickSuggestions({
  suggestions,
  onSelect,
  disabled = false,
}: QuickSuggestionsProps) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {suggestions.map((suggestion, index) => (
        <motion.button
          key={suggestion}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.03 }}
          onClick={() => onSelect(suggestion)}
          disabled={disabled}
          className="
            px-3 py-1.5 rounded-full
            bg-[#FFFBF5] border border-[#E5DDD0]
            text-xs text-[#8B7355] font-['Satoshi',sans-serif]
            hover:border-[#C45830] hover:text-[#C45830] hover:bg-[#FEF3EE]
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
            active:scale-[0.98]
          "
        >
          {suggestion}
        </motion.button>
      ))}
    </div>
  );
}

export default CompanionActions;

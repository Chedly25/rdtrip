/**
 * Plan Change Sheet - Adaptive Travel Assistant
 *
 * When something doesn't go as planned, this sheet helps users
 * quickly adapt with AI-powered suggestions.
 *
 * Design: "Course Correction" - calm, reassuring, solution-focused
 *
 * Scenarios:
 * - Running late
 * - Place is closed
 * - Want to skip something
 * - Weather changed
 * - Feeling tired
 * - Want more time somewhere
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
  X,
  Clock,
  XCircle,
  SkipForward,
  CloudRain,
  Battery,
  PlusCircle,
  Sparkles,
  ChevronRight,
  RefreshCw,
  MapPin,
  Check,
  AlertCircle,
} from 'lucide-react';

// Wanderlust Editorial Colors
const colors = {
  cream: '#FFFBF5',
  warmWhite: '#FAF7F2',
  terracotta: '#C45830',
  terracottaLight: '#D96A42',
  golden: '#D4A853',
  goldenLight: '#E4BE73',
  goldenDark: '#B8923D',
  sage: '#6B8E7B',
  sageLight: '#8BA99A',
  darkBrown: '#2C2417',
  mediumBrown: '#4A3F35',
  lightBrown: '#8B7355',
  border: '#E8E2D9',
};

// Issue types with icons and labels
const issueTypes = [
  {
    id: 'late',
    icon: Clock,
    label: 'Running Late',
    description: "I'm behind schedule",
    color: colors.golden,
  },
  {
    id: 'closed',
    icon: XCircle,
    label: 'Place is Closed',
    description: 'Need an alternative',
    color: colors.terracotta,
  },
  {
    id: 'skip',
    icon: SkipForward,
    label: 'Want to Skip',
    description: "I'll pass on this one",
    color: colors.lightBrown,
  },
  {
    id: 'weather',
    icon: CloudRain,
    label: 'Weather Changed',
    description: 'Need indoor options',
    color: '#3498DB',
  },
  {
    id: 'tired',
    icon: Battery,
    label: 'Feeling Tired',
    description: 'Need a lighter schedule',
    color: '#9B59B6',
  },
  {
    id: 'extend',
    icon: PlusCircle,
    label: 'Want More Time',
    description: "I'm enjoying this place",
    color: colors.sage,
  },
];

// AI Suggestion Card
interface Suggestion {
  id: string;
  type: 'replacement' | 'adjustment' | 'skip';
  title: string;
  description: string;
  impact?: string;
  confidence: number; // 0-1
}

const SuggestionCard = ({
  suggestion,
  index,
  onApply,
  isApplying,
}: {
  suggestion: Suggestion;
  index: number;
  onApply: (suggestion: Suggestion) => void;
  isApplying: boolean;
}) => {
  const typeStyles = {
    replacement: { color: colors.sage, label: 'Alternative' },
    adjustment: { color: colors.golden, label: 'Adjustment' },
    skip: { color: colors.terracotta, label: 'Remove' },
  };
  const style = typeStyles[suggestion.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="p-4 rounded-2xl relative overflow-hidden"
      style={{
        background: colors.warmWhite,
        border: `1px solid ${colors.border}`,
      }}
    >
      {/* Confidence indicator */}
      <div
        className="absolute top-0 left-0 h-1 rounded-t-2xl"
        style={{
          width: `${suggestion.confidence * 100}%`,
          background: style.color,
        }}
      />

      {/* Type badge */}
      <div className="flex items-center justify-between mb-3">
        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium"
          style={{
            background: `${style.color}15`,
            color: style.color,
          }}
        >
          <Sparkles className="w-3 h-3" />
          {style.label}
        </div>
        <span className="text-xs" style={{ color: colors.lightBrown }}>
          {Math.round(suggestion.confidence * 100)}% match
        </span>
      </div>

      {/* Content */}
      <h4 className="text-base font-medium mb-1" style={{ color: colors.darkBrown }}>
        {suggestion.title}
      </h4>
      <p className="text-sm mb-3" style={{ color: colors.lightBrown }}>
        {suggestion.description}
      </p>

      {/* Impact */}
      {suggestion.impact && (
        <div
          className="flex items-center gap-2 p-2 rounded-lg mb-3"
          style={{ background: colors.cream }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: colors.golden }} />
          <span className="text-xs" style={{ color: colors.mediumBrown }}>
            {suggestion.impact}
          </span>
        </div>
      )}

      {/* Apply button */}
      <motion.button
        onClick={() => onApply(suggestion)}
        disabled={isApplying}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium"
        style={{
          background: isApplying
            ? colors.border
            : `linear-gradient(135deg, ${style.color} 0%, ${style.color}dd 100%)`,
          color: 'white',
          opacity: isApplying ? 0.7 : 1,
        }}
        whileHover={!isApplying ? { scale: 1.02 } : {}}
        whileTap={!isApplying ? { scale: 0.98 } : {}}
      >
        {isApplying ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            Applying...
          </>
        ) : (
          <>
            <Check className="w-4 h-4" />
            Apply this change
          </>
        )}
      </motion.button>
    </motion.div>
  );
};

// Issue Type Selector
const IssueTypeButton = ({
  issue,
  isSelected,
  onClick,
}: {
  issue: typeof issueTypes[0];
  isSelected: boolean;
  onClick: () => void;
}) => (
  <motion.button
    onClick={onClick}
    className="flex items-center gap-3 w-full p-4 rounded-xl transition-all text-left"
    style={{
      background: isSelected ? `${issue.color}15` : colors.warmWhite,
      border: `2px solid ${isSelected ? issue.color : colors.border}`,
      boxShadow: isSelected ? `0 4px 15px ${issue.color}20` : 'none',
    }}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    <div
      className="w-12 h-12 rounded-xl flex items-center justify-center"
      style={{
        background: `${issue.color}15`,
        border: `1px solid ${issue.color}30`,
      }}
    >
      <issue.icon className="w-6 h-6" style={{ color: issue.color }} />
    </div>
    <div className="flex-1">
      <h4
        className="text-base font-medium"
        style={{ color: isSelected ? issue.color : colors.darkBrown }}
      >
        {issue.label}
      </h4>
      <p className="text-sm" style={{ color: colors.lightBrown }}>
        {issue.description}
      </p>
    </div>
    {isSelected && (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="w-6 h-6 rounded-full flex items-center justify-center"
        style={{ background: issue.color }}
      >
        <Check className="w-4 h-4 text-white" />
      </motion.div>
    )}
  </motion.button>
);

interface PlanChangeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentActivity?: {
    id: string;
    name: string;
    time: string;
    type: string;
  };
  onApplySuggestion?: (suggestion: Suggestion, issueType: string) => Promise<void>;
  getSuggestions?: (issueType: string, activity: { id: string; name: string }) => Promise<Suggestion[]>;
}

export const PlanChangeSheet: React.FC<PlanChangeSheetProps> = ({
  isOpen,
  onClose,
  currentActivity,
  onApplySuggestion,
  getSuggestions,
}) => {
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [appliedSuggestion, setAppliedSuggestion] = useState<Suggestion | null>(null);

  const handleIssueSelect = async (issueId: string) => {
    setSelectedIssue(issueId);
    setIsLoading(true);
    setSuggestions([]);

    // Fetch AI suggestions
    try {
      if (getSuggestions && currentActivity) {
        const newSuggestions = await getSuggestions(issueId, currentActivity);
        setSuggestions(newSuggestions);
      } else {
        // Mock suggestions for demo
        await new Promise((r) => setTimeout(r, 1000));
        setSuggestions([
          {
            id: '1',
            type: 'replacement',
            title: 'Visit Museo del Novecento instead',
            description: 'A fantastic modern art museum just 5 minutes away',
            impact: 'Adds 15 minutes to your schedule',
            confidence: 0.92,
          },
          {
            id: '2',
            type: 'adjustment',
            title: 'Push schedule back 30 minutes',
            description: 'Adjust all remaining activities for today',
            impact: 'Dinner reservation may need to be moved',
            confidence: 0.85,
          },
          {
            id: '3',
            type: 'skip',
            title: 'Skip and move on',
            description: 'Continue with the next activity on your list',
            confidence: 0.78,
          },
        ]);
      }
    } catch {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async (suggestion: Suggestion) => {
    setIsApplying(true);
    try {
      if (onApplySuggestion && selectedIssue) {
        await onApplySuggestion(suggestion, selectedIssue);
      } else {
        // Demo delay
        await new Promise((r) => setTimeout(r, 1500));
      }
      setAppliedSuggestion(suggestion);
      // Auto close after success
      setTimeout(() => {
        onClose();
        // Reset state
        setSelectedIssue(null);
        setSuggestions([]);
        setAppliedSuggestion(null);
      }, 1500);
    } catch {
      // Handle error
    } finally {
      setIsApplying(false);
    }
  };

  const handleBack = () => {
    setSelectedIssue(null);
    setSuggestions([]);
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999]"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
          style={{
            background: 'rgba(44, 36, 23, 0.7)',
            backdropFilter: 'blur(8px)',
          }}
          onClick={onClose}
        />

        {/* Sheet */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="absolute bottom-0 left-0 right-0 max-h-[85vh] rounded-t-3xl overflow-hidden flex flex-col"
          style={{
            background: colors.cream,
            boxShadow: '0 -10px 40px rgba(0,0,0,0.2)',
          }}
        >
          {/* Success Overlay */}
          <AnimatePresence>
            {appliedSuggestion && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 flex flex-col items-center justify-center"
                style={{ background: `${colors.cream}F5` }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                  style={{
                    background: `linear-gradient(135deg, ${colors.sage} 0%, ${colors.sageLight} 100%)`,
                    boxShadow: `0 10px 30px ${colors.sage}40`,
                  }}
                >
                  <Check className="w-10 h-10 text-white" />
                </motion.div>
                <h3 className="text-xl font-serif" style={{ color: colors.darkBrown }}>
                  Plan Updated!
                </h3>
                <p className="text-sm mt-2" style={{ color: colors.lightBrown }}>
                  Your itinerary has been adjusted
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
            <div className="w-12 h-1 rounded-full" style={{ background: colors.border }} />
          </div>

          {/* Header */}
          <div className="px-6 pb-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              {selectedIssue ? (
                <motion.button
                  onClick={handleBack}
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: colors.warmWhite, border: `1px solid ${colors.border}` }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ChevronRight
                    className="w-5 h-5 rotate-180"
                    style={{ color: colors.mediumBrown }}
                  />
                </motion.button>
              ) : (
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${colors.golden} 0%, ${colors.goldenDark} 100%)`,
                    boxShadow: `0 4px 15px ${colors.golden}30`,
                  }}
                >
                  <RefreshCw className="w-5 h-5 text-white" />
                </div>
              )}
              <div>
                <h2
                  className="text-lg font-serif font-medium"
                  style={{ color: colors.darkBrown }}
                >
                  {selectedIssue ? 'AI Suggestions' : 'Change of Plans?'}
                </h2>
                <p className="text-sm" style={{ color: colors.lightBrown }}>
                  {selectedIssue ? "Here's how we can adapt" : "We'll help you adjust"}
                </p>
              </div>
            </div>

            <motion.button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: colors.warmWhite, border: `1px solid ${colors.border}` }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-4 h-4" style={{ color: colors.lightBrown }} />
            </motion.button>
          </div>

          {/* Current Activity Context */}
          {currentActivity && (
            <div className="px-6 pb-4 flex-shrink-0">
              <div
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{
                  background: colors.warmWhite,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <MapPin className="w-5 h-5" style={{ color: colors.terracotta }} />
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: colors.darkBrown }}
                  >
                    {currentActivity.name}
                  </p>
                  <p className="text-xs" style={{ color: colors.lightBrown }}>
                    {currentActivity.time}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="px-6 pb-8 overflow-y-auto flex-1">
            <AnimatePresence mode="wait">
              {!selectedIssue ? (
                /* Issue Type Selection */
                <motion.div
                  key="issues"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-3"
                >
                  <p
                    className="text-xs uppercase tracking-wider mb-3"
                    style={{ color: colors.lightBrown }}
                  >
                    What's happening?
                  </p>
                  {issueTypes.map((issue) => (
                    <IssueTypeButton
                      key={issue.id}
                      issue={issue}
                      isSelected={selectedIssue === issue.id}
                      onClick={() => handleIssueSelect(issue.id)}
                    />
                  ))}
                </motion.div>
              ) : (
                /* Suggestions */
                <motion.div
                  key="suggestions"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                      >
                        <Sparkles className="w-8 h-8" style={{ color: colors.golden }} />
                      </motion.div>
                      <p className="mt-4 text-sm" style={{ color: colors.lightBrown }}>
                        Finding the best options...
                      </p>
                    </div>
                  ) : (
                    <>
                      <p
                        className="text-xs uppercase tracking-wider mb-3"
                        style={{ color: colors.lightBrown }}
                      >
                        Recommended changes
                      </p>
                      {suggestions.map((suggestion, index) => (
                        <SuggestionCard
                          key={suggestion.id}
                          suggestion={suggestion}
                          index={index}
                          onApply={handleApply}
                          isApplying={isApplying}
                        />
                      ))}
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default PlanChangeSheet;

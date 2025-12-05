/**
 * TripStorySnippet - Your Trip Narrative Being Written
 *
 * A beautiful, journal-like component that shows the evolving story
 * of today's journey. As moments are captured, the narrative grows.
 *
 * Design: Warm paper texture, typewriter animation for new text,
 * hand-drawn underlines for emphasis. Feels like a personal travel journal.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Feather,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useTimeTheme } from '../hooks/useTimeOfDay';
import type { TripNarrative } from '../services/tripCompanion';

interface TripStorySnippetProps {
  narrative: TripNarrative | null;
  dayNumber: number;
  momentCount?: number;
  isGenerating?: boolean;
  onExpand?: () => void;
}

// Typewriter effect hook
const useTypewriter = (text: string, speed: number = 30, enabled: boolean = true) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!enabled || !text) {
      setDisplayedText(text || '');
      setIsComplete(true);
      return;
    }

    setDisplayedText('');
    setIsComplete(false);

    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
        setIsComplete(true);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, enabled]);

  return { displayedText, isComplete };
};

// Paper texture background
const PaperBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme, isNight } = useTimeTheme();

  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: isNight
          ? 'linear-gradient(135deg, rgba(42, 36, 56, 0.95) 0%, rgba(30, 26, 40, 0.95) 100%)'
          : 'linear-gradient(135deg, #FFFBF5 0%, #FAF7F2 100%)',
        border: `1px solid ${theme.cardBorder}`,
        boxShadow: theme.shadow,
      }}
    >
      {/* Paper texture */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Subtle lines like notebook paper */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: isNight
            ? 'repeating-linear-gradient(transparent, transparent 27px, rgba(139, 126, 200, 0.05) 28px)'
            : 'repeating-linear-gradient(transparent, transparent 27px, rgba(196, 88, 48, 0.05) 28px)',
          backgroundPositionY: '20px',
        }}
      />

      <div className="relative z-10">{children}</div>
    </div>
  );
};

// Writing cursor animation
const WritingCursor: React.FC = () => {
  const { theme } = useTimeTheme();

  return (
    <motion.span
      className="inline-block w-0.5 h-5 ml-0.5"
      style={{ background: theme.primary }}
      animate={{ opacity: [1, 0, 1] }}
      transition={{ duration: 0.8, repeat: Infinity }}
    />
  );
};

export const TripStorySnippet: React.FC<TripStorySnippetProps> = ({
  narrative,
  dayNumber,
  momentCount = 0,
  isGenerating = false,
  onExpand,
}) => {
  const { theme } = useTimeTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTypewriter, setShowTypewriter] = useState(true);

  // Use typewriter for the opening hook
  const { displayedText, isComplete } = useTypewriter(
    narrative?.openingHook || narrative?.narrativeText?.slice(0, 150) || '',
    25,
    showTypewriter && !isExpanded
  );

  // After typewriter completes once, disable it
  useEffect(() => {
    if (isComplete) {
      setTimeout(() => setShowTypewriter(false), 500);
    }
  }, [isComplete]);

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
    onExpand?.();
  };

  // Empty state - no narrative yet
  if (!narrative && momentCount === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 mb-6"
      >
        <PaperBackground>
          <div className="p-5 text-center">
            <Feather
              className="w-10 h-10 mx-auto mb-3"
              style={{ color: `${theme.primary}40` }}
            />
            <h4
              className="text-lg font-semibold mb-2"
              style={{
                color: theme.textPrimary,
                fontFamily: "'Playfair Display', serif",
              }}
            >
              Your Story Awaits
            </h4>
            <p className="text-sm" style={{ color: theme.textMuted }}>
              As you capture moments, your day's narrative will unfold here...
            </p>
          </div>
        </PaperBackground>
      </motion.div>
    );
  }

  // Generating state
  if (isGenerating) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 mb-6"
      >
        <PaperBackground>
          <div className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Feather
                  className="w-5 h-5"
                  style={{ color: theme.primary }}
                />
              </motion.div>
              <span
                className="text-sm font-medium"
                style={{ color: theme.primary }}
              >
                Writing your story...
              </span>
            </div>

            {/* Skeleton lines */}
            <div className="space-y-3">
              <motion.div
                className="h-4 rounded"
                style={{ background: `${theme.primary}15` }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <motion.div
                className="h-4 rounded w-5/6"
                style={{ background: `${theme.primary}10` }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
              />
              <motion.div
                className="h-4 rounded w-4/6"
                style={{ background: `${theme.primary}10` }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
              />
            </div>
          </div>
        </PaperBackground>
      </motion.div>
    );
  }

  // Has narrative
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mb-6"
    >
      <PaperBackground>
        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen
                className="w-5 h-5"
                style={{ color: theme.primary }}
              />
              <span
                className="text-sm font-semibold uppercase tracking-wider"
                style={{ color: theme.primary }}
              >
                Day {dayNumber}
              </span>
            </div>

            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs"
              style={{
                background: `${theme.primary}15`,
                color: theme.primary,
              }}
            >
              <Sparkles className="w-3 h-3" />
              <span>{momentCount} moment{momentCount !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Narrative Text */}
          <div
            className="text-base leading-relaxed mb-4"
            style={{
              color: theme.textPrimary,
              fontFamily: "'Lora', 'Georgia', serif",
            }}
          >
            {isExpanded ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {/* Opening Hook with emphasis */}
                {narrative?.openingHook && (
                  <p className="mb-3">
                    <span
                      className="relative inline"
                      style={{
                        textDecoration: 'underline',
                        textDecorationColor: `${theme.primary}40`,
                        textUnderlineOffset: '4px',
                      }}
                    >
                      {narrative.openingHook}
                    </span>
                  </p>
                )}

                {/* Full narrative */}
                <p className="mb-3">{narrative?.narrativeText}</p>

                {/* Closing reflection */}
                {narrative?.closingReflection && (
                  <p
                    className="italic"
                    style={{ color: theme.textSecondary }}
                  >
                    {narrative.closingReflection}
                  </p>
                )}
              </motion.div>
            ) : (
              <p>
                {showTypewriter && !isComplete ? (
                  <>
                    {displayedText}
                    <WritingCursor />
                  </>
                ) : (
                  <>
                    {narrative?.openingHook || narrative?.narrativeText?.slice(0, 150)}
                    {(narrative?.narrativeText?.length || 0) > 150 && '...'}
                  </>
                )}
              </p>
            )}
          </div>

          {/* Expand/Collapse Button */}
          {narrative?.narrativeText && narrative.narrativeText.length > 150 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExpand}
              className="flex items-center gap-1.5 text-sm font-medium"
              style={{ color: theme.primary }}
            >
              <span>{isExpanded ? 'Read less' : 'Read more'}</span>
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-4 h-4" />
              </motion.div>
            </motion.button>
          )}

          {/* Key Moments Timeline */}
          {isExpanded && narrative?.keyMoments && narrative.keyMoments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-5 pt-5 border-t"
              style={{ borderColor: theme.cardBorder }}
            >
              <h5
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: theme.textMuted }}
              >
                Key Moments
              </h5>

              <div className="space-y-3">
                {narrative.keyMoments.map((moment, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <div
                      className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                      style={{ background: theme.primary }}
                    />
                    <div>
                      <span
                        className="text-xs font-medium"
                        style={{ color: theme.textMuted }}
                      >
                        {moment.time}
                      </span>
                      <p
                        className="text-sm"
                        style={{
                          color: theme.textSecondary,
                          fontFamily: "'Lora', 'Georgia', serif",
                        }}
                      >
                        {moment.snippet}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </PaperBackground>
    </motion.div>
  );
};

export default TripStorySnippet;

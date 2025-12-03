/**
 * Trip Narrative
 *
 * A flowing, story-style description of the entire trip that feels
 * like a personal travel guide wrote it. Expandable/collapsible to
 * not overwhelm the UI while still being accessible.
 *
 * Design: Editorial book-like aesthetic with elegant typography,
 * decorative quotes, and smooth expand/collapse animation.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronDown, Quote, Sparkles } from 'lucide-react';

interface TripNarrativeProps {
  narrative: string;
  tripStory?: string;          // User's original trip story for echo
  isExpandedByDefault?: boolean;
  maxCollapsedLines?: number;
  className?: string;
}

export function TripNarrative({
  narrative,
  tripStory,
  isExpandedByDefault = false,
  maxCollapsedLines = 3,
  className = '',
}: TripNarrativeProps) {
  const [isExpanded, setIsExpanded] = useState(isExpandedByDefault);

  if (!narrative) return null;

  // Split narrative into paragraphs
  const paragraphs = narrative.split('\n\n').filter(Boolean);

  // For collapsed view, check if there's more content
  const hasMore = narrative.length > 200 || paragraphs.length > 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{
        background: 'linear-gradient(180deg, #FFFBF5 0%, #FAF7F2 100%)',
        border: '1px solid rgba(139, 115, 85, 0.12)',
      }}
    >
      {/* Decorative corner element */}
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 opacity-[0.04]"
        style={{
          background: 'radial-gradient(circle, #C45830 0%, transparent 70%)',
        }}
      />

      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{
          borderBottom: '1px solid rgba(139, 115, 85, 0.08)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(196, 88, 48, 0.1) 0%, rgba(212, 168, 83, 0.1) 100%)',
            }}
          >
            <BookOpen className="h-5 w-5" style={{ color: '#C45830' }} />
          </div>
          <div>
            <h3
              className="text-base font-semibold"
              style={{
                color: '#2C2417',
                fontFamily: "'Fraunces', Georgia, serif",
              }}
            >
              Your Trip Story
            </h3>
            <p className="text-xs text-[#8B7355]">
              A personal narrative of your journey
            </p>
          </div>
        </div>

        {hasMore && (
          <motion.button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors hover:bg-black/5"
            style={{ color: '#C45830' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isExpanded ? 'Collapse' : 'Read more'}
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-4 w-4" />
            </motion.div>
          </motion.button>
        )}
      </div>

      {/* Content */}
      <div className="px-5 py-4">
        {/* Trip story echo (if provided) */}
        {tripStory && isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4"
          >
            <div
              className="relative rounded-xl px-4 py-3"
              style={{
                background: 'rgba(196, 88, 48, 0.05)',
                borderLeft: '3px solid #C45830',
              }}
            >
              <Quote
                className="absolute -left-1 -top-2 h-6 w-6 opacity-20"
                style={{ color: '#C45830' }}
              />
              <p
                className="text-sm italic leading-relaxed"
                style={{
                  color: '#5C4D3D',
                  fontFamily: "'Satoshi', sans-serif",
                }}
              >
                "{tripStory.length > 150 ? tripStory.substring(0, 150) + '...' : tripStory}"
              </p>
              <div className="mt-2 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" style={{ color: '#D4A853' }} />
                <span className="text-[10px] font-medium uppercase tracking-wider text-[#8B7355]">
                  Your original request
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Narrative text */}
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {paragraphs.map((paragraph, idx) => (
                <motion.p
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="text-[15px] leading-relaxed"
                  style={{
                    color: '#3D3328',
                    fontFamily: "'Satoshi', sans-serif",
                    textIndent: idx === 0 ? '0' : '1.5em',
                  }}
                >
                  {idx === 0 && (
                    <span
                      className="float-left mr-2 text-4xl font-bold leading-none"
                      style={{
                        color: '#C45830',
                        fontFamily: "'Fraunces', Georgia, serif",
                      }}
                    >
                      {paragraph.charAt(0)}
                    </span>
                  )}
                  {idx === 0 ? paragraph.substring(1) : paragraph}
                </motion.p>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <p
                className="text-[15px] leading-relaxed"
                style={{
                  color: '#3D3328',
                  fontFamily: "'Satoshi', sans-serif",
                  display: '-webkit-box',
                  WebkitLineClamp: maxCollapsedLines,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                <span
                  className="float-left mr-2 text-4xl font-bold leading-none"
                  style={{
                    color: '#C45830',
                    fontFamily: "'Fraunces', Georgia, serif",
                  }}
                >
                  {narrative.charAt(0)}
                </span>
                {narrative.substring(1)}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer gradient when collapsed */}
      {!isExpanded && hasMore && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16"
          style={{
            background: 'linear-gradient(to top, #FAF7F2 0%, transparent 100%)',
          }}
        />
      )}
    </motion.div>
  );
}

export default TripNarrative;

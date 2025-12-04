/**
 * Check-in Summary Card
 * Sprint 2.4: Check-ins & Progress Tracking
 *
 * Beautiful summary cards showing recent check-ins for the today view.
 * Displays the latest memories with a preview, optimized for quick glances.
 *
 * Design: Elegant polaroid-inspired mini cards with essential info
 */

import { motion } from 'framer-motion';
import {
  Camera,
  MapPin,
  Star,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import type { TripMemory } from './TripMemories';

// Wanderlust Editorial Colors
const colors = {
  cream: '#FFFBF5',
  warmWhite: '#FAF7F2',
  polaroidWhite: '#F8F6F0',
  terracotta: '#C45830',
  terracottaLight: '#D96A42',
  golden: '#D4A853',
  goldenLight: '#E4BE73',
  sage: '#6B8E7B',
  sageLight: '#8BA99A',
  darkBrown: '#2C2417',
  mediumBrown: '#4A3F35',
  lightBrown: '#8B7355',
  border: '#E8E2D9',
};

// Mood emojis
const moodEmojis: Record<string, string> = {
  amazing: '🤩',
  happy: '😊',
  peaceful: '😌',
  adventurous: '🤠',
  tired: '😴',
  hungry: '🤤',
};

// Mini Memory Preview Card
const MiniMemoryCard = ({
  memory,
  index,
  onClick,
}: {
  memory: TripMemory;
  index: number;
  onClick?: () => void;
}) => {
  const date = new Date(memory.timestamp);
  const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer"
      style={{
        background: colors.warmWhite,
        border: `1px solid ${colors.border}`,
      }}
      whileHover={{ scale: 1.02, borderColor: colors.golden }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      {/* Photo thumbnail or mood emoji */}
      <div
        className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
        style={{
          background: memory.photo
            ? 'transparent'
            : `linear-gradient(135deg, ${colors.sage}20 0%, ${colors.golden}20 100%)`,
        }}
      >
        {memory.photo ? (
          <img
            src={memory.photo}
            alt={memory.location.name}
            className="w-full h-full object-cover"
          />
        ) : memory.mood ? (
          <span className="text-2xl">{moodEmojis[memory.mood] || '📍'}</span>
        ) : (
          <MapPin className="w-6 h-6" style={{ color: colors.terracotta }} />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: colors.darkBrown }}>
          {memory.location.name}
        </p>
        {memory.note && (
          <p
            className="text-sm truncate"
            style={{
              fontFamily: "'Caveat', cursive",
              color: colors.lightBrown,
            }}
          >
            "{memory.note}"
          </p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs" style={{ color: colors.lightBrown }}>
            {timeString}
          </span>
          {memory.rating && memory.rating > 0 && (
            <div className="flex items-center gap-0.5">
              <Star
                className="w-3 h-3"
                style={{ color: colors.golden, fill: colors.golden }}
              />
              <span className="text-xs font-medium" style={{ color: colors.golden }}>
                {memory.rating}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Chevron */}
      <ChevronRight className="w-5 h-5 flex-shrink-0" style={{ color: colors.border }} />
    </motion.div>
  );
};

// Main Summary Card Props
interface CheckinSummaryCardProps {
  /** Today's check-ins */
  todayCheckins: TripMemory[];
  /** Total check-ins for the trip */
  totalCheckins: number;
  /** Callback when "View All" is clicked */
  onViewAll?: () => void;
  /** Callback when a specific check-in is clicked */
  onCheckinClick?: (memory: TripMemory) => void;
  /** Max check-ins to preview */
  maxPreview?: number;
  className?: string;
}

export const CheckinSummaryCard: React.FC<CheckinSummaryCardProps> = ({
  todayCheckins,
  totalCheckins,
  onViewAll,
  onCheckinClick,
  maxPreview = 3,
  className = '',
}) => {
  const previewCheckins = todayCheckins.slice(0, maxPreview);
  const hasMore = todayCheckins.length > maxPreview;

  // Empty state
  if (todayCheckins.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-5 rounded-3xl ${className}`}
        style={{
          background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.warmWhite} 100%)`,
          border: `1px solid ${colors.border}`,
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${colors.sage}15` }}
          >
            <Camera className="w-5 h-5" style={{ color: colors.sage }} />
          </div>
          <div>
            <h3 className="text-base font-medium" style={{ color: colors.darkBrown }}>
              Today's Memories
            </h3>
            <p className="text-xs" style={{ color: colors.lightBrown }}>
              {totalCheckins} total check-ins this trip
            </p>
          </div>
        </div>

        <div className="text-center py-6">
          <div
            className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3"
            style={{ background: `${colors.golden}10` }}
          >
            <Sparkles className="w-8 h-8" style={{ color: colors.golden }} />
          </div>
          <p className="text-sm" style={{ color: colors.lightBrown }}>
            No check-ins yet today
          </p>
          <p className="text-xs mt-1" style={{ color: colors.border }}>
            Tap activities to capture moments
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-5 rounded-3xl ${className}`}
      style={{
        background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.warmWhite} 100%)`,
        border: `1px solid ${colors.border}`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${colors.sage} 0%, ${colors.sageLight} 100%)`,
            }}
          >
            <Camera className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-medium" style={{ color: colors.darkBrown }}>
              Today's Memories
            </h3>
            <p className="text-xs" style={{ color: colors.lightBrown }}>
              {todayCheckins.length} check-in{todayCheckins.length !== 1 ? 's' : ''} today
            </p>
          </div>
        </div>

        {onViewAll && (
          <motion.button
            onClick={onViewAll}
            className="text-sm font-medium flex items-center gap-1"
            style={{ color: colors.terracotta }}
            whileHover={{ x: 3 }}
          >
            View all
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        )}
      </div>

      {/* Check-in previews */}
      <div className="space-y-2">
        {previewCheckins.map((memory, index) => (
          <MiniMemoryCard
            key={memory.id}
            memory={memory}
            index={index}
            onClick={() => onCheckinClick?.(memory)}
          />
        ))}
      </div>

      {/* "And X more" indicator */}
      {hasMore && (
        <motion.button
          onClick={onViewAll}
          className="w-full mt-3 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
          style={{
            background: colors.warmWhite,
            border: `1px dashed ${colors.border}`,
            color: colors.lightBrown,
          }}
          whileHover={{ borderColor: colors.golden, color: colors.golden }}
        >
          <span>+{todayCheckins.length - maxPreview} more check-ins</span>
        </motion.button>
      )}

      {/* Trip total badge */}
      <div
        className="mt-4 pt-4 flex items-center justify-between"
        style={{ borderTop: `1px solid ${colors.border}` }}
      >
        <span className="text-xs" style={{ color: colors.lightBrown }}>
          Trip total
        </span>
        <div
          className="flex items-center gap-2 px-3 py-1 rounded-full"
          style={{ background: `${colors.golden}15` }}
        >
          <Camera className="w-3.5 h-3.5" style={{ color: colors.golden }} />
          <span className="text-sm font-medium" style={{ color: colors.golden }}>
            {totalCheckins} memories
          </span>
        </div>
      </div>
    </motion.div>
  );
};

// Compact version for smaller spaces
export const CheckinSummaryCompact: React.FC<{
  todayCount: number;
  totalCount: number;
  latestPhoto?: string;
  onClick?: () => void;
  className?: string;
}> = ({
  todayCount,
  totalCount,
  latestPhoto,
  onClick,
  className = '',
}) => (
  <motion.button
    onClick={onClick}
    className={`flex items-center gap-3 p-3 rounded-2xl w-full ${className}`}
    style={{
      background: colors.warmWhite,
      border: `1px solid ${colors.border}`,
    }}
    whileHover={{ scale: 1.02, borderColor: colors.golden }}
    whileTap={{ scale: 0.98 }}
  >
    {/* Photo or icon */}
    <div
      className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
      style={{
        background: latestPhoto ? 'transparent' : `${colors.sage}15`,
      }}
    >
      {latestPhoto ? (
        <img
          src={latestPhoto}
          alt="Latest memory"
          className="w-full h-full object-cover"
        />
      ) : (
        <Camera className="w-5 h-5" style={{ color: colors.sage }} />
      )}
    </div>

    {/* Info */}
    <div className="flex-1 text-left">
      <p className="text-sm font-medium" style={{ color: colors.darkBrown }}>
        {todayCount > 0 ? `${todayCount} today` : 'No check-ins today'}
      </p>
      <p className="text-xs" style={{ color: colors.lightBrown }}>
        {totalCount} total memories
      </p>
    </div>

    <ChevronRight className="w-5 h-5" style={{ color: colors.border }} />
  </motion.button>
);

export default CheckinSummaryCard;

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// =============================================================================
// PACKING REMINDERS - Vintage Telegram Style Notifications
// =============================================================================
// Pre-trip reminder system styled as vintage telegrams and travel postcards
// Part of "The Traveler's Trunk" packing list aesthetic
// =============================================================================

// Wanderlust Editorial + Trunk color palette
const colors = {
  // Core editorial colors
  terracotta: '#C84B31',
  terracottaLight: '#E85D3B',
  golden: '#D4A574',
  goldenLight: '#E8C39E',
  sage: '#7D8471',
  sageLight: '#9BA18F',
  cream: '#FAF7F2',
  espresso: '#2C1810',

  // Trunk-specific
  leather: '#8B4513',
  leatherLight: '#A0522D',
  brass: '#B8860B',
  brassLight: '#DAA520',
  canvas: '#F5F5DC',

  // Telegram paper
  telegraph: '#FFFEF0',
  telegraphAged: '#F5E6C8',
  inkBlue: '#1A365D',
  stampRed: '#8B0000',
};

// Reminder types with urgency levels
type ReminderUrgency = 'low' | 'medium' | 'high' | 'critical';

interface PackingReminder {
  id: string;
  type: 'packing' | 'document' | 'booking' | 'health' | 'general';
  title: string;
  message: string;
  daysBeforeTrip: number;
  urgency: ReminderUrgency;
  icon: string;
  isCompleted: boolean;
  link?: string;
}

interface PackingRemindersProps {
  tripName: string;
  departureDate: Date;
  reminders: PackingReminder[];
  onCompleteReminder: (id: string) => void;
  onDismissReminder: (id: string) => void;
  className?: string;
}

// Reminder type configurations
const reminderTypeConfig = {
  packing: {
    label: 'PACKING',
    color: colors.leather,
    icon: '🧳',
  },
  document: {
    label: 'DOCUMENTS',
    color: colors.inkBlue,
    icon: '📄',
  },
  booking: {
    label: 'BOOKING',
    color: colors.terracotta,
    icon: '🎫',
  },
  health: {
    label: 'HEALTH',
    color: colors.sage,
    icon: '💊',
  },
  general: {
    label: 'REMINDER',
    color: colors.golden,
    icon: '📌',
  },
};

const urgencyConfig = {
  low: {
    label: 'When you can',
    color: colors.sage,
    bgColor: 'rgba(125, 132, 113, 0.1)',
  },
  medium: {
    label: 'Soon',
    color: colors.golden,
    bgColor: 'rgba(212, 165, 116, 0.1)',
  },
  high: {
    label: 'Important',
    color: colors.terracotta,
    bgColor: 'rgba(200, 75, 49, 0.1)',
  },
  critical: {
    label: 'URGENT',
    color: colors.stampRed,
    bgColor: 'rgba(139, 0, 0, 0.15)',
  },
};

// =============================================================================
// TELEGRAM PAPER TEXTURE
// =============================================================================
const TelegramTexture: React.FC = () => (
  <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, opacity: 0.3, pointerEvents: 'none' }}>
    <defs>
      <pattern id="telegramLines" patternUnits="userSpaceOnUse" width="100%" height="24">
        <line x1="0" y1="23" x2="100%" y2="23" stroke={colors.inkBlue} strokeWidth="0.5" opacity="0.2" />
      </pattern>
      <filter id="paperNoise">
        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="5" result="noise" />
        <feDiffuseLighting in="noise" lightingColor={colors.telegraph} surfaceScale="2">
          <feDistantLight azimuth="45" elevation="60" />
        </feDiffuseLighting>
      </filter>
    </defs>
    <rect width="100%" height="100%" fill="url(#telegramLines)" />
  </svg>
);

// =============================================================================
// VINTAGE STAMP
// =============================================================================
const VintageStamp: React.FC<{ text: string; color: string; rotation?: number }> = ({
  text,
  color,
  rotation = -12
}) => (
  <motion.div
    initial={{ scale: 0, rotate: rotation - 20 }}
    animate={{ scale: 1, rotate: rotation }}
    transition={{ type: 'spring', damping: 10, stiffness: 200, delay: 0.2 }}
    style={{
      position: 'absolute',
      top: '8px',
      right: '12px',
      padding: '4px 12px',
      border: `2px solid ${color}`,
      borderRadius: '4px',
      fontFamily: '"Courier New", monospace',
      fontSize: '10px',
      fontWeight: 700,
      letterSpacing: '2px',
      color: color,
      textTransform: 'uppercase',
      transform: `rotate(${rotation}deg)`,
      opacity: 0.8,
    }}
  >
    {text}
  </motion.div>
);

// =============================================================================
// TELEGRAM HEADER
// =============================================================================
const TelegramHeader: React.FC<{ type: keyof typeof reminderTypeConfig }> = ({ type }) => {
  const config = reminderTypeConfig[type];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '12px',
      borderBottom: `1px dashed ${colors.inkBlue}`,
      paddingBottom: '8px',
    }}>
      <span style={{ fontSize: '16px' }}>{config.icon}</span>
      <span style={{
        fontFamily: '"Courier New", monospace',
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '3px',
        color: config.color,
        textTransform: 'uppercase',
      }}>
        {config.label}
      </span>
      <div style={{
        flex: 1,
        height: '1px',
        background: `repeating-linear-gradient(90deg, ${colors.inkBlue} 0, ${colors.inkBlue} 4px, transparent 4px, transparent 8px)`,
        opacity: 0.3,
      }} />
    </div>
  );
};

// =============================================================================
// SINGLE REMINDER CARD (TELEGRAM STYLE)
// =============================================================================
const ReminderCard: React.FC<{
  reminder: PackingReminder;
  daysUntilTrip: number;
  onComplete: () => void;
  onDismiss: () => void;
}> = ({ reminder, daysUntilTrip, onComplete, onDismiss }) => {
  const [isHovered, setIsHovered] = useState(false);
  const urgency = urgencyConfig[reminder.urgency];
  const typeConfig = reminderTypeConfig[reminder.type];

  const isDue = daysUntilTrip <= reminder.daysBeforeTrip;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, rotateX: -10 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      exit={{ opacity: 0, x: 100, rotateY: 20 }}
      whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      style={{
        position: 'relative',
        background: reminder.isCompleted
          ? `linear-gradient(135deg, ${colors.canvas} 0%, ${colors.cream} 100%)`
          : `linear-gradient(135deg, ${colors.telegraph} 0%, ${colors.telegraphAged} 100%)`,
        borderRadius: '2px',
        padding: '16px 20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)',
        border: `1px solid ${reminder.isCompleted ? colors.sage : typeConfig.color}`,
        overflow: 'hidden',
        opacity: reminder.isCompleted ? 0.6 : 1,
        cursor: 'pointer',
      }}
    >
      {/* Paper texture */}
      <TelegramTexture />

      {/* Urgency stamp for critical items */}
      {reminder.urgency === 'critical' && !reminder.isCompleted && (
        <VintageStamp text="URGENT" color={colors.stampRed} rotation={-8} />
      )}

      {/* Completed stamp */}
      {reminder.isCompleted && (
        <VintageStamp text="DONE" color={colors.sage} rotation={-15} />
      )}

      {/* Due indicator */}
      {isDue && !reminder.isCompleted && (
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: urgency.color,
          }}
        />
      )}

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <TelegramHeader type={reminder.type} />

        {/* Title */}
        <h4 style={{
          fontFamily: '"Courier New", monospace',
          fontSize: '14px',
          fontWeight: 700,
          color: colors.espresso,
          marginBottom: '8px',
          textDecoration: reminder.isCompleted ? 'line-through' : 'none',
          letterSpacing: '0.5px',
        }}>
          {reminder.title}
        </h4>

        {/* Message */}
        <p style={{
          fontFamily: 'Georgia, serif',
          fontSize: '13px',
          color: colors.espresso,
          opacity: 0.8,
          lineHeight: 1.5,
          marginBottom: '12px',
        }}>
          {reminder.message}
        </p>

        {/* Footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: `1px dotted ${colors.inkBlue}`,
          paddingTop: '10px',
          marginTop: '4px',
        }}>
          {/* Days indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <span style={{
              fontSize: '11px',
              fontFamily: '"Courier New", monospace',
              color: isDue ? urgency.color : colors.sage,
              fontWeight: isDue ? 700 : 400,
            }}>
              {isDue ? (
                reminder.daysBeforeTrip === 0
                  ? '⚡ TODAY'
                  : `⚡ ${reminder.daysBeforeTrip}d before trip`
              ) : (
                `📅 Due in ${reminder.daysBeforeTrip - daysUntilTrip}d`
              )}
            </span>
          </div>

          {/* Actions */}
          <AnimatePresence>
            {(isHovered || isDue) && !reminder.isCompleted && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                style={{ display: 'flex', gap: '8px' }}
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onComplete();
                  }}
                  style={{
                    padding: '4px 12px',
                    background: colors.sage,
                    border: 'none',
                    borderRadius: '2px',
                    color: 'white',
                    fontSize: '11px',
                    fontFamily: '"Courier New", monospace',
                    fontWeight: 700,
                    cursor: 'pointer',
                    letterSpacing: '1px',
                  }}
                >
                  ✓ DONE
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismiss();
                  }}
                  style={{
                    padding: '4px 8px',
                    background: 'transparent',
                    border: `1px solid ${colors.sage}`,
                    borderRadius: '2px',
                    color: colors.sage,
                    fontSize: '11px',
                    fontFamily: '"Courier New", monospace',
                    cursor: 'pointer',
                  }}
                >
                  ✕
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Perforated edge effect */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '8px',
        background: `repeating-linear-gradient(
          90deg,
          transparent 0,
          transparent 8px,
          ${colors.cream} 8px,
          ${colors.cream} 10px
        )`,
        opacity: 0.5,
      }} />
    </motion.div>
  );
};

// =============================================================================
// TIMELINE INDICATOR
// =============================================================================
const TimelineIndicator: React.FC<{
  daysUntilTrip: number;
  totalDays: number;
}> = ({ daysUntilTrip, totalDays }) => {
  const progress = Math.max(0, Math.min(100, ((totalDays - daysUntilTrip) / totalDays) * 100));

  return (
    <div style={{
      padding: '16px 20px',
      background: `linear-gradient(135deg, ${colors.leather} 0%, ${colors.leatherLight} 100%)`,
      borderRadius: '4px',
      marginBottom: '20px',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
      }}>
        <span style={{
          fontFamily: '"Courier New", monospace',
          fontSize: '11px',
          color: colors.canvas,
          letterSpacing: '2px',
          fontWeight: 700,
        }}>
          DEPARTURE COUNTDOWN
        </span>
        <span style={{
          fontFamily: 'Georgia, serif',
          fontSize: '18px',
          fontWeight: 700,
          color: colors.brassLight,
        }}>
          {daysUntilTrip} days
        </span>
      </div>

      {/* Progress track */}
      <div style={{
        position: 'relative',
        height: '12px',
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '6px',
        overflow: 'hidden',
      }}>
        {/* Progress fill */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{
            height: '100%',
            background: `linear-gradient(90deg, ${colors.brass} 0%, ${colors.brassLight} 100%)`,
            borderRadius: '6px',
          }}
        />

        {/* Airplane marker */}
        <motion.div
          initial={{ left: 0 }}
          animate={{ left: `${progress}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '16px',
          }}
        >
          ✈️
        </motion.div>

        {/* Destination marker */}
        <div style={{
          position: 'absolute',
          right: '4px',
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: '12px',
        }}>
          🏝️
        </div>
      </div>

      {/* Labels */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '8px',
        fontSize: '10px',
        fontFamily: '"Courier New", monospace',
        color: colors.canvas,
        opacity: 0.7,
      }}>
        <span>Today</span>
        <span>Trip Begins</span>
      </div>
    </div>
  );
};

// =============================================================================
// QUICK ACTIONS BAR
// =============================================================================
const QuickActionsBar: React.FC<{
  pendingCount: number;
  urgentCount: number;
  onViewAll: () => void;
  onViewUrgent: () => void;
}> = ({ pendingCount, urgentCount, onViewAll, onViewUrgent }) => (
  <div style={{
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
  }}>
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onViewAll}
      style={{
        flex: 1,
        padding: '12px',
        background: colors.cream,
        border: `1px solid ${colors.golden}`,
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        cursor: 'pointer',
      }}
    >
      <span style={{ fontSize: '16px' }}>📋</span>
      <span style={{
        fontFamily: '"Courier New", monospace',
        fontSize: '12px',
        color: colors.espresso,
      }}>
        All Tasks ({pendingCount})
      </span>
    </motion.button>

    {urgentCount > 0 && (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onViewUrgent}
        animate={{
          boxShadow: ['0 0 0 0 rgba(200,75,49,0)', '0 0 0 4px rgba(200,75,49,0.3)', '0 0 0 0 rgba(200,75,49,0)']
        }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{
          flex: 1,
          padding: '12px',
          background: urgencyConfig.high.bgColor,
          border: `1px solid ${colors.terracotta}`,
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: '16px' }}>⚡</span>
        <span style={{
          fontFamily: '"Courier New", monospace',
          fontSize: '12px',
          color: colors.terracotta,
          fontWeight: 700,
        }}>
          Urgent ({urgentCount})
        </span>
      </motion.button>
    )}
  </div>
);

// =============================================================================
// MAIN COMPONENT
// =============================================================================
const PackingReminders: React.FC<PackingRemindersProps> = ({
  tripName,
  departureDate,
  reminders,
  onCompleteReminder,
  onDismissReminder,
  className,
}) => {
  const [filter, setFilter] = useState<'all' | 'urgent' | 'completed'>('all');

  // Calculate days until trip
  const daysUntilTrip = useMemo(() => {
    const now = new Date();
    const diff = departureDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [departureDate]);

  // Sort and filter reminders
  const filteredReminders = useMemo(() => {
    let filtered = [...reminders];

    switch (filter) {
      case 'urgent':
        filtered = filtered.filter(r =>
          !r.isCompleted &&
          (r.urgency === 'critical' || r.urgency === 'high' || daysUntilTrip <= r.daysBeforeTrip)
        );
        break;
      case 'completed':
        filtered = filtered.filter(r => r.isCompleted);
        break;
      default:
        filtered = filtered.filter(r => !r.isCompleted);
    }

    // Sort by urgency and due date
    return filtered.sort((a, b) => {
      const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
      if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      }
      return b.daysBeforeTrip - a.daysBeforeTrip;
    });
  }, [reminders, filter, daysUntilTrip]);

  const pendingCount = reminders.filter(r => !r.isCompleted).length;
  const urgentCount = reminders.filter(r =>
    !r.isCompleted &&
    (r.urgency === 'critical' || r.urgency === 'high' || daysUntilTrip <= r.daysBeforeTrip)
  ).length;
  const completedCount = reminders.filter(r => r.isCompleted).length;

  return (
    <div
      className={className}
      style={{
        padding: '20px',
        background: `linear-gradient(180deg, ${colors.cream} 0%, ${colors.canvas} 100%)`,
        borderRadius: '8px',
        minHeight: '400px',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '20px',
      }}>
        <span style={{ fontSize: '24px' }}>📬</span>
        <div>
          <h3 style={{
            fontFamily: 'Georgia, serif',
            fontSize: '20px',
            fontWeight: 700,
            color: colors.espresso,
            marginBottom: '2px',
          }}>
            Travel Reminders
          </h3>
          <p style={{
            fontFamily: '"Courier New", monospace',
            fontSize: '11px',
            color: colors.sage,
            letterSpacing: '1px',
          }}>
            {tripName.toUpperCase()}
          </p>
        </div>
      </div>

      {/* Timeline */}
      <TimelineIndicator
        daysUntilTrip={Math.max(0, daysUntilTrip)}
        totalDays={30}
      />

      {/* Quick actions */}
      <QuickActionsBar
        pendingCount={pendingCount}
        urgentCount={urgentCount}
        onViewAll={() => setFilter('all')}
        onViewUrgent={() => setFilter('urgent')}
      />

      {/* Filter tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '16px',
        borderBottom: `1px solid ${colors.golden}`,
        paddingBottom: '12px',
      }}>
        {[
          { key: 'all', label: 'Pending', count: pendingCount },
          { key: 'urgent', label: 'Urgent', count: urgentCount },
          { key: 'completed', label: 'Done', count: completedCount },
        ].map((tab) => (
          <motion.button
            key={tab.key}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setFilter(tab.key as typeof filter)}
            style={{
              padding: '6px 12px',
              background: filter === tab.key ? colors.leather : 'transparent',
              border: `1px solid ${filter === tab.key ? colors.leather : colors.golden}`,
              borderRadius: '4px',
              fontFamily: '"Courier New", monospace',
              fontSize: '11px',
              fontWeight: filter === tab.key ? 700 : 400,
              color: filter === tab.key ? colors.canvas : colors.espresso,
              cursor: 'pointer',
              letterSpacing: '1px',
            }}
          >
            {tab.label} ({tab.count})
          </motion.button>
        ))}
      </div>

      {/* Reminders list */}
      <AnimatePresence mode="popLayout">
        {filteredReminders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: colors.sage,
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>
              {filter === 'completed' ? '🎉' : '✨'}
            </div>
            <p style={{
              fontFamily: 'Georgia, serif',
              fontSize: '14px',
            }}>
              {filter === 'completed'
                ? 'No completed reminders yet'
                : 'All caught up! No pending reminders.'}
            </p>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredReminders.map((reminder) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                daysUntilTrip={daysUntilTrip}
                onComplete={() => onCompleteReminder(reminder.id)}
                onDismiss={() => onDismissReminder(reminder.id)}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Footer tip */}
      {pendingCount > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            marginTop: '24px',
            padding: '12px 16px',
            background: `rgba(${parseInt(colors.golden.slice(1, 3), 16)}, ${parseInt(colors.golden.slice(3, 5), 16)}, ${parseInt(colors.golden.slice(5, 7), 16)}, 0.15)`,
            borderRadius: '4px',
            borderLeft: `3px solid ${colors.golden}`,
          }}
        >
          <p style={{
            fontFamily: 'Georgia, serif',
            fontSize: '12px',
            color: colors.espresso,
            fontStyle: 'italic',
          }}>
            💡 Tip: Check off tasks as you complete them to stay organized before your trip!
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default PackingReminders;
export type { PackingReminder, PackingRemindersProps, ReminderUrgency };

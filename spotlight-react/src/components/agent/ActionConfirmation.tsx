/**
 * ActionConfirmation - Visual feedback for agent actions
 *
 * Aesthetic: Vintage postcard / stamp of approval
 * - Playful entrance animation
 * - Success checkmark with confetti burst
 * - Auto-dismiss with graceful exit
 *
 * Shows when agent adds/modifies/removes activities
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  MapPin,
  Calendar,
  Sunrise,
  Sun,
  Moon,
  Sparkles,
  X
} from 'lucide-react';

export interface ActionConfirmationData {
  id: string;
  type: 'add' | 'replace' | 'move' | 'remove';
  activityName: string;
  dayNumber: number;
  timeSlot?: 'morning' | 'afternoon' | 'evening';
  city?: string;
  photo?: string;
}

interface ActionConfirmationProps {
  className?: string;
}

// Time slot icons and colors
const timeSlotConfig = {
  morning: { icon: Sunrise, color: 'text-amber-500', bg: 'bg-amber-50', label: 'Morning' },
  afternoon: { icon: Sun, color: 'text-orange-500', bg: 'bg-orange-50', label: 'Afternoon' },
  evening: { icon: Moon, color: 'text-indigo-500', bg: 'bg-indigo-50', label: 'Evening' },
};

// Action type config
const actionConfig = {
  add: { verb: 'Added', emoji: '✨', color: 'from-emerald-400 to-teal-500' },
  replace: { verb: 'Replaced with', emoji: '🔄', color: 'from-sky-400 to-blue-500' },
  move: { verb: 'Moved', emoji: '📍', color: 'from-violet-400 to-purple-500' },
  remove: { verb: 'Removed', emoji: '🗑️', color: 'from-rose-400 to-red-500' },
};

export function ActionConfirmation({ className = '' }: ActionConfirmationProps) {
  const [confirmations, setConfirmations] = useState<ActionConfirmationData[]>([]);

  // Listen for action confirmation events
  useEffect(() => {
    const handleActionConfirmation = (event: CustomEvent<ActionConfirmationData>) => {
      const data = event.detail;
      const id = data.id || `action_${Date.now()}`;

      setConfirmations(prev => [...prev, { ...data, id }]);

      // Auto-dismiss after 4 seconds
      setTimeout(() => {
        setConfirmations(prev => prev.filter(c => c.id !== id));
      }, 4000);
    };

    window.addEventListener('agent_action_confirmed', handleActionConfirmation as EventListener);

    return () => {
      window.removeEventListener('agent_action_confirmed', handleActionConfirmation as EventListener);
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    setConfirmations(prev => prev.filter(c => c.id !== id));
  }, []);

  if (confirmations.length === 0) return null;

  return (
    <div className={`fixed bottom-24 right-4 z-[1500] space-y-3 ${className}`}>
      <AnimatePresence mode="popLayout">
        {confirmations.map((confirmation) => (
          <ConfirmationToast
            key={confirmation.id}
            confirmation={confirmation}
            onDismiss={() => dismiss(confirmation.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Individual toast component
function ConfirmationToast({
  confirmation,
  onDismiss,
}: {
  confirmation: ActionConfirmationData;
  onDismiss: () => void;
}) {
  const { type, activityName, dayNumber, timeSlot, city, photo } = confirmation;
  const action = actionConfig[type];
  const slot = timeSlot ? timeSlotConfig[timeSlot] : null;
  const TimeIcon = slot?.icon || Calendar;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.8, rotateZ: -5 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotateZ: 0 }}
      exit={{ opacity: 0, x: 100, scale: 0.8 }}
      transition={{
        type: 'spring',
        damping: 20,
        stiffness: 300,
      }}
      className="relative"
    >
      {/* Main card */}
      <div
        className="
          relative overflow-hidden
          bg-white rounded-2xl shadow-2xl
          border border-gray-100
          min-w-[300px] max-w-[360px]
        "
        style={{
          boxShadow: '0 20px 50px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        {/* Gradient header */}
        <div className={`h-2 bg-gradient-to-r ${action.color}`} />

        {/* Content */}
        <div className="p-4">
          {/* Top row: Action badge + dismiss */}
          <div className="flex items-start justify-between mb-3">
            {/* Success badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', damping: 10 }}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-full
                bg-gradient-to-r ${action.color} text-white
                text-sm font-bold shadow-lg
              `}
            >
              <motion.div
                initial={{ rotate: -180, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Check className="w-4 h-4" strokeWidth={3} />
              </motion.div>
              <span>{action.verb}</span>
              <span className="text-lg">{action.emoji}</span>
            </motion.div>

            {/* Dismiss button */}
            <button
              onClick={onDismiss}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Activity info */}
          <div className="flex gap-3">
            {/* Photo thumbnail */}
            {photo ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 }}
                className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 shadow-md"
              >
                <img
                  src={photo}
                  alt={activityName}
                  className="w-full h-full object-cover"
                />
              </motion.div>
            ) : (
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6 text-gray-400" />
              </div>
            )}

            {/* Details */}
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-gray-900 truncate text-base">
                {activityName}
              </h4>

              <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                {/* Day badge */}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full font-medium">
                  <Calendar className="w-3 h-3" />
                  Day {dayNumber}
                </span>

                {/* Time slot badge */}
                {slot && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 ${slot.bg} rounded-full font-medium ${slot.color}`}>
                    <TimeIcon className="w-3 h-3" />
                    {slot.label}
                  </span>
                )}
              </div>

              {/* City */}
              {city && (
                <p className="text-xs text-gray-500 mt-1 truncate">
                  {city}
                </p>
              )}
            </div>
          </div>

          {/* Sparkle decorations */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="absolute top-3 right-12"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
          </motion.div>
        </div>

        {/* Confetti burst effect */}
        <ConfettiBurst />
      </div>
    </motion.div>
  );
}

// Confetti burst animation
function ConfettiBurst() {
  const particles = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    color: ['#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#3b82f6'][i % 5],
    angle: (i * 45) * (Math.PI / 180),
    distance: 30 + Math.random() * 20,
  }));

  return (
    <div className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{
            opacity: 1,
            scale: 1,
            x: 0,
            y: 0,
          }}
          animate={{
            opacity: 0,
            scale: 0.5,
            x: Math.cos(particle.angle) * particle.distance,
            y: Math.sin(particle.angle) * particle.distance - 20,
          }}
          transition={{
            duration: 0.6,
            delay: 0.2,
            ease: 'easeOut',
          }}
          className="absolute w-2 h-2 rounded-full"
          style={{ backgroundColor: particle.color }}
        />
      ))}
    </div>
  );
}

// Helper function to dispatch action confirmation events
export function dispatchActionConfirmation(data: Omit<ActionConfirmationData, 'id'>) {
  const event = new CustomEvent('agent_action_confirmed', {
    detail: { ...data, id: `action_${Date.now()}` }
  });
  window.dispatchEvent(event);
}

export default ActionConfirmation;

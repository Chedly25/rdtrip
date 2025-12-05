/**
 * MomentCapture - Beyond the Checkbox
 *
 * A beautiful modal that transforms the boring "Done" checkbox into
 * a meaningful moment capture experience. Users can:
 * - Mark as highlight of the day
 * - Capture a memory with photo and note
 * - Add a quick reflection
 * - Skip with context (triggers alternatives)
 *
 * Design: Warm, celebratory when highlighting. Photo upload integrated.
 * Motion: Confetti-like celebration for highlights, smooth transitions.
 */

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  Camera,
  SkipForward,
  X,
  Sparkles,
  Heart,
  Smile,
  Meh,
  Check,
  CloudRain,
  Clock,
  DoorClosed,
  MapPin,
  Upload,
} from 'lucide-react';
import { useTimeTheme } from '../hooks/useTimeOfDay';

type MomentType = 'highlight' | 'memory' | 'completed' | 'skipped';
type SkipReason = 'weather' | 'timing' | 'closed' | 'changed_mind' | 'other';

interface Activity {
  id?: string;
  name: string;
  type?: string;
  photo?: string;
}

interface MomentCaptureProps {
  activity: Activity;
  dayNumber: number;
  isOpen: boolean;
  onClose: () => void;
  onCapture: (moment: {
    activityName: string;
    momentType: MomentType;
    rating?: number;
    note?: string;
    photo?: string;
    dayNumber: number;
    skipReason?: SkipReason;
  }) => void;
}

// Celebration particles
const Particles: React.FC<{ color: string }> = ({ color }) => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {Array.from({ length: 20 }).map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-2 h-2 rounded-full"
        style={{
          background: color,
          left: `${Math.random() * 100}%`,
          top: '50%',
        }}
        initial={{ y: 0, opacity: 1, scale: 1 }}
        animate={{
          y: [0, -100 - Math.random() * 150],
          x: [0, (Math.random() - 0.5) * 100],
          opacity: [1, 1, 0],
          scale: [1, 0.5],
          rotate: [0, Math.random() * 360],
        }}
        transition={{
          duration: 1.5,
          delay: Math.random() * 0.3,
          ease: 'easeOut',
        }}
      />
    ))}
  </div>
);

// Rating selector with emotion icons
const RatingSelector: React.FC<{
  rating: number;
  onChange: (rating: number) => void;
}> = ({ rating, onChange }) => {
  const { theme } = useTimeTheme();

  const emotions = [
    { value: 1, icon: Meh, label: 'Meh' },
    { value: 2, icon: Smile, label: 'Nice' },
    { value: 3, icon: Heart, label: 'Loved it' },
  ];

  return (
    <div className="flex items-center justify-center gap-4 py-4">
      {emotions.map((emotion) => {
        const Icon = emotion.icon;
        const isSelected = rating === emotion.value;

        return (
          <motion.button
            key={emotion.value}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onChange(emotion.value)}
            className="flex flex-col items-center gap-2"
          >
            <motion.div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: isSelected ? theme.primary : `${theme.primary}15`,
                boxShadow: isSelected ? `0 4px 20px ${theme.glow}` : 'none',
              }}
              animate={isSelected ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <Icon
                className="w-8 h-8"
                style={{
                  color: isSelected ? 'white' : theme.primary,
                }}
              />
            </motion.div>
            <span
              className="text-xs font-medium"
              style={{
                color: isSelected ? theme.primary : theme.textMuted,
              }}
            >
              {emotion.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
};

// Skip reason selector
const SkipReasons: React.FC<{
  selected: SkipReason | null;
  onSelect: (reason: SkipReason) => void;
}> = ({ selected, onSelect }) => {
  const { theme } = useTimeTheme();

  const reasons = [
    { value: 'weather' as SkipReason, icon: CloudRain, label: 'Weather' },
    { value: 'timing' as SkipReason, icon: Clock, label: 'No time' },
    { value: 'closed' as SkipReason, icon: DoorClosed, label: 'Closed' },
    { value: 'changed_mind' as SkipReason, icon: MapPin, label: 'Changed plans' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {reasons.map((reason) => {
        const Icon = reason.icon;
        const isSelected = selected === reason.value;

        return (
          <motion.button
            key={reason.value}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(reason.value)}
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{
              background: isSelected ? `${theme.primary}20` : theme.cardBg,
              border: `1px solid ${isSelected ? theme.primary : theme.cardBorder}`,
            }}
          >
            <Icon
              className="w-5 h-5"
              style={{ color: isSelected ? theme.primary : theme.textMuted }}
            />
            <span
              className="text-sm font-medium"
              style={{ color: isSelected ? theme.primary : theme.textPrimary }}
            >
              {reason.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
};

export const MomentCapture: React.FC<MomentCaptureProps> = ({
  activity,
  dayNumber,
  isOpen,
  onClose,
  onCapture,
}) => {
  const { theme, isNight } = useTimeTheme();
  const [step, setStep] = useState<'choice' | 'highlight' | 'memory' | 'skip'>('choice');
  const [rating, setRating] = useState(3);
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [skipReason, setSkipReason] = useState<SkipReason | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleComplete = (type: MomentType) => {
    if (type === 'highlight') {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
    }

    onCapture({
      activityName: activity.name,
      momentType: type,
      rating: type === 'highlight' || type === 'memory' ? rating * 2 - 1 : undefined, // Convert 1-3 to 1-5
      note: note || undefined,
      photo: photo || undefined,
      dayNumber,
      skipReason: type === 'skipped' ? skipReason || 'other' : undefined,
    });

    // Reset and close
    setTimeout(() => {
      setStep('choice');
      setRating(3);
      setNote('');
      setPhoto(null);
      setSkipReason(null);
      onClose();
    }, type === 'highlight' ? 1500 : 300);
  };

  const handleQuickComplete = () => {
    handleComplete('completed');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50"
            style={{
              background: isNight ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(8px)',
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-hidden"
            style={{
              background: theme.cardBg,
              maxHeight: '85vh',
            }}
          >
            {/* Celebration Effect */}
            <AnimatePresence>
              {showCelebration && <Particles color={theme.primary} />}
            </AnimatePresence>

            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div
                className="w-10 h-1 rounded-full"
                style={{ background: theme.cardBorder }}
              />
            </div>

            {/* Close Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: `${theme.primary}15` }}
            >
              <X className="w-4 h-4" style={{ color: theme.textMuted }} />
            </motion.button>

            {/* Activity Header */}
            <div className="px-6 pb-4 text-center">
              <h2
                className="text-xl font-bold mb-1"
                style={{
                  color: theme.textPrimary,
                  fontFamily: "'Playfair Display', serif",
                }}
              >
                {activity.name}
              </h2>
              <p className="text-sm" style={{ color: theme.textMuted }}>
                How was this experience?
              </p>
            </div>

            {/* Content based on step */}
            <AnimatePresence mode="wait">
              {step === 'choice' && (
                <motion.div
                  key="choice"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="px-6 pb-8"
                >
                  {/* Main Options */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {/* Highlight */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setStep('highlight')}
                      className="p-4 rounded-2xl text-center"
                      style={{
                        background: `linear-gradient(135deg, ${theme.primary}20 0%, ${theme.secondary}20 100%)`,
                        border: `1px solid ${theme.primary}30`,
                      }}
                    >
                      <Star
                        className="w-8 h-8 mx-auto mb-2 fill-current"
                        style={{ color: theme.primary }}
                      />
                      <span
                        className="text-sm font-semibold"
                        style={{ color: theme.textPrimary }}
                      >
                        Highlight!
                      </span>
                      <p
                        className="text-xs mt-1"
                        style={{ color: theme.textMuted }}
                      >
                        Best moment today
                      </p>
                    </motion.button>

                    {/* Memory */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setStep('memory')}
                      className="p-4 rounded-2xl text-center"
                      style={{
                        background: theme.cardBg,
                        border: `1px solid ${theme.cardBorder}`,
                      }}
                    >
                      <Camera
                        className="w-8 h-8 mx-auto mb-2"
                        style={{ color: theme.primary }}
                      />
                      <span
                        className="text-sm font-semibold"
                        style={{ color: theme.textPrimary }}
                      >
                        Memory
                      </span>
                      <p
                        className="text-xs mt-1"
                        style={{ color: theme.textMuted }}
                      >
                        Add photo & note
                      </p>
                    </motion.button>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleQuickComplete}
                      className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2"
                      style={{
                        background: '#6B8E7B',
                        color: 'white',
                      }}
                    >
                      <Check className="w-5 h-5" />
                      <span className="font-medium">Done</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setStep('skip')}
                      className="py-3 px-4 rounded-xl flex items-center justify-center gap-2"
                      style={{
                        background: `${theme.textMuted}15`,
                        color: theme.textMuted,
                      }}
                    >
                      <SkipForward className="w-5 h-5" />
                      <span>Skip</span>
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {step === 'highlight' && (
                <motion.div
                  key="highlight"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="px-6 pb-8"
                >
                  <div className="text-center mb-4">
                    <Sparkles
                      className="w-12 h-12 mx-auto mb-2"
                      style={{ color: theme.primary }}
                    />
                    <p className="text-sm" style={{ color: theme.textMuted }}>
                      How much did you love it?
                    </p>
                  </div>

                  <RatingSelector rating={rating} onChange={setRating} />

                  {/* Optional Note */}
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Quick thought... (optional)"
                    className="w-full p-3 rounded-xl resize-none text-sm"
                    rows={2}
                    style={{
                      background: theme.cardBg,
                      border: `1px solid ${theme.cardBorder}`,
                      color: theme.textPrimary,
                    }}
                  />

                  <div className="flex gap-3 mt-4">
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setStep('choice')}
                      className="py-3 px-6 rounded-xl"
                      style={{
                        background: `${theme.textMuted}15`,
                        color: theme.textMuted,
                      }}
                    >
                      Back
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleComplete('highlight')}
                      className="flex-1 py-3 rounded-xl font-medium"
                      style={{
                        background: theme.primary,
                        color: 'white',
                        boxShadow: `0 4px 20px ${theme.glow}`,
                      }}
                    >
                      Save Highlight
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {step === 'memory' && (
                <motion.div
                  key="memory"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="px-6 pb-8"
                >
                  {/* Photo Upload */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-40 rounded-2xl mb-4 flex flex-col items-center justify-center overflow-hidden"
                    style={{
                      background: photo ? 'transparent' : `${theme.primary}10`,
                      border: `2px dashed ${theme.primary}40`,
                    }}
                  >
                    {photo ? (
                      <img
                        src={photo}
                        alt="Memory"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <>
                        <Upload
                          className="w-8 h-8 mb-2"
                          style={{ color: theme.primary }}
                        />
                        <span
                          className="text-sm"
                          style={{ color: theme.textMuted }}
                        >
                          Add a photo
                        </span>
                      </>
                    )}
                  </motion.button>

                  {/* Note */}
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="What made this special?"
                    className="w-full p-3 rounded-xl resize-none text-sm mb-4"
                    rows={3}
                    style={{
                      background: theme.cardBg,
                      border: `1px solid ${theme.cardBorder}`,
                      color: theme.textPrimary,
                    }}
                  />

                  <RatingSelector rating={rating} onChange={setRating} />

                  <div className="flex gap-3">
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setStep('choice')}
                      className="py-3 px-6 rounded-xl"
                      style={{
                        background: `${theme.textMuted}15`,
                        color: theme.textMuted,
                      }}
                    >
                      Back
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleComplete('memory')}
                      className="flex-1 py-3 rounded-xl font-medium"
                      style={{
                        background: theme.primary,
                        color: 'white',
                      }}
                    >
                      Save Memory
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {step === 'skip' && (
                <motion.div
                  key="skip"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="pb-8"
                >
                  <p
                    className="text-center text-sm mb-2 px-6"
                    style={{ color: theme.textMuted }}
                  >
                    No worries! What happened?
                  </p>

                  <SkipReasons
                    selected={skipReason}
                    onSelect={setSkipReason}
                  />

                  <div className="flex gap-3 px-6">
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setStep('choice')}
                      className="py-3 px-6 rounded-xl"
                      style={{
                        background: `${theme.textMuted}15`,
                        color: theme.textMuted,
                      }}
                    >
                      Back
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleComplete('skipped')}
                      disabled={!skipReason}
                      className="flex-1 py-3 rounded-xl font-medium disabled:opacity-50"
                      style={{
                        background: theme.textMuted,
                        color: 'white',
                      }}
                    >
                      Skip Activity
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MomentCapture;

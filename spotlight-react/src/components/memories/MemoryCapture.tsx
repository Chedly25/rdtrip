/**
 * Memory Capture - Floating Memory Button
 *
 * A floating action button that expands into a quick memory capture interface.
 * Design: "Instant Memories" - camera shutter, polaroid burst, quick capture
 *
 * Features:
 * - Floating action button with pulse animation
 * - Expands to quick capture options
 * - Photo, note, or highlight modes
 * - Location auto-tagging
 * - Haptic feedback feel via motion
 */

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  PenLine,
  Star,
  X,
  MapPin,
  Sparkles,
  Send,
  Image,
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

// Memory type definitions
type MemoryType = 'photo' | 'note' | 'highlight';

interface MemoryOption {
  type: MemoryType;
  icon: React.ElementType;
  label: string;
  color: string;
  description: string;
}

const memoryOptions: MemoryOption[] = [
  {
    type: 'photo',
    icon: Camera,
    label: 'Photo',
    color: colors.terracotta,
    description: 'Capture this moment',
  },
  {
    type: 'note',
    icon: PenLine,
    label: 'Note',
    color: colors.sage,
    description: 'Write a thought',
  },
  {
    type: 'highlight',
    icon: Star,
    label: 'Highlight',
    color: colors.golden,
    description: 'Mark as special',
  },
];

// Floating Action Button
const FloatingButton = ({
  onClick,
  isExpanded,
}: {
  onClick: () => void;
  isExpanded: boolean;
}) => (
  <motion.button
    onClick={onClick}
    className="relative w-16 h-16 rounded-full flex items-center justify-center shadow-2xl"
    style={{
      background: `linear-gradient(135deg, ${colors.terracotta} 0%, ${colors.terracottaLight} 100%)`,
      boxShadow: `0 8px 32px ${colors.terracotta}50, 0 0 0 4px ${colors.cream}`,
    }}
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
    animate={{
      rotate: isExpanded ? 45 : 0,
    }}
    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
  >
    {/* Pulse ring */}
    {!isExpanded && (
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ border: `2px solid ${colors.terracotta}` }}
        animate={{
          scale: [1, 1.4, 1.4],
          opacity: [0.6, 0, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeOut',
        }}
      />
    )}

    <AnimatePresence mode="wait">
      {isExpanded ? (
        <motion.div
          key="close"
          initial={{ rotate: -45, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 45, opacity: 0 }}
        >
          <X className="w-7 h-7 text-white" />
        </motion.div>
      ) : (
        <motion.div
          key="camera"
          initial={{ rotate: 45, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: -45, opacity: 0 }}
        >
          <Camera className="w-7 h-7 text-white" />
        </motion.div>
      )}
    </AnimatePresence>

    {/* Camera flash effect */}
    <motion.div
      className="absolute inset-0 rounded-full bg-white"
      initial={{ opacity: 0 }}
      whileTap={{ opacity: [0, 0.8, 0] }}
      transition={{ duration: 0.15 }}
    />
  </motion.button>
);

// Memory Option Card
const MemoryOptionCard = ({
  option,
  index,
  onSelect,
}: {
  option: MemoryOption;
  index: number;
  onSelect: (type: MemoryType) => void;
}) => {
  const Icon = option.icon;

  return (
    <motion.button
      initial={{ opacity: 0, y: 30, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.8 }}
      transition={{
        delay: index * 0.08,
        type: 'spring',
        stiffness: 400,
        damping: 25,
      }}
      onClick={() => onSelect(option.type)}
      className="flex flex-col items-center gap-2 p-4 rounded-2xl group"
      style={{
        background: `${option.color}10`,
        border: `1.5px solid ${option.color}30`,
      }}
      whileHover={{
        scale: 1.05,
        background: `${option.color}20`,
        borderColor: option.color,
      }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className="w-14 h-14 rounded-xl flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${option.color} 0%, ${option.color}DD 100%)`,
          boxShadow: `0 4px 15px ${option.color}40`,
        }}
        whileHover={{ rotate: [0, -5, 5, 0] }}
        transition={{ duration: 0.4 }}
      >
        <Icon className="w-6 h-6 text-white" />
      </motion.div>
      <span className="text-sm font-medium" style={{ color: colors.darkBrown }}>
        {option.label}
      </span>
      <span className="text-xs" style={{ color: colors.lightBrown }}>
        {option.description}
      </span>
    </motion.button>
  );
};

// Quick Note Input
const QuickNoteInput = ({
  value,
  onChange,
  onSubmit,
  onCancel,
  currentLocation,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  currentLocation?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 20 }}
    className="p-4 rounded-2xl"
    style={{
      background: colors.cream,
      border: `1px solid ${colors.border}`,
      boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
    }}
  >
    {/* Location tag */}
    {currentLocation && (
      <div
        className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg"
        style={{ background: `${colors.terracotta}10` }}
      >
        <MapPin className="w-4 h-4" style={{ color: colors.terracotta }} />
        <span className="text-sm" style={{ color: colors.darkBrown }}>
          {currentLocation}
        </span>
      </div>
    )}

    {/* Note input with lined paper effect */}
    <div
      className="relative rounded-xl overflow-hidden mb-3"
      style={{
        background: `linear-gradient(180deg, ${colors.cream} 0%, ${colors.warmWhite} 100%)`,
        border: `1px solid ${colors.border}`,
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(transparent, transparent 27px, ${colors.border}40 28px)`,
          backgroundPosition: '0 8px',
        }}
      />
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="What's happening right now..."
        className="w-full p-4 bg-transparent resize-none relative z-10 outline-none"
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: '20px',
          lineHeight: '28px',
          color: colors.darkBrown,
          minHeight: '112px',
        }}
        maxLength={280}
        autoFocus
      />
    </div>

    {/* Actions */}
    <div className="flex items-center justify-between">
      <span className="text-xs" style={{ color: colors.lightBrown }}>
        {value.length}/280
      </span>
      <div className="flex gap-2">
        <motion.button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm"
          style={{
            background: colors.warmWhite,
            color: colors.mediumBrown,
            border: `1px solid ${colors.border}`,
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Cancel
        </motion.button>
        <motion.button
          onClick={onSubmit}
          disabled={!value.trim()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
          style={{
            background: value.trim()
              ? `linear-gradient(135deg, ${colors.sage} 0%, ${colors.sageLight} 100%)`
              : colors.border,
            color: value.trim() ? 'white' : colors.lightBrown,
            boxShadow: value.trim() ? `0 4px 15px ${colors.sage}40` : 'none',
          }}
          whileHover={value.trim() ? { scale: 1.02 } : {}}
          whileTap={value.trim() ? { scale: 0.98 } : {}}
        >
          <Send className="w-4 h-4" />
          Save
        </motion.button>
      </div>
    </div>
  </motion.div>
);

// Highlight Quick Action
const HighlightAction = ({
  onConfirm,
  onCancel,
  currentActivity,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  currentActivity?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className="p-5 rounded-2xl text-center"
    style={{
      background: colors.cream,
      border: `1px solid ${colors.golden}40`,
      boxShadow: `0 10px 40px rgba(0,0,0,0.15), 0 0 0 1px ${colors.golden}20`,
    }}
  >
    <motion.div
      className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
      style={{
        background: `linear-gradient(135deg, ${colors.golden} 0%, ${colors.goldenDark} 100%)`,
        boxShadow: `0 8px 25px ${colors.golden}50`,
      }}
      animate={{
        boxShadow: [
          `0 8px 25px ${colors.golden}50`,
          `0 8px 35px ${colors.golden}70`,
          `0 8px 25px ${colors.golden}50`,
        ],
      }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <Sparkles className="w-8 h-8 text-white" />
    </motion.div>

    <h3 className="text-lg font-serif font-medium mb-2" style={{ color: colors.darkBrown }}>
      Mark as Highlight?
    </h3>

    {currentActivity && (
      <p className="text-sm mb-4" style={{ color: colors.lightBrown }}>
        "{currentActivity}" will be featured in your trip recap
      </p>
    )}

    <div className="flex gap-3 justify-center">
      <motion.button
        onClick={onCancel}
        className="px-5 py-2.5 rounded-xl text-sm"
        style={{
          background: colors.warmWhite,
          color: colors.mediumBrown,
          border: `1px solid ${colors.border}`,
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Not now
      </motion.button>
      <motion.button
        onClick={onConfirm}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm"
        style={{
          background: `linear-gradient(135deg, ${colors.golden} 0%, ${colors.goldenDark} 100%)`,
          color: 'white',
          boxShadow: `0 4px 15px ${colors.golden}40`,
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Star className="w-4 h-4" />
        Mark Highlight
      </motion.button>
    </div>
  </motion.div>
);

// Success Feedback
const SuccessFeedback = ({ type }: { type: MemoryType }) => {
  const config = {
    photo: { icon: Camera, text: 'Photo saved!', color: colors.terracotta },
    note: { icon: PenLine, text: 'Note added!', color: colors.sage },
    highlight: { icon: Star, text: 'Highlighted!', color: colors.golden },
  };
  const { icon: Icon, text, color } = config[type];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.5, y: -20 }}
      className="flex items-center gap-3 px-5 py-3 rounded-full"
      style={{
        background: color,
        boxShadow: `0 8px 25px ${color}50`,
      }}
    >
      <Icon className="w-5 h-5 text-white" />
      <span className="text-white font-medium">{text}</span>
    </motion.div>
  );
};

export interface MemoryCaptureProps {
  currentLocation?: string;
  currentActivity?: string;
  onPhotoCapture: () => void;
  onNoteSubmit: (note: string) => void;
  onHighlightConfirm: () => void;
  position?: 'bottom-right' | 'bottom-center';
  className?: string;
}

export const MemoryCapture: React.FC<MemoryCaptureProps> = ({
  currentLocation,
  currentActivity,
  onPhotoCapture,
  onNoteSubmit,
  onHighlightConfirm,
  position = 'bottom-right',
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeMode, setActiveMode] = useState<MemoryType | null>(null);
  const [noteValue, setNoteValue] = useState('');
  const [showSuccess, setShowSuccess] = useState<MemoryType | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleToggle = useCallback(() => {
    setIsExpanded(!isExpanded);
    setActiveMode(null);
    setNoteValue('');
  }, [isExpanded]);

  const handleSelectType = useCallback((type: MemoryType) => {
    if (type === 'photo') {
      fileInputRef.current?.click();
    } else {
      setActiveMode(type);
    }
  }, []);

  const handlePhotoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onPhotoCapture();
      setShowSuccess('photo');
      setTimeout(() => {
        setShowSuccess(null);
        setIsExpanded(false);
      }, 1500);
    }
  }, [onPhotoCapture]);

  const handleNoteSubmit = useCallback(() => {
    if (noteValue.trim()) {
      onNoteSubmit(noteValue);
      setShowSuccess('note');
      setTimeout(() => {
        setShowSuccess(null);
        setIsExpanded(false);
        setActiveMode(null);
        setNoteValue('');
      }, 1500);
    }
  }, [noteValue, onNoteSubmit]);

  const handleHighlightConfirm = useCallback(() => {
    onHighlightConfirm();
    setShowSuccess('highlight');
    setTimeout(() => {
      setShowSuccess(null);
      setIsExpanded(false);
      setActiveMode(null);
    }, 1500);
  }, [onHighlightConfirm]);

  const handleCancel = useCallback(() => {
    setActiveMode(null);
    setNoteValue('');
  }, []);

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2',
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50 ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoChange}
        className="hidden"
      />

      {/* Expanded panel */}
      <AnimatePresence>
        {isExpanded && !showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-20 right-0 min-w-[280px]"
          >
            {/* Active mode content */}
            {activeMode === 'note' && (
              <QuickNoteInput
                value={noteValue}
                onChange={setNoteValue}
                onSubmit={handleNoteSubmit}
                onCancel={handleCancel}
                currentLocation={currentLocation}
              />
            )}

            {activeMode === 'highlight' && (
              <HighlightAction
                onConfirm={handleHighlightConfirm}
                onCancel={handleCancel}
                currentActivity={currentActivity}
              />
            )}

            {/* Option cards when no mode selected */}
            {!activeMode && (
              <motion.div
                className="p-4 rounded-2xl"
                style={{
                  background: colors.cream,
                  border: `1px solid ${colors.border}`,
                  boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4" style={{ color: colors.golden }} />
                  <span className="text-sm font-medium" style={{ color: colors.darkBrown }}>
                    Capture a memory
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {memoryOptions.map((option, index) => (
                    <MemoryOptionCard
                      key={option.type}
                      option={option}
                      index={index}
                      onSelect={handleSelectType}
                    />
                  ))}
                </div>

                {/* Quick photo button with gallery icon */}
                <motion.button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full mt-3 py-3 rounded-xl flex items-center justify-center gap-2"
                  style={{
                    background: `${colors.terracotta}10`,
                    border: `1px dashed ${colors.terracotta}40`,
                  }}
                  whileHover={{
                    background: `${colors.terracotta}20`,
                    borderColor: colors.terracotta,
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Image className="w-4 h-4" style={{ color: colors.terracotta }} />
                  <span className="text-sm" style={{ color: colors.terracotta }}>
                    Choose from library
                  </span>
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success feedback */}
      <AnimatePresence>
        {showSuccess && (
          <div className="absolute bottom-20 right-0">
            <SuccessFeedback type={showSuccess} />
          </div>
        )}
      </AnimatePresence>

      {/* Floating button */}
      <FloatingButton onClick={handleToggle} isExpanded={isExpanded} />
    </div>
  );
};

// Compact version for inline use
export const MemoryCaptureInline: React.FC<{
  onCapture: (type: MemoryType) => void;
  className?: string;
}> = ({ onCapture, className = '' }) => (
  <div className={`flex gap-2 ${className}`}>
    {memoryOptions.map((option) => {
      const Icon = option.icon;
      return (
        <motion.button
          key={option.type}
          onClick={() => onCapture(option.type)}
          className="flex items-center gap-2 px-3 py-2 rounded-full"
          style={{
            background: `${option.color}10`,
            border: `1px solid ${option.color}30`,
          }}
          whileHover={{
            scale: 1.05,
            background: `${option.color}20`,
          }}
          whileTap={{ scale: 0.95 }}
        >
          <Icon className="w-4 h-4" style={{ color: option.color }} />
          <span className="text-sm" style={{ color: option.color }}>
            {option.label}
          </span>
        </motion.button>
      );
    })}
  </div>
);

export default MemoryCapture;

/**
 * Check-in Modal - Memory Capture
 *
 * A beautiful polaroid-inspired modal for capturing travel moments.
 * Design: "Instant Memories" - nostalgic, precious, tangible
 *
 * Features:
 * - Polaroid-style photo frame with developing animation
 * - Handwritten-style notes
 * - Location tag with coordinates
 * - Mood/weather capture
 * - Shake animation when "developing"
 * - Film grain overlay for authenticity
 */

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
  X,
  Camera,
  Image,
  MapPin,
  Clock,
  CloudSun,
  CloudRain,
  Sun,
  Cloud,
  Sparkles,
  Check,
  RotateCcw,
  Send,
  Star,
} from 'lucide-react';

// Wanderlust Editorial Colors
const colors = {
  cream: '#FFFBF5',
  warmWhite: '#FAF7F2',
  polaroidWhite: '#F8F6F0',
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
  filmBorder: '#1A1A1A',
};

// Mood options with colors
const moods = [
  { id: 'amazing', emoji: '🤩', label: 'Amazing', color: colors.golden },
  { id: 'happy', emoji: '😊', label: 'Happy', color: colors.sage },
  { id: 'peaceful', emoji: '😌', label: 'Peaceful', color: '#87CEEB' },
  { id: 'adventurous', emoji: '🤠', label: 'Adventurous', color: colors.terracotta },
  { id: 'tired', emoji: '😴', label: 'Tired', color: colors.lightBrown },
  { id: 'hungry', emoji: '🤤', label: 'Hungry', color: '#E07B39' },
];

// Weather options
const weatherOptions = [
  { id: 'sunny', icon: Sun, label: 'Sunny' },
  { id: 'cloudy', icon: Cloud, label: 'Cloudy' },
  { id: 'partly-cloudy', icon: CloudSun, label: 'Partly Cloudy' },
  { id: 'rainy', icon: CloudRain, label: 'Rainy' },
];

// Film grain SVG filter
const FilmGrainFilter = () => (
  <svg className="absolute w-0 h-0">
    <filter id="film-grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" result="noise" />
      <feColorMatrix type="saturate" values="0" />
      <feBlend in="SourceGraphic" in2="noise" mode="multiply" />
    </filter>
  </svg>
);

// Polaroid Frame Component
const PolaroidFrame = ({
  photo,
  isProcessing,
  onRemovePhoto,
}: {
  photo: string | null;
  isProcessing: boolean;
  onRemovePhoto: () => void;
}) => (
  <motion.div
    className="relative mx-auto"
    style={{ maxWidth: '280px' }}
    animate={isProcessing ? {
      rotate: [0, -2, 2, -1, 1, 0],
      transition: { duration: 0.5, repeat: 3 },
    } : {}}
  >
    {/* Polaroid outer frame */}
    <div
      className="p-3 pb-16 rounded-sm shadow-2xl relative"
      style={{
        background: colors.polaroidWhite,
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05)',
      }}
    >
      {/* Photo area */}
      <div
        className="aspect-square rounded-sm overflow-hidden relative"
        style={{
          background: photo ? 'transparent' : `linear-gradient(135deg, ${colors.filmBorder} 0%, #2d2d2d 100%)`,
        }}
      >
        {photo ? (
          <>
            <motion.img
              src={photo}
              alt="Check-in photo"
              className="w-full h-full object-cover"
              initial={{ opacity: 0, filter: 'brightness(2) contrast(0.5)' }}
              animate={{
                opacity: isProcessing ? 0.7 : 1,
                filter: isProcessing ? 'brightness(1.5) contrast(0.7) sepia(0.3)' : 'brightness(1) contrast(1) sepia(0.1)'
              }}
              transition={{ duration: 2 }}
            />
            {/* Film grain overlay */}
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              }}
            />
            {/* Processing overlay */}
            {isProcessing && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ background: 'rgba(0,0,0,0.3)' }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="w-8 h-8 text-white" />
                </motion.div>
              </motion.div>
            )}
            {/* Remove button */}
            {!isProcessing && (
              <motion.button
                onClick={onRemovePhoto}
                className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.5)' }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-4 h-4 text-white" />
              </motion.button>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-white/50">
            <Camera className="w-12 h-12 mb-2" />
            <span className="text-sm">No photo yet</span>
          </div>
        )}
      </div>

      {/* Polaroid bottom text area */}
      <div
        className="absolute bottom-3 left-3 right-3 h-10 flex items-center justify-center"
        style={{ fontFamily: "'Caveat', cursive" }}
      >
        <span className="text-lg" style={{ color: colors.lightBrown }}>
          {isProcessing ? 'Developing...' : ''}
        </span>
      </div>
    </div>

    {/* Tape decoration */}
    <div
      className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 -rotate-2"
      style={{
        background: 'linear-gradient(180deg, rgba(255,250,240,0.9) 0%, rgba(245,235,220,0.9) 100%)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    />
  </motion.div>
);

// Photo capture/upload buttons
const PhotoCapture = ({
  onCapture,
  onUpload,
}: {
  onCapture: () => void;
  onUpload: () => void;
}) => (
  <div className="flex gap-3 justify-center mt-6">
    <motion.button
      onClick={onCapture}
      className="flex items-center gap-2 px-5 py-3 rounded-full"
      style={{
        background: `linear-gradient(135deg, ${colors.terracotta} 0%, ${colors.terracottaLight} 100%)`,
        boxShadow: `0 4px 15px ${colors.terracotta}40`,
      }}
      whileHover={{ scale: 1.05, boxShadow: `0 6px 20px ${colors.terracotta}50` }}
      whileTap={{ scale: 0.95 }}
    >
      <Camera className="w-5 h-5 text-white" />
      <span className="text-white font-medium">Take Photo</span>
    </motion.button>

    <motion.button
      onClick={onUpload}
      className="flex items-center gap-2 px-5 py-3 rounded-full"
      style={{
        background: colors.warmWhite,
        border: `2px solid ${colors.border}`,
      }}
      whileHover={{ scale: 1.05, borderColor: colors.golden }}
      whileTap={{ scale: 0.95 }}
    >
      <Image className="w-5 h-5" style={{ color: colors.mediumBrown }} />
      <span style={{ color: colors.mediumBrown }} className="font-medium">Upload</span>
    </motion.button>
  </div>
);

// Mood selector
const MoodSelector = ({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (mood: string) => void;
}) => (
  <div className="mt-6">
    <label
      className="text-xs uppercase tracking-wider mb-3 block"
      style={{ color: colors.lightBrown }}
    >
      How are you feeling?
    </label>
    <div className="flex flex-wrap gap-2 justify-center">
      {moods.map((mood) => (
        <motion.button
          key={mood.id}
          onClick={() => onSelect(mood.id)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full transition-all"
          style={{
            background: selected === mood.id ? `${mood.color}20` : colors.warmWhite,
            border: `1.5px solid ${selected === mood.id ? mood.color : colors.border}`,
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="text-lg">{mood.emoji}</span>
          <span
            className="text-sm font-medium"
            style={{ color: selected === mood.id ? mood.color : colors.mediumBrown }}
          >
            {mood.label}
          </span>
        </motion.button>
      ))}
    </div>
  </div>
);

// Weather selector
const WeatherSelector = ({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (weather: string) => void;
}) => (
  <div className="mt-5">
    <label
      className="text-xs uppercase tracking-wider mb-3 block"
      style={{ color: colors.lightBrown }}
    >
      Weather right now
    </label>
    <div className="flex gap-2 justify-center">
      {weatherOptions.map((weather) => (
        <motion.button
          key={weather.id}
          onClick={() => onSelect(weather.id)}
          className="flex flex-col items-center gap-1 p-3 rounded-xl transition-all"
          style={{
            background: selected === weather.id ? `${colors.sage}15` : colors.warmWhite,
            border: `1.5px solid ${selected === weather.id ? colors.sage : colors.border}`,
            minWidth: '70px',
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <weather.icon
            className="w-6 h-6"
            style={{ color: selected === weather.id ? colors.sage : colors.lightBrown }}
          />
          <span
            className="text-xs"
            style={{ color: selected === weather.id ? colors.sage : colors.mediumBrown }}
          >
            {weather.label}
          </span>
        </motion.button>
      ))}
    </div>
  </div>
);

// Star rating component
const StarRating = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const ratingLabels = [
    '', // 0 - not used
    'Not for me',
    'It was okay',
    'Pretty good',
    'Really enjoyed it',
    'Absolutely amazing!',
  ];

  const displayValue = hoverValue ?? value;

  return (
    <div className="mt-5">
      <label
        className="text-xs uppercase tracking-wider mb-3 block"
        style={{ color: colors.lightBrown }}
      >
        Rate this experience
      </label>
      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <motion.button
              key={star}
              onClick={() => onChange(star)}
              onMouseEnter={() => setHoverValue(star)}
              onMouseLeave={() => setHoverValue(null)}
              className="p-1 transition-colors"
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
            >
              <Star
                className="w-8 h-8 transition-all duration-150"
                style={{
                  color: star <= displayValue ? colors.golden : colors.border,
                  fill: star <= displayValue ? colors.golden : 'transparent',
                  filter: star <= displayValue ? `drop-shadow(0 2px 4px ${colors.golden}40)` : 'none',
                }}
              />
            </motion.button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          {displayValue > 0 && (
            <motion.span
              key={displayValue}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="text-sm font-medium"
              style={{
                color: colors.golden,
                fontFamily: "'Caveat', cursive",
                fontSize: '18px',
              }}
            >
              {ratingLabels[displayValue]}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Note input with handwritten style
const NoteInput = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => (
  <div className="mt-5">
    <label
      className="text-xs uppercase tracking-wider mb-2 block"
      style={{ color: colors.lightBrown }}
    >
      Quick note (optional)
    </label>
    <div
      className="relative rounded-xl overflow-hidden"
      style={{
        background: `linear-gradient(180deg, ${colors.cream} 0%, ${colors.warmWhite} 100%)`,
        border: `1px solid ${colors.border}`,
      }}
    >
      {/* Lined paper effect */}
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
          minHeight: '84px',
        }}
        maxLength={280}
      />
    </div>
    <div className="flex justify-end mt-1">
      <span className="text-xs" style={{ color: colors.lightBrown }}>
        {value.length}/280
      </span>
    </div>
  </div>
);

// Location display
const LocationDisplay = ({
  name,
  coordinates,
}: {
  name: string;
  coordinates?: { lat: number; lng: number };
}) => (
  <div
    className="flex items-center gap-2 px-4 py-3 rounded-xl mt-5"
    style={{
      background: `${colors.terracotta}08`,
      border: `1px solid ${colors.terracotta}20`,
    }}
  >
    <MapPin className="w-5 h-5 flex-shrink-0" style={{ color: colors.terracotta }} />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium truncate" style={{ color: colors.darkBrown }}>
        {name}
      </p>
      {coordinates && (
        <p className="text-xs" style={{ color: colors.lightBrown }}>
          {coordinates.lat.toFixed(4)}°N, {coordinates.lng.toFixed(4)}°W
        </p>
      )}
    </div>
    <div className="flex items-center gap-1 text-xs" style={{ color: colors.lightBrown }}>
      <Clock className="w-3.5 h-3.5" />
      <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
    </div>
  </div>
);

// Success animation
const SuccessAnimation = () => (
  <motion.div
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    exit={{ scale: 0, opacity: 0 }}
    className="absolute inset-0 flex flex-col items-center justify-center z-50"
    style={{ background: `${colors.cream}F5` }}
  >
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: [0, 1.2, 1] }}
      transition={{ duration: 0.5, times: [0, 0.6, 1] }}
      className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
      style={{
        background: `linear-gradient(135deg, ${colors.sage} 0%, ${colors.sageLight} 100%)`,
        boxShadow: `0 10px 30px ${colors.sage}40`,
      }}
    >
      <Check className="w-10 h-10 text-white" />
    </motion.div>
    <motion.h3
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="text-xl font-serif"
      style={{ color: colors.darkBrown }}
    >
      Memory Captured!
    </motion.h3>
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="text-sm mt-2"
      style={{ color: colors.lightBrown }}
    >
      Added to your travel journal
    </motion.p>
  </motion.div>
);

interface CheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CheckinData) => void;
  activityName: string;
  activityType?: string;
  coordinates?: { lat: number; lng: number };
}

export interface CheckinData {
  photo?: string;
  note: string;
  mood?: string;
  weather?: string;
  rating?: number;
  timestamp: string;
  location: {
    name: string;
    coordinates?: { lat: number; lng: number };
  };
}

export const CheckinModal: React.FC<CheckinModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  activityName,
  activityType: _activityType,
  coordinates,
}) => {
  void _activityType; // Reserved for future type-specific UI

  const [photo, setPhoto] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [mood, setMood] = useState<string | null>(null);
  const [weather, setWeather] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = useCallback(() => {
    // In a real app, this would open the camera
    // For now, we'll trigger file upload
    fileInputRef.current?.click();
  }, []);

  const handleUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhoto(event.target?.result as string);
        // Simulate "developing" the photo
        setTimeout(() => setIsProcessing(false), 2000);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleRemovePhoto = useCallback(() => {
    setPhoto(null);
  }, []);

  const handleSubmit = useCallback(() => {
    setShowSuccess(true);

    const data: CheckinData = {
      photo: photo || undefined,
      note,
      mood: mood || undefined,
      weather: weather || undefined,
      rating: rating > 0 ? rating : undefined,
      timestamp: new Date().toISOString(),
      location: {
        name: activityName,
        coordinates,
      },
    };

    setTimeout(() => {
      onSubmit(data);
      onClose();
      // Reset state
      setPhoto(null);
      setNote('');
      setMood(null);
      setWeather(null);
      setRating(0);
      setShowSuccess(false);
    }, 1500);
  }, [photo, note, mood, weather, rating, activityName, coordinates, onSubmit, onClose]);

  const handleReset = useCallback(() => {
    setPhoto(null);
    setNote('');
    setMood(null);
    setWeather(null);
    setRating(0);
  }, []);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999]"
      >
        <FilmGrainFilter />

        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
          style={{
            background: 'rgba(44, 36, 23, 0.85)',
            backdropFilter: 'blur(8px)',
          }}
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="absolute bottom-0 left-0 right-0 max-h-[90vh] rounded-t-3xl overflow-hidden"
          style={{
            background: colors.cream,
            boxShadow: '0 -10px 40px rgba(0,0,0,0.3)',
          }}
        >
          {/* Success overlay */}
          <AnimatePresence>
            {showSuccess && <SuccessAnimation />}
          </AnimatePresence>

          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div
              className="w-12 h-1 rounded-full"
              style={{ background: colors.border }}
            />
          </div>

          {/* Header */}
          <div className="px-6 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${colors.terracotta} 0%, ${colors.terracottaLight} 100%)`,
                  boxShadow: `0 4px 15px ${colors.terracotta}30`,
                }}
              >
                <Camera className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-serif font-medium" style={{ color: colors.darkBrown }}>
                  Capture This Moment
                </h2>
                <p className="text-sm" style={{ color: colors.lightBrown }}>
                  Save it to your travel journal
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

          {/* Content */}
          <div className="px-6 pb-8 overflow-y-auto max-h-[75vh]">
            {/* Polaroid photo */}
            <PolaroidFrame
              photo={photo}
              isProcessing={isProcessing}
              onRemovePhoto={handleRemovePhoto}
            />

            {/* Photo capture buttons */}
            {!photo && (
              <PhotoCapture onCapture={handleCapture} onUpload={handleUpload} />
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Location */}
            <LocationDisplay name={activityName} coordinates={coordinates} />

            {/* Mood selector */}
            <MoodSelector selected={mood} onSelect={setMood} />

            {/* Weather selector */}
            <WeatherSelector selected={weather} onSelect={setWeather} />

            {/* Star rating */}
            <StarRating value={rating} onChange={setRating} />

            {/* Note input */}
            <NoteInput value={note} onChange={setNote} />

            {/* Action buttons */}
            <div className="flex gap-3 mt-6">
              <motion.button
                onClick={handleReset}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl flex-1"
                style={{
                  background: colors.warmWhite,
                  border: `1px solid ${colors.border}`,
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <RotateCcw className="w-4 h-4" style={{ color: colors.lightBrown }} />
                <span style={{ color: colors.mediumBrown }}>Reset</span>
              </motion.button>

              <motion.button
                onClick={handleSubmit}
                disabled={isProcessing}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl flex-[2]"
                style={{
                  background: `linear-gradient(135deg, ${colors.sage} 0%, ${colors.sageLight} 100%)`,
                  boxShadow: `0 4px 15px ${colors.sage}40`,
                  opacity: isProcessing ? 0.7 : 1,
                }}
                whileHover={!isProcessing ? { scale: 1.02, boxShadow: `0 6px 20px ${colors.sage}50` } : {}}
                whileTap={!isProcessing ? { scale: 0.98 } : {}}
              >
                <Send className="w-4 h-4 text-white" />
                <span className="text-white font-medium">Save Memory</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default CheckinModal;

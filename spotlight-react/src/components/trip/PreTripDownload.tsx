/**
 * Pre-Trip Download - Offline Preparation
 *
 * A beautiful sheet for downloading trip data before departure.
 * Shows storage estimates and download options.
 *
 * Design: "Packing Checklist" - organized, reassuring, preparation-focused
 *
 * Features:
 * - Storage space estimate
 * - Download progress animation
 * - Selective download (today only vs full trip)
 * - Success confirmation
 * - Delete cached data option
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
  X,
  Download,
  HardDrive,
  Calendar,
  Map,
  Image,
  Check,
  Trash2,
  CloudDownload,
  Sparkles,
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

// Format bytes to human readable
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Download Option Component
const DownloadOption = ({
  icon: Icon,
  title,
  description,
  size,
  isSelected,
  onSelect,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  size: string;
  isSelected: boolean;
  onSelect: () => void;
}) => (
  <motion.button
    onClick={onSelect}
    className="w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all"
    style={{
      background: isSelected ? `${colors.sage}10` : colors.warmWhite,
      border: `2px solid ${isSelected ? colors.sage : colors.border}`,
    }}
    whileHover={{ scale: 1.01 }}
    whileTap={{ scale: 0.99 }}
  >
    <div
      className="w-12 h-12 rounded-xl flex items-center justify-center"
      style={{
        background: isSelected ? `${colors.sage}20` : colors.cream,
      }}
    >
      <Icon
        className="w-6 h-6"
        style={{ color: isSelected ? colors.sage : colors.lightBrown }}
      />
    </div>
    <div className="flex-1">
      <h4
        className="text-base font-medium"
        style={{ color: isSelected ? colors.sage : colors.darkBrown }}
      >
        {title}
      </h4>
      <p className="text-sm" style={{ color: colors.lightBrown }}>
        {description}
      </p>
    </div>
    <div className="text-right">
      <span className="text-sm font-medium" style={{ color: colors.mediumBrown }}>
        {size}
      </span>
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-6 h-6 rounded-full flex items-center justify-center mt-1 ml-auto"
          style={{ background: colors.sage }}
        >
          <Check className="w-4 h-4 text-white" />
        </motion.div>
      )}
    </div>
  </motion.button>
);

// Progress Circle
const ProgressCircle = ({
  progress,
  size = 100,
}: {
  progress: number;
  size?: number;
}) => {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.border}
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.sage}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.5 }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span
          className="text-2xl font-bold"
          style={{ color: colors.darkBrown }}
          key={progress}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
        >
          {Math.round(progress)}%
        </motion.span>
      </div>
    </div>
  );
};

// Download item with check
const DownloadItem = ({
  label,
  isComplete,
  isActive,
}: {
  label: string;
  isComplete: boolean;
  isActive: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    className="flex items-center gap-3 py-2"
  >
    <div
      className="w-6 h-6 rounded-full flex items-center justify-center"
      style={{
        background: isComplete ? colors.sage : isActive ? `${colors.golden}20` : colors.border,
      }}
    >
      {isComplete ? (
        <Check className="w-4 h-4 text-white" />
      ) : isActive ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles className="w-3 h-3" style={{ color: colors.golden }} />
        </motion.div>
      ) : (
        <div className="w-2 h-2 rounded-full" style={{ background: colors.lightBrown }} />
      )}
    </div>
    <span
      className="text-sm"
      style={{
        color: isComplete ? colors.sage : isActive ? colors.golden : colors.lightBrown,
        fontWeight: isActive ? 500 : 400,
      }}
    >
      {label}
    </span>
  </motion.div>
);

interface PreTripDownloadProps {
  isOpen: boolean;
  onClose: () => void;
  tripName: string;
  totalDays: number;
  estimatedSizes: {
    today: number;
    fullTrip: number;
    withPhotos: number;
  };
  storageAvailable: number;
  isDownloaded: boolean;
  onDownload: (option: 'today' | 'full' | 'withPhotos') => Promise<void>;
  onDelete?: () => Promise<void>;
}

export const PreTripDownload: React.FC<PreTripDownloadProps> = ({
  isOpen,
  onClose,
  tripName,
  totalDays,
  estimatedSizes,
  storageAvailable,
  isDownloaded,
  onDownload,
  onDelete,
}) => {
  const [selectedOption, setSelectedOption] = useState<'today' | 'full' | 'withPhotos'>('full');
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const downloadSteps = [
    'Trip details',
    'Itinerary data',
    'Map tiles',
    'Restaurant info',
    'Contact numbers',
  ];

  const handleDownload = async () => {
    setIsDownloading(true);
    setProgress(0);
    setCurrentStep(0);
    setIsComplete(false);

    try {
      // Simulate progress through steps
      for (let i = 0; i < downloadSteps.length; i++) {
        setCurrentStep(i);
        for (let p = 0; p <= 100 / downloadSteps.length; p += 5) {
          await new Promise((r) => setTimeout(r, 50));
          setProgress((i * 100) / downloadSteps.length + p);
        }
      }

      await onDownload(selectedOption);
      setProgress(100);
      setCurrentStep(downloadSteps.length);
      setIsComplete(true);
    } catch {
      // Handle error
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete();
      onClose();
    } catch {
      // Handle error
    } finally {
      setIsDeleting(false);
    }
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
          className="absolute bottom-0 left-0 right-0 max-h-[90vh] rounded-t-3xl overflow-hidden flex flex-col"
          style={{
            background: colors.cream,
            boxShadow: '0 -10px 40px rgba(0,0,0,0.2)',
          }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
            <div className="w-12 h-1 rounded-full" style={{ background: colors.border }} />
          </div>

          {/* Header */}
          <div className="px-6 pb-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${colors.sage} 0%, ${colors.sageLight} 100%)`,
                  boxShadow: `0 4px 15px ${colors.sage}30`,
                }}
              >
                <CloudDownload className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2
                  className="text-lg font-serif font-medium"
                  style={{ color: colors.darkBrown }}
                >
                  {isDownloading || isComplete ? 'Downloading...' : 'Download for Offline'}
                </h2>
                <p className="text-sm" style={{ color: colors.lightBrown }}>
                  {tripName} · {totalDays} days
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
          <div className="px-6 pb-8 overflow-y-auto flex-1">
            <AnimatePresence mode="wait">
              {isDownloading || isComplete ? (
                /* Download Progress */
                <motion.div
                  key="progress"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-6"
                >
                  {/* Progress circle */}
                  <div className="flex justify-center mb-6">
                    <ProgressCircle progress={progress} />
                  </div>

                  {/* Download steps */}
                  <div className="space-y-1">
                    {downloadSteps.map((step, index) => (
                      <DownloadItem
                        key={step}
                        label={step}
                        isComplete={index < currentStep || isComplete}
                        isActive={index === currentStep && !isComplete}
                      />
                    ))}
                  </div>

                  {/* Complete message */}
                  {isComplete && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 p-4 rounded-xl text-center"
                      style={{ background: `${colors.sage}15` }}
                    >
                      <Check
                        className="w-8 h-8 mx-auto mb-2"
                        style={{ color: colors.sage }}
                      />
                      <h3
                        className="text-base font-medium mb-1"
                        style={{ color: colors.sage }}
                      >
                        Ready for Offline!
                      </h3>
                      <p className="text-sm" style={{ color: colors.lightBrown }}>
                        Your trip is now available without internet.
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                /* Download Options */
                <motion.div
                  key="options"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Storage info */}
                  <div
                    className="flex items-center gap-3 p-4 rounded-xl mb-5"
                    style={{ background: colors.warmWhite, border: `1px solid ${colors.border}` }}
                  >
                    <HardDrive className="w-5 h-5" style={{ color: colors.lightBrown }} />
                    <div className="flex-1">
                      <span className="text-sm" style={{ color: colors.mediumBrown }}>
                        Available storage
                      </span>
                    </div>
                    <span
                      className="text-sm font-medium"
                      style={{ color: colors.darkBrown }}
                    >
                      {formatBytes(storageAvailable)}
                    </span>
                  </div>

                  {/* Already downloaded notice */}
                  {isDownloaded && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 p-3 rounded-xl mb-4"
                      style={{ background: `${colors.golden}15` }}
                    >
                      <AlertCircle className="w-4 h-4" style={{ color: colors.golden }} />
                      <span className="text-sm" style={{ color: colors.mediumBrown }}>
                        Trip already downloaded. Download again to update.
                      </span>
                    </motion.div>
                  )}

                  {/* Download options */}
                  <div className="space-y-3 mb-6">
                    <DownloadOption
                      icon={Calendar}
                      title="Today Only"
                      description="Just what you need for today"
                      size={formatBytes(estimatedSizes.today)}
                      isSelected={selectedOption === 'today'}
                      onSelect={() => setSelectedOption('today')}
                    />
                    <DownloadOption
                      icon={Map}
                      title="Full Trip"
                      description="All days, cities, and activities"
                      size={formatBytes(estimatedSizes.fullTrip)}
                      isSelected={selectedOption === 'full'}
                      onSelect={() => setSelectedOption('full')}
                    />
                    <DownloadOption
                      icon={Image}
                      title="Full Trip + Photos"
                      description="Everything including place images"
                      size={formatBytes(estimatedSizes.withPhotos)}
                      isSelected={selectedOption === 'withPhotos'}
                      onSelect={() => setSelectedOption('withPhotos')}
                    />
                  </div>

                  {/* Download button */}
                  <motion.button
                    onClick={handleDownload}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-medium"
                    style={{
                      background: `linear-gradient(135deg, ${colors.sage} 0%, ${colors.sageLight} 100%)`,
                      boxShadow: `0 4px 15px ${colors.sage}30`,
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Download className="w-5 h-5 text-white" />
                    <span className="text-white">Download Now</span>
                  </motion.button>

                  {/* Delete option */}
                  {isDownloaded && onDelete && (
                    <motion.button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="w-full mt-3 flex items-center justify-center gap-2 py-3 rounded-xl"
                      style={{
                        background: colors.warmWhite,
                        border: `1px solid ${colors.border}`,
                      }}
                      whileHover={{ borderColor: colors.terracotta }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Trash2
                        className="w-4 h-4"
                        style={{ color: colors.terracotta }}
                      />
                      <span style={{ color: colors.terracotta }}>
                        {isDeleting ? 'Deleting...' : 'Delete Offline Data'}
                      </span>
                    </motion.button>
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

export default PreTripDownload;

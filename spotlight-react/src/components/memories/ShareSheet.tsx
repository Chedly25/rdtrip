/**
 * Share Sheet - Social Sharing Modal
 *
 * A beautiful bottom sheet for sharing trip memories and recaps
 * to various social platforms and messaging apps.
 *
 * Design: "Share the Journey" - clean icons, platform colors,
 * preview cards, and smooth animations
 *
 * Features:
 * - Platform-specific share buttons (Instagram, Twitter, Facebook, WhatsApp)
 * - Copy link functionality
 * - QR code for easy sharing
 * - Download options for images
 * - Privacy controls
 * - Share preview card
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
  X,
  Copy,
  Check,
  Download,
  Link2,
  QrCode,
  Lock,
  Globe,
  Users,
  Share2,
  Image,
  FileText,
  MapPin,
  ChevronRight,
} from 'lucide-react';

// Wanderlust Editorial Colors
const colors = {
  cream: '#FFFBF5',
  warmWhite: '#FAF7F2',
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

// Social platform configurations
const socialPlatforms = [
  {
    id: 'instagram',
    name: 'Instagram',
    color: '#E4405F',
    gradient: 'linear-gradient(45deg, #405DE6, #5851DB, #833AB4, #C13584, #E1306C, #FD1D1D)',
    icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    color: '#000000',
    gradient: 'linear-gradient(135deg, #1a1a1a, #333)',
    icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    id: 'facebook',
    name: 'Facebook',
    color: '#1877F2',
    gradient: 'linear-gradient(135deg, #1877F2, #0C5DC7)',
    icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    color: '#25D366',
    gradient: 'linear-gradient(135deg, #25D366, #128C7E)',
    icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
  },
];

// Action buttons (copy, download, QR)
const actionButtons = [
  { id: 'copy', icon: Copy, label: 'Copy Link', successIcon: Check },
  { id: 'download', icon: Download, label: 'Download' },
  { id: 'qr', icon: QrCode, label: 'QR Code' },
];

// Privacy options
const privacyOptions = [
  { id: 'public', icon: Globe, label: 'Public', description: 'Anyone with the link can view' },
  { id: 'friends', icon: Users, label: 'Friends Only', description: 'Only your friends can view' },
  { id: 'private', icon: Lock, label: 'Private', description: 'Only you can view' },
];

// Share Preview Card
const SharePreviewCard = ({
  tripName,
  cities,
  coverPhoto,
  stats,
}: {
  tripName: string;
  cities: string[];
  coverPhoto?: string;
  stats: { days: number; photos: number };
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1 }}
    className="mx-4 mb-6 rounded-2xl overflow-hidden"
    style={{
      background: colors.warmWhite,
      border: `1px solid ${colors.border}`,
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    }}
  >
    {/* Cover image */}
    <div className="relative h-32">
      {coverPhoto ? (
        <img src={coverPhoto} alt="" className="w-full h-full object-cover" />
      ) : (
        <div
          className="w-full h-full"
          style={{
            background: `linear-gradient(135deg, ${colors.sage} 0%, ${colors.sageLight} 100%)`,
          }}
        />
      )}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(44,36,23,0.7) 0%, transparent 60%)',
        }}
      />
      <div className="absolute bottom-3 left-4">
        <h3 className="text-white font-serif font-medium">{tripName}</h3>
        <p className="text-white/80 text-sm flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {cities.join(' → ')}
        </p>
      </div>
    </div>

    {/* Stats bar */}
    <div
      className="flex items-center justify-around py-3 px-4"
      style={{ borderTop: `1px solid ${colors.border}` }}
    >
      <div className="text-center">
        <span className="text-lg font-bold" style={{ color: colors.darkBrown }}>
          {stats.days}
        </span>
        <span className="text-xs block" style={{ color: colors.lightBrown }}>days</span>
      </div>
      <div className="text-center">
        <span className="text-lg font-bold" style={{ color: colors.darkBrown }}>
          {cities.length}
        </span>
        <span className="text-xs block" style={{ color: colors.lightBrown }}>cities</span>
      </div>
      <div className="text-center">
        <span className="text-lg font-bold" style={{ color: colors.darkBrown }}>
          {stats.photos}
        </span>
        <span className="text-xs block" style={{ color: colors.lightBrown }}>photos</span>
      </div>
    </div>

    {/* Link preview */}
    <div
      className="flex items-center gap-3 px-4 py-3"
      style={{ background: colors.cream, borderTop: `1px solid ${colors.border}` }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ background: `${colors.terracotta}15` }}
      >
        <Link2 className="w-4 h-4" style={{ color: colors.terracotta }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs truncate" style={{ color: colors.lightBrown }}>
          rdtrip.com/t/abc123
        </p>
      </div>
    </div>
  </motion.div>
);

// Social Platform Button
const SocialButton = ({
  platform,
  index,
  onClick,
}: {
  platform: typeof socialPlatforms[0];
  index: number;
  onClick: () => void;
}) => {
  const Icon = platform.icon;

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 + index * 0.05 }}
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-3"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-white"
        style={{
          background: platform.gradient,
          boxShadow: `0 4px 15px ${platform.color}40`,
        }}
      >
        <Icon />
      </div>
      <span className="text-xs font-medium" style={{ color: colors.darkBrown }}>
        {platform.name}
      </span>
    </motion.button>
  );
};

// Action Button
const ActionButton = ({
  action,
  index,
  onClick,
  isSuccess,
}: {
  action: typeof actionButtons[0];
  index: number;
  onClick: () => void;
  isSuccess?: boolean;
}) => {
  const Icon = isSuccess && action.successIcon ? action.successIcon : action.icon;

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + index * 0.05 }}
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-3"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{
          background: isSuccess ? `${colors.sage}15` : colors.warmWhite,
          border: `1.5px solid ${isSuccess ? colors.sage : colors.border}`,
        }}
      >
        <Icon
          className="w-6 h-6"
          style={{ color: isSuccess ? colors.sage : colors.mediumBrown }}
        />
      </div>
      <span className="text-xs font-medium" style={{ color: colors.darkBrown }}>
        {isSuccess && action.id === 'copy' ? 'Copied!' : action.label}
      </span>
    </motion.button>
  );
};

// Privacy Option
const PrivacyOption = ({
  option,
  isSelected,
  onSelect,
}: {
  option: typeof privacyOptions[0];
  isSelected: boolean;
  onSelect: () => void;
}) => {
  const Icon = option.icon;

  return (
    <motion.button
      onClick={onSelect}
      className="flex items-center gap-3 p-3 rounded-xl w-full text-left"
      style={{
        background: isSelected ? `${colors.sage}10` : 'transparent',
        border: `1.5px solid ${isSelected ? colors.sage : colors.border}`,
      }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{
          background: isSelected ? `${colors.sage}20` : colors.warmWhite,
        }}
      >
        <Icon
          className="w-5 h-5"
          style={{ color: isSelected ? colors.sage : colors.lightBrown }}
        />
      </div>
      <div className="flex-1">
        <h4
          className="text-sm font-medium"
          style={{ color: isSelected ? colors.sage : colors.darkBrown }}
        >
          {option.label}
        </h4>
        <p className="text-xs" style={{ color: colors.lightBrown }}>
          {option.description}
        </p>
      </div>
      {isSelected && (
        <Check className="w-5 h-5" style={{ color: colors.sage }} />
      )}
    </motion.button>
  );
};

// QR Code Modal
const QRCodeModal = ({
  isOpen,
  onClose,
  tripName,
}: {
  isOpen: boolean;
  onClose: () => void;
  tripName: string;
}) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 flex items-center justify-center z-10"
        style={{ background: 'rgba(44,36,23,0.8)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="p-6 rounded-2xl text-center"
          style={{ background: colors.cream }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Placeholder QR code */}
          <div
            className="w-48 h-48 rounded-xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'white', border: `1px solid ${colors.border}` }}
          >
            <QrCode className="w-24 h-24" style={{ color: colors.darkBrown }} />
          </div>
          <h3 className="font-medium mb-1" style={{ color: colors.darkBrown }}>
            Scan to view
          </h3>
          <p className="text-sm mb-4" style={{ color: colors.lightBrown }}>
            {tripName}
          </p>
          <motion.button
            onClick={onClose}
            className="px-6 py-2 rounded-lg text-sm font-medium"
            style={{ background: colors.darkBrown, color: 'white' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Done
          </motion.button>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// Download Options Panel
const DownloadOptions = ({
  isOpen,
  onSelect,
  onClose,
}: {
  isOpen: boolean;
  onSelect: (format: string) => void;
  onClose: () => void;
}) => {
  const options = [
    { id: 'story-card', icon: Image, label: 'Story Card', description: 'Instagram/TikTok ready' },
    { id: 'full-recap', icon: FileText, label: 'Full Recap', description: 'PDF document' },
    { id: 'photos', icon: Download, label: 'All Photos', description: 'ZIP archive' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute left-4 right-4 bottom-32 rounded-2xl p-4 z-10"
          style={{
            background: colors.cream,
            border: `1px solid ${colors.border}`,
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium" style={{ color: colors.darkBrown }}>
              Download options
            </h4>
            <button onClick={onClose}>
              <X className="w-5 h-5" style={{ color: colors.lightBrown }} />
            </button>
          </div>
          <div className="space-y-2">
            {options.map((option) => (
              <motion.button
                key={option.id}
                onClick={() => onSelect(option.id)}
                className="flex items-center gap-3 p-3 rounded-xl w-full text-left"
                style={{
                  background: colors.warmWhite,
                  border: `1px solid ${colors.border}`,
                }}
                whileHover={{ background: `${colors.sage}10`, borderColor: colors.sage }}
              >
                <option.icon className="w-5 h-5" style={{ color: colors.sage }} />
                <div className="flex-1">
                  <span className="text-sm font-medium" style={{ color: colors.darkBrown }}>
                    {option.label}
                  </span>
                  <span className="text-xs block" style={{ color: colors.lightBrown }}>
                    {option.description}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4" style={{ color: colors.lightBrown }} />
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export interface ShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  tripData: {
    name: string;
    cities: string[];
    coverPhoto?: string;
    stats: { days: number; photos: number };
    shareUrl?: string;
  };
  onShare?: (platform: string) => void;
  onDownload?: (format: string) => void;
  onPrivacyChange?: (privacy: string) => void;
}

export const ShareSheet: React.FC<ShareSheetProps> = ({
  isOpen,
  onClose,
  tripData,
  onShare,
  onDownload,
  onPrivacyChange,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [privacy, setPrivacy] = useState('public');
  const [showPrivacy, setShowPrivacy] = useState(false);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(tripData.shareUrl || 'https://rdtrip.com/t/abc123');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }, [tripData.shareUrl]);

  const handleSocialShare = useCallback((platformId: string) => {
    onShare?.(platformId);
  }, [onShare]);

  const handleDownload = useCallback((format: string) => {
    onDownload?.(format);
    setShowDownloadOptions(false);
  }, [onDownload]);

  const handlePrivacyChange = useCallback((privacyId: string) => {
    setPrivacy(privacyId);
    onPrivacyChange?.(privacyId);
    setShowPrivacy(false);
  }, [onPrivacyChange]);

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
            backdropFilter: 'blur(4px)',
          }}
          onClick={onClose}
        />

        {/* Sheet */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="absolute bottom-0 left-0 right-0 max-h-[85vh] rounded-t-3xl overflow-hidden"
          style={{
            background: colors.cream,
            boxShadow: '0 -10px 40px rgba(0,0,0,0.2)',
          }}
        >
          {/* QR Modal */}
          <QRCodeModal
            isOpen={showQR}
            onClose={() => setShowQR(false)}
            tripName={tripData.name}
          />

          {/* Download Options */}
          <DownloadOptions
            isOpen={showDownloadOptions}
            onSelect={handleDownload}
            onClose={() => setShowDownloadOptions(false)}
          />

          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1 rounded-full" style={{ background: colors.border }} />
          </div>

          {/* Header */}
          <div className="px-6 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${colors.terracotta} 0%, ${colors.terracottaLight} 100%)`,
                }}
              >
                <Share2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-serif font-medium" style={{ color: colors.darkBrown }}>
                  Share Your Journey
                </h2>
                <p className="text-sm" style={{ color: colors.lightBrown }}>
                  Let others relive the adventure
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
          <div className="overflow-y-auto max-h-[70vh] pb-8">
            {/* Preview Card */}
            <SharePreviewCard
              tripName={tripData.name}
              cities={tripData.cities}
              coverPhoto={tripData.coverPhoto}
              stats={tripData.stats}
            />

            {/* Social Platforms */}
            <div className="px-4 mb-6">
              <h3 className="text-sm font-medium mb-3 px-2" style={{ color: colors.darkBrown }}>
                Share to
              </h3>
              <div className="flex justify-around">
                {socialPlatforms.map((platform, index) => (
                  <SocialButton
                    key={platform.id}
                    platform={platform}
                    index={index}
                    onClick={() => handleSocialShare(platform.id)}
                  />
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="px-4 mb-6">
              <h3 className="text-sm font-medium mb-3 px-2" style={{ color: colors.darkBrown }}>
                More options
              </h3>
              <div className="flex justify-around">
                <ActionButton
                  action={actionButtons[0]}
                  index={0}
                  onClick={handleCopyLink}
                  isSuccess={copiedLink}
                />
                <ActionButton
                  action={actionButtons[1]}
                  index={1}
                  onClick={() => setShowDownloadOptions(true)}
                />
                <ActionButton
                  action={actionButtons[2]}
                  index={2}
                  onClick={() => setShowQR(true)}
                />
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="px-4">
              <motion.button
                onClick={() => setShowPrivacy(!showPrivacy)}
                className="flex items-center justify-between w-full p-4 rounded-xl mb-3"
                style={{
                  background: colors.warmWhite,
                  border: `1px solid ${colors.border}`,
                }}
                whileHover={{ borderColor: colors.sage }}
              >
                <div className="flex items-center gap-3">
                  {privacy === 'public' && <Globe className="w-5 h-5" style={{ color: colors.sage }} />}
                  {privacy === 'friends' && <Users className="w-5 h-5" style={{ color: colors.golden }} />}
                  {privacy === 'private' && <Lock className="w-5 h-5" style={{ color: colors.terracotta }} />}
                  <div className="text-left">
                    <span className="text-sm font-medium block" style={{ color: colors.darkBrown }}>
                      Privacy
                    </span>
                    <span className="text-xs" style={{ color: colors.lightBrown }}>
                      {privacyOptions.find(p => p.id === privacy)?.label}
                    </span>
                  </div>
                </div>
                <ChevronRight
                  className="w-5 h-5 transition-transform"
                  style={{
                    color: colors.lightBrown,
                    transform: showPrivacy ? 'rotate(90deg)' : 'rotate(0deg)',
                  }}
                />
              </motion.button>

              <AnimatePresence>
                {showPrivacy && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 overflow-hidden"
                  >
                    {privacyOptions.map((option) => (
                      <PrivacyOption
                        key={option.id}
                        option={option}
                        isSelected={privacy === option.id}
                        onSelect={() => handlePrivacyChange(option.id)}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default ShareSheet;

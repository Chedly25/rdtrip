/**
 * Offline Indicator - Connection Status Display
 *
 * A beautiful, non-intrusive indicator showing offline status
 * and pending sync information.
 *
 * Design: "Signal Tower" - clear status, reassuring presence
 *
 * Features:
 * - Animated online/offline transition
 * - Pending actions count
 * - Last sync time
 * - Sync button when online with pending
 * - Expandable details panel
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wifi,
  WifiOff,
  Cloud,
  CloudOff,
  RefreshCw,
  Check,
  Clock,
  ChevronDown,
  Upload,
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
  offline: '#E07B39',
  syncing: '#4A6FA5',
};

// Signal Wave Animation
const SignalWave = ({ isActive }: { isActive: boolean }) => (
  <div className="relative w-5 h-5">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="absolute inset-0 rounded-full border-2"
        style={{
          borderColor: isActive ? colors.sage : colors.offline,
          opacity: isActive ? 1 : 0.3,
        }}
        animate={
          isActive
            ? {
                scale: [1, 1.5 + i * 0.3],
                opacity: [0.8, 0],
              }
            : {}
        }
        transition={{
          duration: 1.5,
          delay: i * 0.3,
          repeat: isActive ? Infinity : 0,
          ease: 'easeOut',
        }}
      />
    ))}
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{ color: isActive ? colors.sage : colors.offline }}
    >
      {isActive ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
    </div>
  </div>
);

// Format time ago
const formatTimeAgo = (dateString: string | null): string => {
  if (!dateString) return 'Never';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

interface OfflineIndicatorProps {
  isOnline: boolean;
  pendingCount: number;
  lastSyncAt: string | null;
  isSyncing: boolean;
  onSync?: () => void;
  variant?: 'compact' | 'full';
  className?: string;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  isOnline,
  pendingCount,
  lastSyncAt,
  isSyncing,
  onSync,
  variant = 'compact',
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Compact variant - just a small status pill
  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${className}`}
        style={{
          background: isOnline ? `${colors.sage}15` : `${colors.offline}15`,
          border: `1px solid ${isOnline ? colors.sage : colors.offline}30`,
        }}
      >
        <SignalWave isActive={isOnline} />
        <span
          className="text-xs font-medium"
          style={{ color: isOnline ? colors.sage : colors.offline }}
        >
          {isOnline ? 'Online' : 'Offline'}
        </span>
        {pendingCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold text-white"
            style={{ background: colors.golden }}
          >
            {pendingCount}
          </motion.span>
        )}
      </motion.div>
    );
  }

  // Full variant - expandable panel
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl overflow-hidden ${className}`}
      style={{
        background: colors.warmWhite,
        border: `1px solid ${colors.border}`,
        boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
      }}
    >
      {/* Header */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4"
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center gap-3">
          {/* Status icon */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: isOnline
                ? isSyncing
                  ? `${colors.syncing}15`
                  : `${colors.sage}15`
                : `${colors.offline}15`,
            }}
          >
            {isSyncing ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              >
                <RefreshCw className="w-5 h-5" style={{ color: colors.syncing }} />
              </motion.div>
            ) : isOnline ? (
              <Cloud className="w-5 h-5" style={{ color: colors.sage }} />
            ) : (
              <CloudOff className="w-5 h-5" style={{ color: colors.offline }} />
            )}
          </div>

          {/* Status text */}
          <div className="text-left">
            <h4 className="text-sm font-medium" style={{ color: colors.darkBrown }}>
              {isSyncing ? 'Syncing...' : isOnline ? 'Connected' : 'Offline Mode'}
            </h4>
            <p className="text-xs" style={{ color: colors.lightBrown }}>
              {isSyncing
                ? 'Uploading your changes'
                : isOnline
                  ? pendingCount > 0
                    ? `${pendingCount} pending`
                    : 'All synced'
                  : 'Changes saved locally'}
            </p>
          </div>
        </div>

        {/* Expand chevron */}
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5" style={{ color: colors.lightBrown }} />
        </motion.div>
      </motion.button>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className="px-4 pb-4 pt-2 border-t"
              style={{ borderColor: colors.border }}
            >
              {/* Status details */}
              <div className="space-y-3">
                {/* Connection status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wifi
                      className="w-4 h-4"
                      style={{ color: isOnline ? colors.sage : colors.lightBrown }}
                    />
                    <span className="text-sm" style={{ color: colors.mediumBrown }}>
                      Connection
                    </span>
                  </div>
                  <span
                    className="text-sm font-medium"
                    style={{ color: isOnline ? colors.sage : colors.offline }}
                  >
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>

                {/* Last sync */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" style={{ color: colors.lightBrown }} />
                    <span className="text-sm" style={{ color: colors.mediumBrown }}>
                      Last sync
                    </span>
                  </div>
                  <span className="text-sm" style={{ color: colors.lightBrown }}>
                    {formatTimeAgo(lastSyncAt)}
                  </span>
                </div>

                {/* Pending actions */}
                {pendingCount > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Upload className="w-4 h-4" style={{ color: colors.golden }} />
                      <span className="text-sm" style={{ color: colors.mediumBrown }}>
                        Pending uploads
                      </span>
                    </div>
                    <span
                      className="text-sm font-medium"
                      style={{ color: colors.golden }}
                    >
                      {pendingCount}
                    </span>
                  </div>
                )}
              </div>

              {/* Sync button */}
              {isOnline && pendingCount > 0 && onSync && (
                <motion.button
                  onClick={onSync}
                  disabled={isSyncing}
                  className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl font-medium"
                  style={{
                    background: isSyncing
                      ? colors.border
                      : `linear-gradient(135deg, ${colors.sage} 0%, ${colors.sageLight} 100%)`,
                    color: 'white',
                  }}
                  whileHover={!isSyncing ? { scale: 1.02 } : {}}
                  whileTap={!isSyncing ? { scale: 0.98 } : {}}
                >
                  {isSyncing ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </motion.div>
                      Syncing...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Sync Now
                    </>
                  )}
                </motion.button>
              )}

              {/* Offline message */}
              {!isOnline && (
                <div
                  className="mt-4 p-3 rounded-xl text-center"
                  style={{ background: `${colors.offline}10` }}
                >
                  <p className="text-sm" style={{ color: colors.offline }}>
                    Your changes are saved locally and will sync when you're back online.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Floating offline banner (appears at top when offline)
export const OfflineBanner: React.FC<{
  isOnline: boolean;
  pendingCount: number;
}> = ({ isOnline, pendingCount }) => {
  if (isOnline) return null;

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      className="fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-center gap-3"
      style={{
        background: `linear-gradient(135deg, ${colors.offline} 0%, ${colors.terracotta} 100%)`,
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      }}
    >
      <WifiOff className="w-4 h-4 text-white" />
      <span className="text-white text-sm font-medium">
        You're offline
        {pendingCount > 0 && ` · ${pendingCount} changes pending`}
      </span>
    </motion.div>
  );
};

export default OfflineIndicator;

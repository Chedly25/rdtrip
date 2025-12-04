/**
 * Quick Call Button - One-Tap Restaurant/Hotel Calls
 *
 * Features:
 * - One-tap call for restaurants/hotels with reservations
 * - Shows phone number and business name
 * - Platform-aware (uses tel: protocol)
 * - Visual feedback with call history tracking
 * - "Confirm your reservation" reminder
 *
 * Design: Wanderlust Editorial with warm, inviting feel
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  PhoneCall,
  Clock,
  Check,
  X,
  MessageCircle,
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

export interface CallInfo {
  businessName: string;
  phone: string;
  type: 'restaurant' | 'hotel' | 'activity' | 'other';
  hasReservation?: boolean;
  reservationTime?: string;
  reservationNote?: string;
}

interface QuickCallButtonProps {
  callInfo: CallInfo;
  variant?: 'compact' | 'full' | 'floating';
  onCallInitiated?: (callInfo: CallInfo) => void;
  onCallEnded?: (callInfo: CallInfo, duration?: number) => void;
  className?: string;
}

// Format phone for display
const formatPhoneDisplay = (phone: string): string => {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');

  // Format based on length
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else if (digits.length === 11 && digits[0] === '1') {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  // International or other formats - just return as-is with basic formatting
  return phone;
};

// Get business type icon color
const getTypeColor = (type: CallInfo['type']): string => {
  switch (type) {
    case 'restaurant':
      return colors.terracotta;
    case 'hotel':
      return colors.sage;
    case 'activity':
      return colors.golden;
    default:
      return colors.mediumBrown;
  }
};

export const QuickCallButton: React.FC<QuickCallButtonProps> = ({
  callInfo,
  variant = 'compact',
  onCallInitiated,
  onCallEnded,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);

  const typeColor = getTypeColor(callInfo.type);

  // Initiate phone call
  const handleCall = () => {
    // Clean phone number for tel: protocol
    const cleanPhone = callInfo.phone.replace(/\D/g, '');

    // Record call initiation
    setIsCallActive(true);
    setCallStartTime(new Date());
    onCallInitiated?.(callInfo);

    // Open phone dialer
    window.location.href = `tel:${cleanPhone}`;

    // Simulate call end after returning to app (simplified)
    // In production, you'd use visibilitychange event
    setTimeout(() => {
      if (callStartTime) {
        const duration = Math.floor((Date.now() - callStartTime.getTime()) / 1000);
        onCallEnded?.(callInfo, duration);
      }
      setIsCallActive(false);
      setCallStartTime(null);
    }, 1000);
  };

  // Compact variant - just an icon button
  if (variant === 'compact') {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleCall}
        className={`w-12 h-12 rounded-xl flex items-center justify-center ${className}`}
        style={{
          background: colors.warmWhite,
          border: `1px solid ${colors.border}`,
        }}
        title={`Call ${callInfo.businessName}`}
      >
        <Phone className="w-5 h-5" style={{ color: typeColor }} />
      </motion.button>
    );
  }

  // Floating variant - small FAB-style button
  if (variant === 'floating') {
    return (
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleCall}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg ${className}`}
        style={{
          background: `linear-gradient(135deg, ${typeColor} 0%, ${colors.terracottaLight} 100%)`,
          boxShadow: `0 4px 20px ${typeColor}40`,
        }}
        title={`Call ${callInfo.businessName}`}
      >
        <AnimatePresence mode="wait">
          {isCallActive ? (
            <motion.div
              key="calling"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <PhoneCall className="w-6 h-6 text-white animate-pulse" />
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Phone className="w-6 h-6 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    );
  }

  // Full variant - expandable card with details
  return (
    <motion.div
      className={`rounded-2xl overflow-hidden ${className}`}
      style={{
        background: colors.warmWhite,
        border: `1px solid ${colors.border}`,
      }}
      layout
    >
      {/* Header - always visible */}
      <motion.button
        className="w-full p-4 flex items-center gap-3"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: `${typeColor}15`,
          }}
        >
          <Phone className="w-5 h-5" style={{ color: typeColor }} />
        </div>

        {/* Info */}
        <div className="flex-1 text-left">
          <h4
            className="text-base font-medium truncate"
            style={{ color: colors.darkBrown }}
          >
            {callInfo.businessName}
          </h4>
          <p className="text-sm" style={{ color: colors.lightBrown }}>
            {formatPhoneDisplay(callInfo.phone)}
          </p>
        </div>

        {/* Expand/Call button */}
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight className="w-5 h-5" style={{ color: colors.lightBrown }} />
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
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0">
              {/* Reservation reminder */}
              {callInfo.hasReservation && (
                <div
                  className="p-3 rounded-xl mb-3 flex items-start gap-3"
                  style={{
                    background: `${colors.golden}15`,
                    border: `1px solid ${colors.golden}30`,
                  }}
                >
                  <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.golden }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: colors.darkBrown }}>
                      Reservation{callInfo.reservationTime ? ` at ${callInfo.reservationTime}` : ''}
                    </p>
                    {callInfo.reservationNote && (
                      <p className="text-xs mt-0.5" style={{ color: colors.lightBrown }}>
                        {callInfo.reservationNote}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Quick actions */}
              <div className="flex gap-2">
                {/* Main call button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCall}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl"
                  style={{
                    background: `linear-gradient(135deg, ${typeColor} 0%, ${colors.terracottaLight} 100%)`,
                  }}
                >
                  <Phone className="w-4 h-4 text-white" />
                  <span className="text-sm font-medium text-white">Call Now</span>
                </motion.button>

                {/* Copy number */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    navigator.clipboard.writeText(callInfo.phone);
                  }}
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: colors.cream,
                    border: `1px solid ${colors.border}`,
                  }}
                  title="Copy phone number"
                >
                  <MessageCircle className="w-4 h-4" style={{ color: colors.mediumBrown }} />
                </motion.button>
              </div>

              {/* Quick tips */}
              <div className="mt-3 flex items-center gap-2">
                <Check className="w-3 h-3" style={{ color: colors.sage }} />
                <span className="text-xs" style={{ color: colors.lightBrown }}>
                  Confirm your reservation when calling
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Call History Entry (for tracking)
export interface CallHistoryEntry {
  id: string;
  callInfo: CallInfo;
  timestamp: Date;
  duration?: number;
  status: 'completed' | 'missed' | 'cancelled';
}

// Call History Component
interface CallHistoryProps {
  entries: CallHistoryEntry[];
  onCallAgain: (entry: CallHistoryEntry) => void;
}

export const CallHistory: React.FC<CallHistoryProps> = ({
  entries,
  onCallAgain,
}) => {
  if (entries.length === 0) {
    return (
      <div
        className="p-4 rounded-2xl text-center"
        style={{
          background: colors.warmWhite,
          border: `1px solid ${colors.border}`,
        }}
      >
        <Phone className="w-8 h-8 mx-auto mb-2" style={{ color: colors.lightBrown }} />
        <p className="text-sm" style={{ color: colors.lightBrown }}>
          No recent calls
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <motion.div
          key={entry.id}
          className="p-3 rounded-xl flex items-center gap-3"
          style={{
            background: colors.warmWhite,
            border: `1px solid ${colors.border}`,
          }}
          whileHover={{ scale: 1.01 }}
        >
          {/* Status icon */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              background:
                entry.status === 'completed'
                  ? `${colors.sage}20`
                  : entry.status === 'missed'
                    ? `${colors.terracotta}20`
                    : `${colors.lightBrown}20`,
            }}
          >
            {entry.status === 'completed' ? (
              <PhoneCall className="w-4 h-4" style={{ color: colors.sage }} />
            ) : entry.status === 'missed' ? (
              <X className="w-4 h-4" style={{ color: colors.terracotta }} />
            ) : (
              <Phone className="w-4 h-4" style={{ color: colors.lightBrown }} />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-medium truncate"
              style={{ color: colors.darkBrown }}
            >
              {entry.callInfo.businessName}
            </p>
            <p className="text-xs" style={{ color: colors.lightBrown }}>
              {entry.timestamp.toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit',
              })}
              {entry.duration && ` • ${Math.floor(entry.duration / 60)}:${(entry.duration % 60).toString().padStart(2, '0')}`}
            </p>
          </div>

          {/* Call again button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onCallAgain(entry)}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              background: `${colors.sage}20`,
            }}
          >
            <Phone className="w-4 h-4" style={{ color: colors.sage }} />
          </motion.button>
        </motion.div>
      ))}
    </div>
  );
};

export default QuickCallButton;

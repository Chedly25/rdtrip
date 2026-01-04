/**
 * OfflineIndicator
 *
 * Elegant banner showing offline status with pending sync count.
 * Designed to be noticeable but not alarming - a gentle reminder.
 *
 * Design: Warm Editorial with muted amber tones for offline state.
 * Uses subtle pulse animation and smooth transitions.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  WifiOff,
  CloudOff,
  RefreshCw,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export type ConnectionStatus = 'online' | 'offline' | 'syncing' | 'error';

interface PendingAction {
  id: string;
  type: 'add' | 'remove' | 'move' | 'update';
  itemName: string;
  timestamp: Date;
}

interface OfflineIndicatorProps {
  pendingActions?: PendingAction[];
  onRetrySync?: () => Promise<void>;
  className?: string;
}

// ============================================================================
// Custom Hook for Online Status
// ============================================================================

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [status, setStatus] = useState<ConnectionStatus>('online');

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setStatus('syncing');
      // Simulate sync completion
      setTimeout(() => setStatus('online'), 2000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, status, setStatus };
}

// ============================================================================
// Main Component
// ============================================================================

export function OfflineIndicator({
  pendingActions = [],
  onRetrySync,
  className = '',
}: OfflineIndicatorProps) {
  const { isOnline, status, setStatus } = useOnlineStatus();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Handle retry sync
  const handleRetrySync = useCallback(async () => {
    if (!onRetrySync || isSyncing) return;

    setIsSyncing(true);
    setStatus('syncing');

    try {
      await onRetrySync();
      setStatus('online');
    } catch {
      setStatus('error');
    } finally {
      setIsSyncing(false);
    }
  }, [onRetrySync, isSyncing, setStatus]);

  // Don't show if online with no pending actions
  if (isOnline && status === 'online' && pendingActions.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`relative ${className}`}
      >
        {/* Main Banner */}
        <motion.div
          layout
          className={`
            relative overflow-hidden rounded-xl border-2 transition-colors
            ${status === 'offline'
              ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200/60'
              : status === 'syncing'
                ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200/60'
                : status === 'error'
                  ? 'bg-gradient-to-r from-rose-50 to-red-50 border-rose-200/60'
                  : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200/60'
            }
          `}
        >
          {/* Subtle animated pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Ccircle cx='3' cy='3' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          <div className="relative px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Status indicator */}
              <div className="flex items-center gap-3">
                <StatusIcon status={status} />

                <div>
                  <p className={`text-body-2 font-medium ${getStatusTextColor(status)}`}>
                    {getStatusTitle(status)}
                  </p>
                  <p className="text-body-3 text-rui-grey-50">
                    {getStatusMessage(status, pendingActions.length)}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {/* Pending count badge */}
                {pendingActions.length > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`
                      flex items-center gap-1.5 px-2.5 py-1 rounded-lg
                      text-body-3 font-medium transition-colors
                      ${status === 'offline'
                        ? 'bg-amber-100/80 text-amber-700 hover:bg-amber-200/80'
                        : 'bg-blue-100/80 text-blue-700 hover:bg-blue-200/80'
                      }
                    `}
                  >
                    <span>{pendingActions.length}</span>
                    <span className="hidden sm:inline">pending</span>
                  </motion.button>
                )}

                {/* Retry button */}
                {(status === 'offline' || status === 'error') && onRetrySync && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleRetrySync}
                    disabled={isSyncing}
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                      text-body-3 font-medium transition-all
                      ${status === 'error'
                        ? 'bg-rose-500 text-white hover:bg-rose-600'
                        : 'bg-amber-500 text-white hover:bg-amber-600'
                      }
                    `}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Syncing...' : 'Retry'}
                  </motion.button>
                )}
              </div>
            </div>

            {/* Expanded pending actions list */}
            <AnimatePresence>
              {isExpanded && pendingActions.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 pt-3 border-t border-amber-200/50 space-y-2">
                    {pendingActions.slice(0, 5).map((action) => (
                      <PendingActionItem key={action.id} action={action} />
                    ))}
                    {pendingActions.length > 5 && (
                      <p className="text-body-3 text-rui-grey-50 pt-1">
                        +{pendingActions.length - 5} more changes
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Syncing progress bar */}
          {status === 'syncing' && (
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 2, ease: 'easeInOut' }}
              className="absolute bottom-0 left-0 right-0 h-1 bg-blue-400 origin-left"
            />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

interface StatusIconProps {
  status: ConnectionStatus;
}

function StatusIcon({ status }: StatusIconProps) {
  const baseClasses = 'w-9 h-9 rounded-xl flex items-center justify-center';

  switch (status) {
    case 'offline':
      return (
        <div className={`${baseClasses} bg-amber-100`}>
          <motion.div
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <WifiOff className="w-4.5 h-4.5 text-amber-600" />
          </motion.div>
        </div>
      );
    case 'syncing':
      return (
        <div className={`${baseClasses} bg-blue-100`}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className="w-4.5 h-4.5 text-blue-600" />
          </motion.div>
        </div>
      );
    case 'error':
      return (
        <div className={`${baseClasses} bg-rose-100`}>
          <AlertCircle className="w-4.5 h-4.5 text-rose-600" />
        </div>
      );
    case 'online':
    default:
      return (
        <div className={`${baseClasses} bg-emerald-100`}>
          <Check className="w-4.5 h-4.5 text-emerald-600" />
        </div>
      );
  }
}

interface PendingActionItemProps {
  action: PendingAction;
}

function PendingActionItem({ action }: PendingActionItemProps) {
  const actionLabels = {
    add: 'Added',
    remove: 'Removed',
    move: 'Moved',
    update: 'Updated',
  };

  const timeAgo = getTimeAgo(action.timestamp);

  return (
    <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-white/50">
      <div className="flex items-center gap-2">
        <span className="text-body-3 text-amber-600 font-medium">
          {actionLabels[action.type]}
        </span>
        <span className="text-body-3 text-rui-grey-70 truncate max-w-[150px]">
          {action.itemName}
        </span>
      </div>
      <span className="text-body-3 text-rui-grey-40">{timeAgo}</span>
    </div>
  );
}

// ============================================================================
// SyncStatus Component (Compact version)
// ============================================================================

interface SyncStatusProps {
  pendingCount: number;
  isSyncing: boolean;
  lastSyncTime?: Date;
  className?: string;
}

export function SyncStatus({
  pendingCount,
  isSyncing,
  lastSyncTime,
  className = '',
}: SyncStatusProps) {
  if (pendingCount === 0 && !isSyncing) {
    return (
      <div className={`flex items-center gap-1.5 text-body-3 text-rui-grey-50 ${className}`}>
        <Check className="w-3.5 h-3.5 text-emerald-500" />
        <span>Saved</span>
        {lastSyncTime && (
          <span className="text-rui-grey-40">· {getTimeAgo(lastSyncTime)}</span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1.5 text-body-3 ${className}`}>
      {isSyncing ? (
        <>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-500" />
          </motion.div>
          <span className="text-blue-600">Syncing...</span>
        </>
      ) : (
        <>
          <CloudOff className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-amber-600">{pendingCount} pending</span>
        </>
      )}
    </div>
  );
}

// ============================================================================
// PendingBadge Component (For individual items)
// ============================================================================

interface PendingBadgeProps {
  className?: string;
}

export function PendingBadge({ className = '' }: PendingBadgeProps) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={`
        inline-flex items-center justify-center
        w-5 h-5 rounded-full
        bg-amber-100 border border-amber-300
        ${className}
      `}
      title="Pending sync"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      >
        <RefreshCw className="w-2.5 h-2.5 text-amber-600" />
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function getStatusTitle(status: ConnectionStatus): string {
  switch (status) {
    case 'offline':
      return "You're offline";
    case 'syncing':
      return 'Syncing changes...';
    case 'error':
      return 'Sync failed';
    case 'online':
    default:
      return 'All synced';
  }
}

function getStatusMessage(status: ConnectionStatus, pendingCount: number): string {
  switch (status) {
    case 'offline':
      return pendingCount > 0
        ? `${pendingCount} change${pendingCount === 1 ? '' : 's'} will sync when you're back online`
        : 'Changes will sync when you reconnect';
    case 'syncing':
      return `Syncing ${pendingCount} change${pendingCount === 1 ? '' : 's'}...`;
    case 'error':
      return 'Some changes could not be saved. Try again.';
    case 'online':
    default:
      return 'All changes saved';
  }
}

function getStatusTextColor(status: ConnectionStatus): string {
  switch (status) {
    case 'offline':
      return 'text-amber-700';
    case 'syncing':
      return 'text-blue-700';
    case 'error':
      return 'text-rose-700';
    case 'online':
    default:
      return 'text-emerald-700';
  }
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// ============================================================================
// Export
// ============================================================================

export default OfflineIndicator;

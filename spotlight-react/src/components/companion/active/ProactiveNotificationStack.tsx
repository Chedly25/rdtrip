/**
 * ProactiveNotificationStack Component
 *
 * WI-7.8: Container for managing proactive notification display
 *
 * Features:
 * - Shows notifications at top of screen
 * - Stacks multiple notifications (max 3 visible)
 * - Handles entry/exit animations
 * - Manages auto-dismiss timing
 * - Priority-based ordering (high first)
 */

import { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';

import { ProactiveNotificationCard } from './ProactiveNotificationCard';
import type { ProactiveMessage } from '../../../services/tripBrain/companion/types';

// ============================================================================
// Types
// ============================================================================

export interface ProactiveNotificationStackProps {
  /** Proactive messages to display */
  messages: ProactiveMessage[];
  /** Called when a message is dismissed */
  onDismiss: (id: string) => void;
  /** Called when action is taken on a message */
  onAction: (id: string) => void;
  /** Maximum messages to show at once */
  maxVisible?: number;
  /** Auto-dismiss timeout in ms */
  autoDismissMs?: number;
  /** Whether night mode is active */
  isNightMode?: boolean;
  /** Whether the stack is visible */
  visible?: boolean;
}

// ============================================================================
// Priority Order
// ============================================================================

const PRIORITY_ORDER: Record<ProactiveMessage['priority'], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

// ============================================================================
// Component
// ============================================================================

export function ProactiveNotificationStack({
  messages,
  onDismiss,
  onAction,
  maxVisible = 3,
  autoDismissMs = 8000,
  isNightMode = false,
  visible = true,
}: ProactiveNotificationStackProps) {
  // Track which messages have been seen (for animation purposes)
  const [seenIds] = useState<Set<string>>(new Set());

  // Sort by priority and recency, filter dismissed, limit visible
  const visibleMessages = useMemo(() => {
    return messages
      .filter((m) => !m.isDismissed)
      .sort((a, b) => {
        // Priority first
        const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        // Then by creation time (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, maxVisible);
  }, [messages, maxVisible]);

  // Mark messages as seen
  visibleMessages.forEach((m) => seenIds.add(m.id));

  if (!visible || visibleMessages.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pt-safe pointer-events-none">
      <div className="px-4 pt-4 space-y-3 pointer-events-auto">
        <AnimatePresence mode="popLayout">
          {visibleMessages.map((message, index) => (
            <ProactiveNotificationCard
              key={message.id}
              message={message}
              onDismiss={onDismiss}
              onAction={onAction}
              autoDismissMs={autoDismissMs}
              isNightMode={isNightMode}
              index={index}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Overflow indicator if more messages */}
      {messages.filter((m) => !m.isDismissed).length > maxVisible && (
        <div className="px-4 mt-2 pointer-events-auto">
          <div
            className="text-center text-xs py-1.5 rounded-full"
            style={{
              background: isNightMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
              color: isNightMode ? '#A1A1AA' : '#71717A',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            +{messages.filter((m) => !m.isDismissed).length - maxVisible} more
          </div>
        </div>
      )}
    </div>
  );
}

export default ProactiveNotificationStack;

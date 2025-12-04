/**
 * Comment Badge - "The Stamp Counter"
 *
 * A vintage passport stamp style badge for comment counts.
 * Features stamp borders, count displays, and unresolved indicators.
 *
 * Design: Wanderlust Editorial with vintage stamp aesthetics
 */

import { MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

// =============================================================================
// WANDERLUST EDITORIAL COLOR PALETTE
// =============================================================================
const colors = {
  cream: '#FFFBF5',
  warmWhite: '#FAF7F2',
  terracotta: '#C45830',
  terracottaLight: '#D96A42',
  golden: '#D4A853',
  goldenDark: '#B8923D',
  sage: '#6B8E7B',
  espresso: '#2C1810',
  mediumBrown: '#5C4033',
  lightBrown: '#8B7355',
  parchment: '#F5E6C8',
  stampRed: '#8B2323',
};

interface CommentBadgeProps {
  count: number;
  hasUnresolved?: boolean;
  onClick: () => void;
}

export function CommentBadge({ count, hasUnresolved = false, onClick }: CommentBadgeProps) {
  if (count === 0) {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        title="Add correspondence"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 10px',
          background: 'transparent',
          border: `1px dashed ${colors.golden}`,
          borderRadius: '12px',
          fontFamily: '"Courier New", monospace',
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.5px',
          color: colors.lightBrown,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        <MessageCircle style={{ width: 12, height: 12 }} />
        NOTE
      </motion.button>
    );
  }

  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      title={`${count} note${count !== 1 ? 's' : ''}${hasUnresolved ? ' (unresolved)' : ''}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        padding: '4px 10px',
        background: hasUnresolved ? `${colors.terracotta}15` : `${colors.sage}15`,
        border: `2px solid ${hasUnresolved ? colors.terracotta : colors.sage}`,
        borderRadius: '14px',
        fontFamily: '"Courier New", monospace',
        fontSize: '11px',
        fontWeight: 700,
        color: hasUnresolved ? colors.terracotta : colors.sage,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative',
      }}
    >
      <MessageCircle style={{ width: 13, height: 13 }} />
      <span>{count}</span>

      {/* Unresolved indicator dot */}
      {hasUnresolved && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          style={{
            position: 'absolute',
            top: '-3px',
            right: '-3px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: colors.stampRed,
            border: `1.5px solid ${colors.cream}`,
            boxShadow: `0 1px 3px ${colors.stampRed}40`,
          }}
        />
      )}
    </motion.button>
  );
}

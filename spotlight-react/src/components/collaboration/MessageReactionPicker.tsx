/**
 * Message Reaction Picker - "The Travel Stamps"
 *
 * A vintage travel stamp style reaction picker for message reactions.
 * Features stamp-style emoji displays and editorial styling.
 *
 * Design: Wanderlust Editorial with vintage stamp aesthetics
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile } from 'lucide-react';

// =============================================================================
// WANDERLUST EDITORIAL COLOR PALETTE
// =============================================================================
const colors = {
  cream: '#FFFBF5',
  warmWhite: '#FAF7F2',
  terracotta: '#C45830',
  terracottaLight: '#D96A42',
  golden: '#D4A853',
  goldenLight: '#E4BE73',
  goldenDark: '#B8923D',
  sage: '#6B8E7B',
  espresso: '#2C1810',
  mediumBrown: '#5C4033',
  lightBrown: '#8B7355',
  parchment: '#F5E6C8',
};

interface MessageReactionPickerProps {
  messageId: string;
  routeId: string;
  onReactionAdd: (messageId: string, emoji: string) => void;
  existingReactions?: Reaction[];
  currentUserId: string;
}

interface Reaction {
  emoji: string;
  userId: string;
  createdAt: string;
}

const COMMON_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🎉', '🔥', '✨', '👏', '💯', '🚀'];

export function MessageReactionPicker({
  messageId,
  routeId,
  onReactionAdd,
  existingReactions = [],
  currentUserId,
}: MessageReactionPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleEmojiClick = async (emoji: string) => {
    try {
      const userHasReacted = existingReactions.some(
        (r) => r.emoji === emoji && r.userId === currentUserId
      );

      if (userHasReacted) {
        await removeReaction(emoji);
      } else {
        onReactionAdd(messageId, emoji);
      }

      setIsOpen(false);
    } catch (error) {
      console.error('Failed to toggle reaction:', error);
    }
  };

  const removeReaction = async (emoji: string) => {
    try {
      const token = localStorage.getItem('rdtrip_auth_token');

      const response = await fetch(`/api/routes/${routeId}/messages/${messageId}/reactions`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ emoji }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove reaction');
      }
    } catch (error) {
      console.error('Remove reaction error:', error);
    }
  };

  const reactionCounts = existingReactions.reduce(
    (acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = {
          count: 0,
          userIds: [],
        };
      }
      acc[reaction.emoji].count++;
      acc[reaction.emoji].userIds.push(reaction.userId);
      return acc;
    },
    {} as Record<string, { count: number; userIds: string[] }>
  );

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={pickerRef}>
      {/* Existing reactions display */}
      {Object.keys(reactionCounts).length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
          {Object.entries(reactionCounts).map(([emoji, data]) => {
            const userReacted = data.userIds.includes(currentUserId);

            return (
              <motion.button
                key={emoji}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                onClick={() => handleEmojiClick(emoji)}
                title={userReacted ? 'Remove your reaction' : 'Add this reaction'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 8px',
                  borderRadius: '10px',
                  background: userReacted ? `${colors.terracotta}15` : `${colors.parchment}80`,
                  border: `1.5px solid ${userReacted ? colors.terracotta : colors.golden}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ fontSize: '14px', lineHeight: 1 }}>{emoji}</span>
                <span
                  style={{
                    fontFamily: '"Courier New", monospace',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: userReacted ? colors.terracotta : colors.mediumBrown,
                  }}
                >
                  {data.count}
                </span>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Add reaction button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        title="Add reaction"
        style={{
          padding: '4px',
          borderRadius: '50%',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: colors.lightBrown,
          transition: 'all 0.15s ease',
        }}
      >
        <Smile style={{ width: 16, height: 16 }} />
      </motion.button>

      {/* Emoji picker popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              bottom: '100%',
              left: 0,
              marginBottom: '8px',
              background: `linear-gradient(180deg, ${colors.cream} 0%, ${colors.warmWhite} 100%)`,
              borderRadius: '12px',
              border: `2px solid ${colors.golden}`,
              boxShadow: `0 8px 24px rgba(44, 24, 16, 0.2)`,
              padding: '10px',
              zIndex: 50,
            }}
          >
            {/* Header */}
            <p
              style={{
                fontFamily: '"Courier New", monospace',
                fontSize: '9px',
                fontWeight: 700,
                letterSpacing: '1px',
                color: colors.mediumBrown,
                textTransform: 'uppercase',
                margin: '0 0 8px 0',
                textAlign: 'center',
              }}
            >
              Travel Stamps
            </p>

            {/* Emoji grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: '4px',
              }}
            >
              {COMMON_EMOJIS.map((emoji) => {
                const userHasThis = existingReactions.some(
                  (r) => r.emoji === emoji && r.userId === currentUserId
                );

                return (
                  <motion.button
                    key={emoji}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleEmojiClick(emoji)}
                    title={emoji}
                    style={{
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      borderRadius: '8px',
                      background: userHasThis ? `${colors.terracotta}15` : 'transparent',
                      border: userHasThis ? `2px solid ${colors.terracotta}` : '2px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {emoji}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

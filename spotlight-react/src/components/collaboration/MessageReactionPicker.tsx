import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile } from 'lucide-react';

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

const COMMON_EMOJIS = [
  '👍', '❤️', '😂', '😮', '😢', '🙏',
  '🎉', '🔥', '✨', '👏', '💯', '🚀'
];

export function MessageReactionPicker({
  messageId,
  routeId,
  onReactionAdd,
  existingReactions = [],
  currentUserId
}: MessageReactionPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker when clicking outside
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
      // Check if user already reacted with this emoji
      const userHasReacted = existingReactions.some(
        r => r.emoji === emoji && r.userId === currentUserId
      );

      if (userHasReacted) {
        // Remove reaction
        await removeReaction(emoji);
      } else {
        // Add reaction
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
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ emoji })
      });

      if (!response.ok) {
        throw new Error('Failed to remove reaction');
      }
    } catch (error) {
      console.error('Remove reaction error:', error);
    }
  };

  // Group reactions by emoji with counts
  const reactionCounts = existingReactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = {
        count: 0,
        userIds: []
      };
    }
    acc[reaction.emoji].count++;
    acc[reaction.emoji].userIds.push(reaction.userId);
    return acc;
  }, {} as Record<string, { count: number; userIds: string[] }>);

  return (
    <div className="relative inline-block" ref={pickerRef}>
      {/* Existing reactions display */}
      {Object.keys(reactionCounts).length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1">
          {Object.entries(reactionCounts).map(([emoji, data]) => {
            const userReacted = data.userIds.includes(currentUserId);

            return (
              <motion.button
                key={emoji}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                onClick={() => handleEmojiClick(emoji)}
                className={`
                  flex items-center gap-1 px-2 py-1 rounded-full text-sm
                  transition-colors
                  ${userReacted
                    ? 'bg-blue-100 border-2 border-blue-500 text-blue-700'
                    : 'bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200'}
                `}
                title={userReacted ? 'Click to remove your reaction' : 'Click to add this reaction'}
              >
                <span className="text-base">{emoji}</span>
                <span className="text-xs font-medium">{data.count}</span>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Add reaction button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
        title="Add reaction"
      >
        <Smile className="w-4 h-4" />
      </button>

      {/* Emoji picker popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 p-2 z-50"
          >
            <div className="grid grid-cols-6 gap-1">
              {COMMON_EMOJIS.map((emoji) => {
                const userHasThis = existingReactions.some(
                  r => r.emoji === emoji && r.userId === currentUserId
                );

                return (
                  <motion.button
                    key={emoji}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleEmojiClick(emoji)}
                    className={`
                      w-10 h-10 flex items-center justify-center text-2xl rounded-lg
                      transition-colors
                      ${userHasThis
                        ? 'bg-blue-100 ring-2 ring-blue-500'
                        : 'hover:bg-gray-100'}
                    `}
                    title={emoji}
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

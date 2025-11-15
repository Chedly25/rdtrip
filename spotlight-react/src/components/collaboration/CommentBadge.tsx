import { MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface CommentBadgeProps {
  count: number;
  hasUnresolved?: boolean;
  onClick: () => void;
}

export function CommentBadge({ count, hasUnresolved = false, onClick }: CommentBadgeProps) {
  if (count === 0) {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
        title="Add comment"
      >
        <MessageCircle className="w-3.5 h-3.5" />
        <span>Comment</span>
      </button>
    );
  }

  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`flex items-center gap-1 px-2 py-1 text-xs rounded-full transition-colors ${
        hasUnresolved
          ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
      }`}
      title={`${count} comment${count !== 1 ? 's' : ''}${hasUnresolved ? ' (unresolved)' : ''}`}
    >
      <MessageCircle className="w-3.5 h-3.5" />
      <span className="font-medium">{count}</span>
      {hasUnresolved && (
        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
      )}
    </motion.button>
  );
}

/**
 * EmptyState - Beautiful Empty State Component
 * Phase 6.4: Helpful illustrations and CTAs when no data exists
 */

import { motion } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';
import { Button } from '../design-system';

interface EmptyStateProps {
  icon?: LucideIcon;
  emoji?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState = ({
  icon: Icon,
  emoji,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`flex flex-col items-center justify-center text-center px-8 py-12 ${className}`}
    >
      {/* Icon/Emoji */}
      {emoji && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 20 }}
          className="text-7xl mb-6"
        >
          {emoji}
        </motion.div>
      )}

      {Icon && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 20 }}
          className="mb-6"
        >
          <Icon className="h-16 w-16 text-gray-300" strokeWidth={1.5} />
        </motion.div>
      )}

      {/* Title */}
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-xl font-bold text-gray-900 mb-2"
      >
        {title}
      </motion.h3>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-sm text-gray-500 max-w-sm mb-6"
      >
        {description}
      </motion.p>

      {/* Action Button */}
      {actionLabel && onAction && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            variant="primary"
            size="md"
            onClick={onAction}
          >
            {actionLabel}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

/**
 * Pre-configured empty states for common use cases
 */

export const EmptyItineraryState = ({ onAddCity }: { onAddCity?: () => void }) => (
  <EmptyState
    emoji="🗺️"
    title="Your itinerary is empty"
    description="Start planning your trip by adding cities from the suggestions panel below or by using the AI chat."
    actionLabel={onAddCity ? "Browse Suggestions" : undefined}
    onAction={onAddCity}
  />
);

export const EmptyChatState = () => (
  <EmptyState
    emoji="💬"
    title="No messages yet"
    description="Start a conversation with your travel companions or ask the AI assistant for trip recommendations."
  />
);

export const EmptyExpensesState = ({ onAddExpense }: { onAddExpense?: () => void }) => (
  <EmptyState
    emoji="💰"
    title="No expenses tracked"
    description="Keep track of your trip spending by adding expenses. Split costs fairly with your travel companions."
    actionLabel={onAddExpense ? "Add First Expense" : undefined}
    onAction={onAddExpense}
  />
);

export const EmptyTasksState = ({ onAddTask }: { onAddTask?: () => void }) => (
  <EmptyState
    emoji="✓"
    title="No tasks yet"
    description="Stay organized by creating a checklist for your trip preparation and activities."
    actionLabel={onAddTask ? "Create First Task" : undefined}
    onAction={onAddTask}
  />
);

export const EmptySearchState = () => (
  <EmptyState
    emoji="🔍"
    title="No results found"
    description="Try adjusting your search criteria or browse all available options."
  />
);

export const EmptyNotificationsState = () => (
  <EmptyState
    emoji="🔔"
    title="All caught up!"
    description="You don't have any notifications right now. We'll let you know when something new happens."
  />
);

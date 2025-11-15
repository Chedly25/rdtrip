import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2, Circle, User, Calendar,
  Trash2, ChevronDown, ChevronUp,
  Link as LinkIcon
} from 'lucide-react';
import type { TripTask, TaskStatus, TaskPriority } from '../../types';

interface TaskCardProps {
  task: TripTask;
  routeId: string;
  currentUserId?: string;
  userRole?: 'owner' | 'editor' | 'viewer';
  onTaskUpdate?: (taskId: string, updates: Partial<TripTask>) => void;
  onTaskDelete?: (taskId: string) => void;
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  urgent: 'bg-red-100 text-red-700 border-red-300',
  high: 'bg-orange-100 text-orange-700 border-orange-300',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  low: 'bg-green-100 text-green-700 border-green-300'
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  pending: 'text-gray-500',
  in_progress: 'text-blue-500',
  completed: 'text-green-500',
  cancelled: 'text-red-500'
};

const TASK_TYPE_LABELS: Record<string, string> = {
  book_hotel: 'Book Hotel',
  book_restaurant: 'Book Restaurant',
  purchase_tickets: 'Purchase Tickets',
  research: 'Research',
  pack: 'Pack Items',
  transport: 'Transportation',
  custom: 'Custom'
};

export function TaskCard({
  task,
  routeId,
  currentUserId,
  userRole = 'viewer',
  onTaskUpdate,
  onTaskDelete
}: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Check permissions
  const canEdit =
    currentUserId === task.assignedTo ||
    currentUserId === task.assignedBy ||
    userRole === 'owner' ||
    userRole === 'editor';

  const canDelete =
    currentUserId === task.assignedBy ||
    userRole === 'owner';

  // Format due date
  const formatDueDate = (dueDate: string) => {
    const date = new Date(dueDate);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (diff < 0) {
      return { text: 'Overdue', color: 'text-red-600', bgColor: 'bg-red-50' };
    } else if (hours < 24) {
      return { text: `${hours}h left`, color: 'text-orange-600', bgColor: 'bg-orange-50' };
    } else if (days < 7) {
      return { text: `${days}d left`, color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    } else {
      return { text: date.toLocaleDateString(), color: 'text-gray-600', bgColor: 'bg-gray-50' };
    }
  };

  // Update task status
  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!canEdit || updating) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/routes/${routeId}/tasks/${task.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('rdtrip_token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        const data = await response.json();
        if (onTaskUpdate) {
          onTaskUpdate(task.id, data.task);
        }
      }
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Delete task
  const handleDelete = async () => {
    if (!canDelete) return;

    try {
      const response = await fetch(`/api/routes/${routeId}/tasks/${task.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('rdtrip_token')}`
        }
      });

      if (response.ok && onTaskDelete) {
        onTaskDelete(task.id);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const dueInfo = task.dueDate ? formatDueDate(task.dueDate) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`bg-white rounded-lg border-2 shadow-sm hover:shadow-md transition-all ${
        task.status === 'completed' ? 'border-green-200 bg-green-50' : 'border-gray-200'
      }`}
    >
      {/* Main Content */}
      <div className="p-4">
        {/* Header Row */}
        <div className="flex items-start gap-3">
          {/* Status Icon */}
          <button
            onClick={() => {
              if (canEdit && task.status !== 'completed') {
                handleStatusChange('completed');
              } else if (canEdit && task.status === 'completed') {
                handleStatusChange('pending');
              }
            }}
            disabled={!canEdit || updating}
            className={`flex-shrink-0 mt-1 transition-all ${
              canEdit ? 'cursor-pointer hover:scale-110' : 'cursor-default'
            }`}
          >
            {task.status === 'completed' ? (
              <CheckCircle2 className={`w-6 h-6 ${STATUS_COLORS.completed}`} />
            ) : task.status === 'in_progress' ? (
              <Circle className={`w-6 h-6 ${STATUS_COLORS.in_progress} fill-current`} />
            ) : (
              <Circle className={`w-6 h-6 ${STATUS_COLORS.pending}`} />
            )}
          </button>

          {/* Task Info */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3 className={`font-semibold text-gray-900 ${
              task.status === 'completed' ? 'line-through text-gray-500' : ''
            }`}>
              {task.title}
            </h3>

            {/* Metadata Row */}
            <div className="flex flex-wrap items-center gap-2 mt-2 text-sm">
              {/* Task Type */}
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                {TASK_TYPE_LABELS[task.taskType]}
              </span>

              {/* Priority */}
              <span className={`px-2 py-1 rounded text-xs font-medium border ${
                PRIORITY_COLORS[task.priority]
              }`}>
                {task.priority.toUpperCase()}
              </span>

              {/* Assigned To */}
              {task.assignedToName && (
                <span className="flex items-center gap-1 text-gray-600">
                  <User className="w-3 h-3" />
                  {task.assignedToName}
                </span>
              )}

              {/* Due Date */}
              {dueInfo && (
                <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                  dueInfo.color
                } ${dueInfo.bgColor}`}>
                  <Calendar className="w-3 h-3" />
                  {dueInfo.text}
                </span>
              )}

              {/* Related Day */}
              {task.relatedDay && (
                <span className="flex items-center gap-1 text-gray-500 text-xs">
                  <LinkIcon className="w-3 h-3" />
                  Day {task.relatedDay}
                </span>
              )}
            </div>

            {/* Description (if exists and expanded) */}
            {task.description && expanded && (
              <p className="text-sm text-gray-600 mt-3 whitespace-pre-wrap">
                {task.description}
              </p>
            )}

            {/* Related Context (if exists and expanded) */}
            {expanded && (task.relatedActivity || task.relatedRestaurant) && (
              <div className="mt-3 space-y-1 text-sm text-gray-600">
                {task.relatedActivity && (
                  <p className="flex items-center gap-2">
                    <span className="font-medium">Activity:</span>
                    {task.relatedActivity}
                  </p>
                )}
                {task.relatedRestaurant && (
                  <p className="flex items-center gap-2">
                    <span className="font-medium">Restaurant:</span>
                    {task.relatedRestaurant}
                  </p>
                )}
              </div>
            )}

            {/* Completion Info (if completed and expanded) */}
            {expanded && task.status === 'completed' && task.completedAt && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <span className="font-medium">Completed:</span>{' '}
                  {new Date(task.completedAt).toLocaleString()}
                </p>
                {task.completionNotes && (
                  <p className="text-sm text-green-700 mt-1">
                    <span className="font-medium">Notes:</span> {task.completionNotes}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Expand/Collapse Button */}
          {(task.description || task.relatedActivity || task.relatedRestaurant || task.status === 'completed') && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {expanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
          )}
        </div>

        {/* Actions (shown when expanded) */}
        {expanded && canEdit && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t">
            {/* Status Buttons */}
            {task.status !== 'in_progress' && (
              <button
                onClick={() => handleStatusChange('in_progress')}
                disabled={updating}
                className="px-3 py-1.5 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Start
              </button>
            )}
            {task.status !== 'completed' && (
              <button
                onClick={() => handleStatusChange('completed')}
                disabled={updating}
                className="px-3 py-1.5 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Complete
              </button>
            )}
            {task.status !== 'cancelled' && task.status !== 'completed' && (
              <button
                onClick={() => handleStatusChange('cancelled')}
                disabled={updating}
                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            )}

            {/* Delete Button */}
            {canDelete && (
              <>
                {!showConfirmDelete ? (
                  <button
                    onClick={() => setShowConfirmDelete(true)}
                    className="ml-auto px-3 py-1.5 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                ) : (
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-sm text-red-600 font-medium">Confirm?</span>
                    <button
                      onClick={handleDelete}
                      className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Yes, Delete
                    </button>
                    <button
                      onClick={() => setShowConfirmDelete(false)}
                      className="px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, AlertCircle, User } from 'lucide-react';
import type { TaskType, TaskPriority, Collaborator } from '../../types';

interface CreateTaskModalProps {
  routeId: string;
  itineraryId?: string;
  dayNumber?: number;
  onClose: () => void;
  onTaskCreated?: (task: any) => void;
}

const TASK_TYPES: { value: TaskType; label: string; description: string }[] = [
  { value: 'book_hotel', label: 'Book Hotel', description: 'Reserve accommodation' },
  { value: 'book_restaurant', label: 'Book Restaurant', description: 'Make dining reservation' },
  { value: 'purchase_tickets', label: 'Purchase Tickets', description: 'Buy activity/attraction tickets' },
  { value: 'research', label: 'Research', description: 'Find information' },
  { value: 'pack', label: 'Pack Items', description: 'Prepare items to bring' },
  { value: 'transport', label: 'Transportation', description: 'Arrange travel logistics' },
  { value: 'custom', label: 'Custom Task', description: 'Other task' }
];

const PRIORITY_LEVELS: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700 border-red-300' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700 border-orange-300' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-700 border-green-300' }
];

export function CreateTaskModal({
  routeId,
  itineraryId,
  dayNumber,
  onClose,
  onTaskCreated
}: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskType, setTaskType] = useState<TaskType>('custom');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [relatedActivity, setRelatedActivity] = useState('');
  const [relatedRestaurant, setRelatedRestaurant] = useState('');
  const [relatedDay, setRelatedDay] = useState(dayNumber?.toString() || '');

  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch collaborators for assignment dropdown
  useEffect(() => {
    const fetchCollaborators = async () => {
      try {
        const response = await fetch(`/api/routes/${routeId}/collaborators`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('rdtrip_token')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setCollaborators(data.collaborators || []);
        }
      } catch (error) {
        console.error('Error fetching collaborators:', error);
      }
    };

    fetchCollaborators();
  }, [routeId]);

  // Validate form
  const validateForm = (): boolean => {
    setError('');

    if (!title.trim()) {
      setError('Title is required');
      return false;
    }

    if (title.length > 200) {
      setError('Title must be 200 characters or less');
      return false;
    }

    return true;
  };

  // Submit task
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/routes/${routeId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('rdtrip_token')}`
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          taskType,
          priority,
          assignedTo: assignedTo || undefined,
          dueDate: dueDate || undefined,
          relatedActivity: relatedActivity.trim() || undefined,
          relatedRestaurant: relatedRestaurant.trim() || undefined,
          relatedDay: relatedDay ? parseInt(relatedDay) : undefined,
          itineraryId
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create task');
      }

      const data = await response.json();

      if (onTaskCreated) {
        onTaskCreated(data.task);
      }

      onClose();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">Create New Task</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Body - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </motion.div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Book hotel in Paris for Day 3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                maxLength={200}
              />
              <p className="text-xs text-gray-500 mt-1">{title.length}/200</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more details about this task..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">{description.length}/500</p>
            </div>

            {/* Task Type & Priority Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Task Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Task Type
                </label>
                <select
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value as TaskType)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {TASK_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {TASK_TYPES.find(t => t.value === taskType)?.description}
                </p>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PRIORITY_LEVELS.map(level => (
                    <button
                      key={level.value}
                      onClick={() => setPriority(level.value)}
                      className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                        priority === level.value
                          ? level.color + ' border-opacity-100'
                          : 'bg-gray-50 text-gray-600 border-gray-200'
                      }`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Assign To & Due Date Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Assign To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Assign To (optional)
                </label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Unassigned</option>
                  {collaborators
                    .filter(c => c.status === 'accepted')
                    .map(collab => (
                      <option key={collab.userId} value={collab.userId}>
                        {collab.name} ({collab.role})
                      </option>
                    ))}
                </select>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Due Date (optional)
                </label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Related Context (Collapsible) */}
            <details className="border border-gray-200 rounded-lg p-4">
              <summary className="font-medium text-gray-700 cursor-pointer">
                Link to Itinerary (optional)
              </summary>
              <div className="mt-4 space-y-4">
                {/* Related Day */}
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Related Day Number
                  </label>
                  <input
                    type="number"
                    value={relatedDay}
                    onChange={(e) => setRelatedDay(e.target.value)}
                    placeholder="e.g., 3"
                    min={1}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Related Activity */}
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Related Activity
                  </label>
                  <input
                    type="text"
                    value={relatedActivity}
                    onChange={(e) => setRelatedActivity(e.target.value)}
                    placeholder="e.g., Eiffel Tower visit"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Related Restaurant */}
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Related Restaurant
                  </label>
                  <input
                    type="text"
                    value={relatedRestaurant}
                    onChange={(e) => setRelatedRestaurant(e.target.value)}
                    placeholder="e.g., Le Jules Verne"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </details>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg font-medium transition-colors"
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

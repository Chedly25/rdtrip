import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus, ListTodo, User, Loader2 } from 'lucide-react';
import { TaskCard } from './TaskCard';
import { CreateTaskModal } from './CreateTaskModal';
import type { TripTask, TaskStatus } from '../../types';

interface TaskBoardProps {
  routeId: string;
  itineraryId?: string;
  currentUserId?: string;
  userRole?: 'owner' | 'editor' | 'viewer';
  wsMessage?: any;
}

interface TaskGroups {
  pending: TripTask[];
  in_progress: TripTask[];
  completed: TripTask[];
  cancelled: TripTask[];
}

const STATUS_COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'pending', label: 'To Do', color: 'bg-gray-100 border-gray-300' },
  { status: 'in_progress', label: 'In Progress', color: 'bg-blue-100 border-blue-300' },
  { status: 'completed', label: 'Completed', color: 'bg-green-100 border-green-300' },
  { status: 'cancelled', label: 'Cancelled', color: 'bg-red-100 border-red-300' }
];

export function TaskBoard({
  routeId,
  itineraryId,
  currentUserId,
  userRole = 'viewer',
  wsMessage
}: TaskBoardProps) {
  const [tasks, setTasks] = useState<TripTask[]>([]);
  const [grouped, setGrouped] = useState<TaskGroups>({
    pending: [],
    in_progress: [],
    completed: [],
    cancelled: []
  });
  const [counts, setCounts] = useState({ pending: 0, in_progress: 0, completed: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterAssignedToMe, setFilterAssignedToMe] = useState(false);

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams();
      if (filterAssignedToMe && currentUserId) {
        params.append('assignedTo', currentUserId);
      }

      const response = await fetch(`/api/routes/${routeId}/tasks?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('rdtrip_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
        setGrouped(data.grouped || { pending: [], in_progress: [], completed: [], cancelled: [] });
        setCounts(data.counts || { pending: 0, in_progress: 0, completed: 0, cancelled: 0 });
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchTasks();
  }, [routeId, filterAssignedToMe]);

  // Handle WebSocket updates
  useEffect(() => {
    if (!wsMessage) return;

    switch (wsMessage.type) {
      case 'task_created':
        if (wsMessage.task) {
          fetchTasks(); // Refresh to get proper grouping
        }
        break;

      case 'task_updated':
        if (wsMessage.task) {
          fetchTasks(); // Refresh to update grouping
        }
        break;

      case 'task_deleted':
        if (wsMessage.taskId) {
          setTasks(prev => prev.filter(t => t.id !== wsMessage.taskId));
          // Update grouped as well
          setGrouped(prev => {
            const newGrouped = { ...prev };
            Object.keys(newGrouped).forEach(status => {
              newGrouped[status as TaskStatus] = newGrouped[status as TaskStatus].filter(
                t => t.id !== wsMessage.taskId
              );
            });
            return newGrouped;
          });
        }
        break;
    }
  }, [wsMessage]);

  // Handle task update from card
  const handleTaskUpdate = (taskId: string, updates: Partial<TripTask>) => {
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
    // Refresh to ensure proper grouping
    fetchTasks();
  };

  // Handle task delete from card
  const handleTaskDelete = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    setGrouped(prev => {
      const newGrouped = { ...prev };
      Object.keys(newGrouped).forEach(status => {
        newGrouped[status as TaskStatus] = newGrouped[status as TaskStatus].filter(
          t => t.id !== taskId
        );
      });
      return newGrouped;
    });
  };

  // Handle task created
  const handleTaskCreated = () => {
    fetchTasks(); // Refresh to get updated list
  };

  const canCreateTask = userRole === 'owner' || userRole === 'editor';

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ListTodo className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Task Board</h2>
          </div>

          {canCreateTask && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              New Task
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterAssignedToMe(!filterAssignedToMe)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              filterAssignedToMe
                ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                : 'bg-gray-100 text-gray-600 border-2 border-gray-200'
            }`}
          >
            <User className="w-4 h-4" />
            My Tasks Only
          </button>

          {/* Task Count Summary */}
          <div className="ml-auto flex items-center gap-3 text-sm text-gray-600">
            <span>Total: {tasks.length}</span>
            {counts.pending > 0 && (
              <span className="px-2 py-1 bg-gray-100 rounded">To Do: {counts.pending}</span>
            )}
            {counts.in_progress > 0 && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                In Progress: {counts.in_progress}
              </span>
            )}
            {counts.completed > 0 && (
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                Done: {counts.completed}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="h-full flex gap-4 p-4 min-w-max">
            {STATUS_COLUMNS.map(column => (
              <div
                key={column.status}
                className="flex-shrink-0 w-80 flex flex-col bg-white rounded-lg border-2 shadow-sm"
                style={{ maxHeight: 'calc(100vh - 250px)' }}
              >
                {/* Column Header */}
                <div className={`px-4 py-3 border-b-2 ${column.color} rounded-t-lg`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">{column.label}</h3>
                    <span className="px-2 py-1 bg-white bg-opacity-50 rounded-full text-sm font-medium">
                      {grouped[column.status]?.length || 0}
                    </span>
                  </div>
                </div>

                {/* Column Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  <AnimatePresence>
                    {grouped[column.status]?.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 text-sm">
                        No tasks
                      </div>
                    ) : (
                      grouped[column.status]?.map(task => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          routeId={routeId}
                          currentUserId={currentUserId}
                          userRole={userRole}
                          onTaskUpdate={handleTaskUpdate}
                          onTaskDelete={handleTaskDelete}
                        />
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          routeId={routeId}
          itineraryId={itineraryId}
          onClose={() => setShowCreateModal(false)}
          onTaskCreated={handleTaskCreated}
        />
      )}
    </div>
  );
}

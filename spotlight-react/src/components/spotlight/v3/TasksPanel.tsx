/**
 * TasksPanel - Trip Task Management
 * Phase 1: Tasks tab content
 *
 * Preserves ALL task features:
 * - Create/edit tasks
 * - Assign to collaborators
 * - Due dates & priorities
 * - Status tracking
 * - Real-time updates
 */

import { TaskBoard } from '../../collaboration/TaskBoard';

interface TasksPanelProps {
  routeId: string | null;
  userId?: string;
}

const TasksPanel = ({ routeId, userId }: TasksPanelProps) => {
  if (!routeId || !userId) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-center">
        <div>
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-lg font-semibold mb-2">Tasks Unavailable</h3>
          <p className="text-sm text-gray-600">Save your trip to manage tasks</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white">
      <TaskBoard routeId={routeId} currentUserId={userId} />
    </div>
  );
};

export default TasksPanel;

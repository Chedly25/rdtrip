/**
 * Task Board - "The Planning Desk"
 *
 * A Kanban-style task board with vintage travel office aesthetic.
 * Features status columns styled as cork boards with pinned cards.
 *
 * Design: Wanderlust Editorial with travel planning desk styling
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ListTodo, User, Loader2 } from 'lucide-react';
import { TaskCard } from './TaskCard';
import { CreateTaskModal } from './CreateTaskModal';
import type { TripTask, TaskStatus } from '../../types';

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
  sageLight: '#8BA99A',
  sageDark: '#4A6B5A',
  espresso: '#2C1810',
  darkBrown: '#3D2A1E',
  mediumBrown: '#5C4033',
  lightBrown: '#8B7355',
  parchment: '#F5E6C8',
  corkBoard: '#D4B896',
  corkBoardDark: '#C4A87A',
};

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

// Status column configurations with Wanderlust colors
const STATUS_COLUMNS: { status: TaskStatus; label: string; color: string; accent: string; icon: string }[] = [
  { status: 'pending', label: 'To Do', color: colors.golden, accent: colors.goldenLight, icon: '📋' },
  { status: 'in_progress', label: 'In Progress', color: colors.terracotta, accent: colors.terracottaLight, icon: '✏️' },
  { status: 'completed', label: 'Completed', color: colors.sage, accent: colors.sageLight, icon: '✓' },
  { status: 'cancelled', label: 'Cancelled', color: colors.lightBrown, accent: colors.mediumBrown, icon: '✗' },
];

export function TaskBoard({
  routeId,
  itineraryId,
  currentUserId,
  userRole = 'viewer',
  wsMessage,
}: TaskBoardProps) {
  const [tasks, setTasks] = useState<TripTask[]>([]);
  const [grouped, setGrouped] = useState<TaskGroups>({
    pending: [],
    in_progress: [],
    completed: [],
    cancelled: [],
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
          Authorization: `Bearer ${localStorage.getItem('rdtrip_token')}`,
        },
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
          fetchTasks();
        }
        break;
      case 'task_updated':
        if (wsMessage.task) {
          fetchTasks();
        }
        break;
      case 'task_deleted':
        if (wsMessage.taskId) {
          setTasks((prev) => prev.filter((t) => t.id !== wsMessage.taskId));
          setGrouped((prev) => {
            const newGrouped = { ...prev };
            Object.keys(newGrouped).forEach((status) => {
              newGrouped[status as TaskStatus] = newGrouped[status as TaskStatus].filter(
                (t) => t.id !== wsMessage.taskId
              );
            });
            return newGrouped;
          });
        }
        break;
    }
  }, [wsMessage]);

  const handleTaskUpdate = (taskId: string, updates: Partial<TripTask>) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t)));
    fetchTasks();
  };

  const handleTaskDelete = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setGrouped((prev) => {
      const newGrouped = { ...prev };
      Object.keys(newGrouped).forEach((status) => {
        newGrouped[status as TaskStatus] = newGrouped[status as TaskStatus].filter(
          (t) => t.id !== taskId
        );
      });
      return newGrouped;
    });
  };

  const handleTaskCreated = () => {
    fetchTasks();
  };

  const canCreateTask = userRole === 'owner' || userRole === 'editor';

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: `linear-gradient(180deg, ${colors.warmWhite} 0%, ${colors.cream} 100%)`,
      }}
    >
      {/* Header */}
      <div
        style={{
          background: colors.cream,
          borderBottom: `1px solid ${colors.golden}`,
          padding: '16px 20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                background: `${colors.terracotta}15`,
                border: `1px solid ${colors.terracotta}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ListTodo style={{ width: 20, height: 20, color: colors.terracotta }} />
            </div>
            <h2
              style={{
                margin: 0,
                fontFamily: 'Georgia, serif',
                fontSize: '18px',
                fontWeight: 700,
                color: colors.espresso,
              }}
            >
              Planning Board
            </h2>
          </div>

          {canCreateTask && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCreateModal(true)}
              style={{
                padding: '10px 18px',
                background: `linear-gradient(135deg, ${colors.terracotta} 0%, ${colors.terracottaLight} 100%)`,
                border: 'none',
                borderRadius: '8px',
                fontFamily: '"Courier New", monospace',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '1px',
                color: colors.cream,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(196, 88, 48, 0.3)',
              }}
            >
              <Plus style={{ width: 16, height: 16 }} />
              NEW TASK
            </motion.button>
          )}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setFilterAssignedToMe(!filterAssignedToMe)}
            style={{
              padding: '8px 14px',
              background: filterAssignedToMe ? `${colors.terracotta}15` : colors.cream,
              border: `1px solid ${filterAssignedToMe ? colors.terracotta : colors.golden}`,
              borderRadius: '6px',
              fontFamily: '"Courier New", monospace',
              fontSize: '11px',
              fontWeight: 700,
              color: filterAssignedToMe ? colors.terracotta : colors.mediumBrown,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <User style={{ width: 14, height: 14 }} />
            My Tasks Only
          </motion.button>

          {/* Task Count Summary */}
          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontFamily: '"Courier New", monospace',
              fontSize: '11px',
              color: colors.lightBrown,
            }}
          >
            <span>Total: {tasks.length}</span>
            {counts.pending > 0 && (
              <span
                style={{
                  padding: '4px 8px',
                  background: `${colors.golden}20`,
                  borderRadius: '4px',
                  color: colors.goldenDark,
                }}
              >
                To Do: {counts.pending}
              </span>
            )}
            {counts.in_progress > 0 && (
              <span
                style={{
                  padding: '4px 8px',
                  background: `${colors.terracotta}20`,
                  borderRadius: '4px',
                  color: colors.terracotta,
                }}
              >
                Active: {counts.in_progress}
              </span>
            )}
            {counts.completed > 0 && (
              <span
                style={{
                  padding: '4px 8px',
                  background: `${colors.sage}20`,
                  borderRadius: '4px',
                  color: colors.sage,
                }}
              >
                Done: {counts.completed}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Loader2
            style={{
              width: 32,
              height: 32,
              color: colors.golden,
              animation: 'spin 1s linear infinite',
            }}
          />
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            overflowX: 'auto',
            overflowY: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              display: 'flex',
              gap: '16px',
              padding: '16px 20px',
              minWidth: 'max-content',
            }}
          >
            {STATUS_COLUMNS.map((column) => (
              <div
                key={column.status}
                style={{
                  flexShrink: 0,
                  width: '300px',
                  display: 'flex',
                  flexDirection: 'column',
                  background: `linear-gradient(180deg, ${colors.cream} 0%, ${colors.parchment}50 100%)`,
                  borderRadius: '12px',
                  border: `1px solid ${colors.golden}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  maxHeight: 'calc(100vh - 280px)',
                }}
              >
                {/* Column Header */}
                <div
                  style={{
                    padding: '14px 16px',
                    borderBottom: `1px solid ${colors.golden}`,
                    background: `linear-gradient(135deg, ${column.color}15 0%, ${column.accent}10 100%)`,
                    borderRadius: '12px 12px 0 0',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px' }}>{column.icon}</span>
                      <h3
                        style={{
                          margin: 0,
                          fontFamily: 'Georgia, serif',
                          fontSize: '14px',
                          fontWeight: 600,
                          color: colors.espresso,
                        }}
                      >
                        {column.label}
                      </h3>
                    </div>
                    <span
                      style={{
                        padding: '2px 10px',
                        background: `${column.color}20`,
                        border: `1px solid ${column.color}`,
                        borderRadius: '12px',
                        fontFamily: '"Courier New", monospace',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: column.color,
                      }}
                    >
                      {grouped[column.status]?.length || 0}
                    </span>
                  </div>
                </div>

                {/* Column Content - Scrollable */}
                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '12px',
                  }}
                >
                  <AnimatePresence>
                    {grouped[column.status]?.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                          textAlign: 'center',
                          padding: '32px 16px',
                          color: colors.lightBrown,
                        }}
                      >
                        <p
                          style={{
                            margin: 0,
                            fontFamily: 'Georgia, serif',
                            fontSize: '13px',
                            fontStyle: 'italic',
                          }}
                        >
                          No tasks yet
                        </p>
                      </motion.div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {grouped[column.status]?.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            routeId={routeId}
                            currentUserId={currentUserId}
                            userRole={userRole}
                            onTaskUpdate={handleTaskUpdate}
                            onTaskDelete={handleTaskDelete}
                          />
                        ))}
                      </div>
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

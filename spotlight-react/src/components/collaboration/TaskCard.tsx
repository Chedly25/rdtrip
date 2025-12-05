/**
 * Task Card - "The Travel Manifest"
 *
 * A vintage cargo manifest / travel document aesthetic for task management.
 * Features brass checkbox latches, luggage tag styling, and typewriter text.
 *
 * Design: Wanderlust Editorial with shipping manifest styling
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Calendar,
  Trash2,
  ChevronDown,
  ChevronUp,
  Link as LinkIcon,
  Clock,
  AlertTriangle,
  Play,
  CheckCheck,
} from 'lucide-react';
import type { TripTask, TaskStatus, TaskPriority } from '../../types';

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

  // Manifest accents
  parchment: '#F5E6C8',
  inkBlue: '#1A365D',
  stampRed: '#8B2323',
  brass: '#B8860B',
  brassLight: '#DAA520',
};

interface TaskCardProps {
  task: TripTask;
  routeId: string;
  currentUserId?: string;
  userRole?: 'owner' | 'editor' | 'viewer';
  onTaskUpdate?: (taskId: string, updates: Partial<TripTask>) => void;
  onTaskDelete?: (taskId: string) => void;
}

// Priority configurations
const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bgColor: string; icon: string }> = {
  urgent: { label: 'URGENT', color: colors.stampRed, bgColor: `${colors.stampRed}15`, icon: '🚨' },
  high: { label: 'HIGH', color: colors.terracotta, bgColor: `${colors.terracotta}15`, icon: '⚡' },
  medium: { label: 'MEDIUM', color: colors.golden, bgColor: `${colors.golden}15`, icon: '📌' },
  low: { label: 'LOW', color: colors.sage, bgColor: `${colors.sage}15`, icon: '📎' },
};

// Task type labels
const TASK_TYPE_LABELS: Record<string, { label: string; icon: string }> = {
  book_hotel: { label: 'Book Hotel', icon: '🏨' },
  book_restaurant: { label: 'Book Restaurant', icon: '🍽️' },
  purchase_tickets: { label: 'Purchase Tickets', icon: '🎫' },
  research: { label: 'Research', icon: '🔍' },
  pack: { label: 'Pack Items', icon: '🧳' },
  transport: { label: 'Transportation', icon: '🚗' },
  custom: { label: 'Custom', icon: '📝' },
};

// =============================================================================
// BRASS CHECKBOX
// =============================================================================
const BrassCheckbox: React.FC<{
  checked: boolean;
  onClick: () => void;
  disabled?: boolean;
  inProgress?: boolean;
}> = ({ checked, onClick, disabled, inProgress }) => (
  <motion.button
    whileHover={disabled ? {} : { scale: 1.1 }}
    whileTap={disabled ? {} : { scale: 0.95 }}
    onClick={onClick}
    disabled={disabled}
    style={{
      width: 28,
      height: 28,
      borderRadius: '4px',
      background: checked
        ? `linear-gradient(135deg, ${colors.sage} 0%, ${colors.sageDark} 100%)`
        : inProgress
        ? `linear-gradient(135deg, ${colors.terracotta} 0%, ${colors.terracottaLight} 100%)`
        : `linear-gradient(135deg, ${colors.brass} 0%, ${colors.brassLight} 100%)`,
      border: `2px solid ${checked ? colors.sageDark : inProgress ? colors.terracotta : colors.goldenDark}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: disabled ? 'default' : 'pointer',
      boxShadow: '0 2px 4px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2)',
      flexShrink: 0,
    }}
  >
    {checked ? (
      <CheckCheck style={{ width: 16, height: 16, color: colors.cream }} />
    ) : inProgress ? (
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      >
        <Play style={{ width: 14, height: 14, color: colors.cream }} />
      </motion.div>
    ) : null}
  </motion.button>
);

// =============================================================================
// LUGGAGE TAG BADGE
// =============================================================================
const LuggageTagBadge: React.FC<{
  text: string;
  icon?: string;
  color: string;
  bgColor: string;
}> = ({ text, icon, color, bgColor }) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '3px 8px',
      background: bgColor,
      border: `1px solid ${color}`,
      borderRadius: '4px',
      fontFamily: '"Courier New", monospace',
      fontSize: '10px',
      fontWeight: 700,
      color: color,
      letterSpacing: '0.5px',
    }}
  >
    {icon && <span>{icon}</span>}
    <span>{text}</span>
  </div>
);

// =============================================================================
// DUE DATE BADGE
// =============================================================================
const DueDateBadge: React.FC<{ dueDate: string }> = ({ dueDate }) => {
  const date = new Date(dueDate);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));

  let text: string;
  let color: string;
  let isUrgent = false;

  if (diff < 0) {
    text = 'OVERDUE';
    color = colors.stampRed;
    isUrgent = true;
  } else if (hours < 24) {
    text = `${hours}h left`;
    color = colors.terracotta;
    isUrgent = true;
  } else if (days < 3) {
    text = `${days}d left`;
    color = colors.terracotta;
  } else if (days < 7) {
    text = `${days}d left`;
    color = colors.golden;
  } else {
    text = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    color = colors.sage;
  }

  return (
    <motion.div
      animate={isUrgent ? { scale: [1, 1.02, 1] } : {}}
      transition={{ duration: 1, repeat: isUrgent ? Infinity : 0 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 8px',
        background: `${color}15`,
        border: `1px solid ${color}`,
        borderRadius: '4px',
        color: color,
      }}
    >
      {isUrgent ? (
        <AlertTriangle style={{ width: 12, height: 12 }} />
      ) : (
        <Calendar style={{ width: 12, height: 12 }} />
      )}
      <span
        style={{
          fontFamily: '"Courier New", monospace',
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.5px',
        }}
      >
        {text}
      </span>
    </motion.div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export function TaskCard({
  task,
  routeId,
  currentUserId,
  userRole = 'viewer',
  onTaskUpdate,
  onTaskDelete,
}: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Permissions
  const canEdit =
    currentUserId === task.assignedTo ||
    currentUserId === task.assignedBy ||
    userRole === 'owner' ||
    userRole === 'editor';

  const canDelete = currentUserId === task.assignedBy || userRole === 'owner';

  // Status update handler
  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!canEdit || updating) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/routes/${routeId}/tasks/${task.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const data = await response.json();
        onTaskUpdate?.(task.id, data.task);
      }
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Delete handler
  const handleDelete = async () => {
    if (!canDelete) return;

    try {
      const response = await fetch(`/api/routes/${routeId}/tasks/${task.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        onTaskDelete?.(task.id);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const priority = PRIORITY_CONFIG[task.priority];
  const taskType = TASK_TYPE_LABELS[task.taskType] || TASK_TYPE_LABELS.custom;
  const isCompleted = task.status === 'completed';
  const isInProgress = task.status === 'in_progress';
  const hasExpandableContent = task.description || task.relatedActivity || task.relatedRestaurant || isCompleted;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      style={{
        position: 'relative',
        background: isCompleted
          ? `linear-gradient(135deg, ${colors.sage}10 0%, ${colors.sageLight}10 100%)`
          : `linear-gradient(135deg, ${colors.cream} 0%, ${colors.parchment} 100%)`,
        borderRadius: '8px',
        border: `1px solid ${isCompleted ? colors.sage : colors.golden}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        overflow: 'hidden',
      }}
    >
      {/* Manifest stripe decoration */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '4px',
          height: '100%',
          background: isCompleted
            ? colors.sage
            : isInProgress
            ? colors.terracotta
            : colors.golden,
        }}
      />

      {/* Main content */}
      <div style={{ padding: '16px 16px 16px 20px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          {/* Checkbox */}
          <BrassCheckbox
            checked={isCompleted}
            inProgress={isInProgress}
            onClick={() => {
              if (canEdit) {
                if (isCompleted) {
                  handleStatusChange('pending');
                } else {
                  handleStatusChange('completed');
                }
              }
            }}
            disabled={!canEdit || updating}
          />

          {/* Task info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Title */}
            <h3
              style={{
                margin: 0,
                fontFamily: 'Georgia, serif',
                fontSize: '15px',
                fontWeight: 600,
                color: isCompleted ? colors.lightBrown : colors.espresso,
                textDecoration: isCompleted ? 'line-through' : 'none',
                lineHeight: 1.4,
              }}
            >
              {task.title}
            </h3>

            {/* Metadata row */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '8px',
                marginTop: '10px',
              }}
            >
              {/* Task type */}
              <LuggageTagBadge
                text={taskType.label}
                icon={taskType.icon}
                color={colors.espresso}
                bgColor={colors.parchment}
              />

              {/* Priority */}
              <LuggageTagBadge
                text={priority.label}
                icon={priority.icon}
                color={priority.color}
                bgColor={priority.bgColor}
              />

              {/* Assigned to */}
              {task.assignedToName && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontFamily: '"Courier New", monospace',
                    fontSize: '11px',
                    color: colors.mediumBrown,
                  }}
                >
                  <User style={{ width: 12, height: 12 }} />
                  <span>{task.assignedToName}</span>
                </div>
              )}

              {/* Due date */}
              {task.dueDate && <DueDateBadge dueDate={task.dueDate} />}

              {/* Related day */}
              {task.relatedDay && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontFamily: '"Courier New", monospace',
                    fontSize: '10px',
                    color: colors.lightBrown,
                  }}
                >
                  <LinkIcon style={{ width: 10, height: 10 }} />
                  <span>Day {task.relatedDay}</span>
                </div>
              )}
            </div>

            {/* Expanded content */}
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden' }}
                >
                  {/* Description */}
                  {task.description && (
                    <p
                      style={{
                        margin: '12px 0 0 0',
                        fontFamily: 'Georgia, serif',
                        fontSize: '13px',
                        color: colors.mediumBrown,
                        lineHeight: 1.5,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {task.description}
                    </p>
                  )}

                  {/* Related context */}
                  {(task.relatedActivity || task.relatedRestaurant) && (
                    <div
                      style={{
                        marginTop: '12px',
                        padding: '10px',
                        background: colors.cream,
                        borderRadius: '6px',
                        border: `1px dashed ${colors.golden}`,
                      }}
                    >
                      {task.relatedActivity && (
                        <p
                          style={{
                            margin: 0,
                            fontFamily: 'Georgia, serif',
                            fontSize: '12px',
                            color: colors.mediumBrown,
                          }}
                        >
                          <strong style={{ color: colors.espresso }}>Activity:</strong> {task.relatedActivity}
                        </p>
                      )}
                      {task.relatedRestaurant && (
                        <p
                          style={{
                            margin: task.relatedActivity ? '6px 0 0 0' : 0,
                            fontFamily: 'Georgia, serif',
                            fontSize: '12px',
                            color: colors.mediumBrown,
                          }}
                        >
                          <strong style={{ color: colors.espresso }}>Restaurant:</strong> {task.relatedRestaurant}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Completion info */}
                  {isCompleted && task.completedAt && (
                    <div
                      style={{
                        marginTop: '12px',
                        padding: '10px',
                        background: `${colors.sage}10`,
                        borderRadius: '6px',
                        border: `1px solid ${colors.sage}`,
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontFamily: '"Courier New", monospace',
                          fontSize: '11px',
                          color: colors.sage,
                        }}
                      >
                        <Clock style={{ width: 12, height: 12, display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                        Completed: {new Date(task.completedAt).toLocaleString()}
                      </p>
                      {task.completionNotes && (
                        <p
                          style={{
                            margin: '6px 0 0 0',
                            fontFamily: 'Georgia, serif',
                            fontSize: '12px',
                            color: colors.sageDark,
                          }}
                        >
                          {task.completionNotes}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  {canEdit && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginTop: '16px',
                        paddingTop: '12px',
                        borderTop: `1px solid ${colors.golden}`,
                      }}
                    >
                      {task.status !== 'in_progress' && !isCompleted && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleStatusChange('in_progress')}
                          disabled={updating}
                          style={{
                            padding: '6px 12px',
                            background: `${colors.terracotta}15`,
                            border: `1px solid ${colors.terracotta}`,
                            borderRadius: '6px',
                            fontFamily: '"Courier New", monospace',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: colors.terracotta,
                            cursor: updating ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Play style={{ width: 12, height: 12 }} />
                          Start
                        </motion.button>
                      )}

                      {!isCompleted && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleStatusChange('completed')}
                          disabled={updating}
                          style={{
                            padding: '6px 12px',
                            background: `${colors.sage}15`,
                            border: `1px solid ${colors.sage}`,
                            borderRadius: '6px',
                            fontFamily: '"Courier New", monospace',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: colors.sage,
                            cursor: updating ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <CheckCheck style={{ width: 12, height: 12 }} />
                          Complete
                        </motion.button>
                      )}

                      {task.status !== 'cancelled' && !isCompleted && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleStatusChange('cancelled')}
                          disabled={updating}
                          style={{
                            padding: '6px 12px',
                            background: colors.cream,
                            border: `1px solid ${colors.lightBrown}`,
                            borderRadius: '6px',
                            fontFamily: '"Courier New", monospace',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: colors.lightBrown,
                            cursor: updating ? 'not-allowed' : 'pointer',
                          }}
                        >
                          Cancel
                        </motion.button>
                      )}

                      {/* Delete button */}
                      {canDelete && (
                        <div style={{ marginLeft: 'auto' }}>
                          {!showConfirmDelete ? (
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setShowConfirmDelete(true)}
                              style={{
                                padding: '6px 12px',
                                background: `${colors.stampRed}10`,
                                border: `1px solid ${colors.stampRed}`,
                                borderRadius: '6px',
                                fontFamily: '"Courier New", monospace',
                                fontSize: '11px',
                                fontWeight: 700,
                                color: colors.stampRed,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <Trash2 style={{ width: 12, height: 12 }} />
                              Delete
                            </motion.button>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span
                                style={{
                                  fontFamily: '"Courier New", monospace',
                                  fontSize: '11px',
                                  color: colors.stampRed,
                                  fontWeight: 700,
                                }}
                              >
                                Confirm?
                              </span>
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleDelete}
                                style={{
                                  padding: '6px 12px',
                                  background: colors.stampRed,
                                  border: 'none',
                                  borderRadius: '6px',
                                  fontFamily: '"Courier New", monospace',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  color: colors.cream,
                                  cursor: 'pointer',
                                }}
                              >
                                Yes
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setShowConfirmDelete(false)}
                                style={{
                                  padding: '6px 12px',
                                  background: colors.cream,
                                  border: `1px solid ${colors.lightBrown}`,
                                  borderRadius: '6px',
                                  fontFamily: '"Courier New", monospace',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  color: colors.lightBrown,
                                  cursor: 'pointer',
                                }}
                              >
                                No
                              </motion.button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Expand button */}
          {hasExpandableContent && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setExpanded(!expanded)}
              style={{
                padding: '4px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: colors.lightBrown,
                flexShrink: 0,
              }}
            >
              {expanded ? (
                <ChevronUp style={{ width: 18, height: 18 }} />
              ) : (
                <ChevronDown style={{ width: 18, height: 18 }} />
              )}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

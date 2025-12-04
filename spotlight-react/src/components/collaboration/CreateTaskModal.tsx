/**
 * Create Task Modal - "The Travel Bureau Assignment"
 *
 * A vintage travel bureau assignment form with typewriter styling,
 * brass accents, and manifest-style organization.
 *
 * Design: Wanderlust Editorial with vintage form aesthetics
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, AlertCircle, User, ChevronDown, Loader2 } from 'lucide-react';
import type { TaskType, TaskPriority, Collaborator } from '../../types';

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
  espresso: '#2C1810',
  darkBrown: '#3D2A1E',
  mediumBrown: '#5C4033',
  lightBrown: '#8B7355',
  parchment: '#F5E6C8',
  stampRed: '#8B2323',
  inkBlue: '#1C3A5F',
};

interface CreateTaskModalProps {
  routeId: string;
  itineraryId?: string;
  dayNumber?: number;
  onClose: () => void;
  onTaskCreated?: (task: any) => void;
}

const TASK_TYPES: { value: TaskType; label: string; description: string; icon: string }[] = [
  { value: 'book_hotel', label: 'Book Accommodation', description: 'Reserve lodging', icon: '🏨' },
  { value: 'book_restaurant', label: 'Book Restaurant', description: 'Make dining reservation', icon: '🍽️' },
  { value: 'purchase_tickets', label: 'Purchase Tickets', description: 'Buy attraction tickets', icon: '🎫' },
  { value: 'research', label: 'Research', description: 'Gather information', icon: '🔍' },
  { value: 'pack', label: 'Pack Items', description: 'Prepare belongings', icon: '🧳' },
  { value: 'transport', label: 'Transportation', description: 'Arrange travel', icon: '🚗' },
  { value: 'custom', label: 'Custom Task', description: 'Other assignment', icon: '📝' },
];

const PRIORITY_LEVELS: { value: TaskPriority; label: string; color: string; icon: string }[] = [
  { value: 'urgent', label: 'URGENT', color: colors.stampRed, icon: '🚨' },
  { value: 'high', label: 'HIGH', color: colors.terracotta, icon: '⚡' },
  { value: 'medium', label: 'MEDIUM', color: colors.golden, icon: '📌' },
  { value: 'low', label: 'LOW', color: colors.sage, icon: '📎' },
];

// =============================================================================
// DECORATIVE ELEMENTS
// =============================================================================

function TypewriterHeader() {
  return (
    <div
      style={{
        textAlign: 'center',
        marginBottom: '8px',
        paddingBottom: '16px',
        borderBottom: `2px solid ${colors.golden}`,
        position: 'relative',
      }}
    >
      {/* Decorative corner stamps */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '24px',
          height: '24px',
          borderLeft: `3px solid ${colors.terracotta}`,
          borderTop: `3px solid ${colors.terracotta}`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '24px',
          height: '24px',
          borderRight: `3px solid ${colors.terracotta}`,
          borderTop: `3px solid ${colors.terracotta}`,
        }}
      />

      <p
        style={{
          fontFamily: '"Courier New", monospace',
          fontSize: '10px',
          letterSpacing: '3px',
          color: colors.lightBrown,
          marginBottom: '4px',
        }}
      >
        TRAVEL BUREAU
      </p>
      <h2
        style={{
          fontFamily: 'Georgia, serif',
          fontSize: '22px',
          fontWeight: 700,
          color: colors.espresso,
          margin: 0,
        }}
      >
        New Assignment
      </h2>
      <p
        style={{
          fontFamily: '"Courier New", monospace',
          fontSize: '10px',
          letterSpacing: '2px',
          color: colors.mediumBrown,
          marginTop: '4px',
        }}
      >
        TASK REQUISITION FORM
      </p>
    </div>
  );
}

function FormField({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <label
        style={{
          display: 'block',
          fontFamily: '"Courier New", monospace',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '1px',
          color: colors.mediumBrown,
          marginBottom: '6px',
          textTransform: 'uppercase',
        }}
      >
        {label}
        {required && (
          <span style={{ color: colors.stampRed, marginLeft: '4px' }}>*</span>
        )}
      </label>
      {children}
      {hint && (
        <p
          style={{
            fontFamily: '"Courier New", monospace',
            fontSize: '10px',
            color: colors.lightBrown,
            marginTop: '4px',
            fontStyle: 'italic',
          }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

export function CreateTaskModal({
  routeId,
  itineraryId,
  dayNumber,
  onClose,
  onTaskCreated,
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
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch collaborators
  useEffect(() => {
    const fetchCollaborators = async () => {
      try {
        const response = await fetch(`/api/routes/${routeId}/collaborators`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('rdtrip_token')}`,
          },
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

  const validateForm = (): boolean => {
    setError('');

    if (!title.trim()) {
      setError('Assignment title is required');
      return false;
    }

    if (title.length > 200) {
      setError('Title must be 200 characters or less');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/routes/${routeId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('rdtrip_token')}`,
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
          itineraryId,
        }),
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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    fontFamily: 'Georgia, serif',
    fontSize: '14px',
    color: colors.espresso,
    background: colors.warmWhite,
    border: `1px solid ${colors.golden}`,
    borderRadius: '6px',
    outline: 'none',
    transition: 'all 0.2s ease',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%235C4033' d='M6 8L2 4h8z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    paddingRight: '36px',
    cursor: 'pointer',
  };

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(44, 24, 16, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '16px',
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: `linear-gradient(180deg, ${colors.cream} 0%, ${colors.warmWhite} 100%)`,
            borderRadius: '16px',
            border: `2px solid ${colors.golden}`,
            boxShadow: `0 25px 50px -12px rgba(44, 24, 16, 0.4), inset 0 1px 0 ${colors.parchment}`,
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div style={{ padding: '24px 24px 0' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginBottom: '8px',
              }}
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: `${colors.terracotta}15`,
                  border: `1px solid ${colors.terracotta}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: colors.terracotta,
                }}
              >
                <X style={{ width: 16, height: 16 }} />
              </motion.button>
            </div>
            <TypewriterHeader />
          </div>

          {/* Body - Scrollable */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px 24px',
            }}
          >
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: `${colors.stampRed}10`,
                  border: `1px solid ${colors.stampRed}`,
                  borderRadius: '8px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  marginBottom: '20px',
                }}
              >
                <AlertCircle
                  style={{
                    width: 18,
                    height: 18,
                    color: colors.stampRed,
                    flexShrink: 0,
                    marginTop: '1px',
                  }}
                />
                <p
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: '13px',
                    color: colors.stampRed,
                    margin: 0,
                  }}
                >
                  {error}
                </p>
              </motion.div>
            )}

            {/* Title */}
            <FormField label="Assignment Title" required hint={`${title.length}/200 characters`}>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Book boutique hotel in Marrakech for Day 3"
                style={inputStyle}
                maxLength={200}
              />
            </FormField>

            {/* Description */}
            <FormField label="Additional Notes" hint={`${description.length}/500 characters`}>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details, requirements, or special instructions..."
                style={{
                  ...inputStyle,
                  resize: 'none',
                  minHeight: '80px',
                }}
                maxLength={500}
              />
            </FormField>

            {/* Task Type & Priority Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Task Type */}
              <FormField label="Category">
                <select
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value as TaskType)}
                  style={selectStyle}
                >
                  {TASK_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </FormField>

              {/* Priority */}
              <FormField label="Priority Level">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                  {PRIORITY_LEVELS.map((level) => (
                    <motion.button
                      key={level.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setPriority(level.value)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: `2px solid ${priority === level.value ? level.color : colors.golden}40`,
                        background:
                          priority === level.value ? `${level.color}15` : colors.warmWhite,
                        fontFamily: '"Courier New", monospace',
                        fontSize: '10px',
                        fontWeight: 700,
                        letterSpacing: '0.5px',
                        color: priority === level.value ? level.color : colors.mediumBrown,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <span>{level.icon}</span>
                      {level.label}
                    </motion.button>
                  ))}
                </div>
              </FormField>
            </div>

            {/* Assign To & Due Date Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Assign To */}
              <FormField label="Assign To">
                <div style={{ position: 'relative' }}>
                  <User
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 16,
                      height: 16,
                      color: colors.lightBrown,
                    }}
                  />
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    style={{
                      ...selectStyle,
                      paddingLeft: '36px',
                    }}
                  >
                    <option value="">Unassigned</option>
                    {collaborators
                      .filter((c) => c.status === 'accepted')
                      .map((collab) => (
                        <option key={collab.userId} value={collab.userId}>
                          {collab.name} ({collab.role})
                        </option>
                      ))}
                  </select>
                </div>
              </FormField>

              {/* Due Date */}
              <FormField label="Due Date">
                <div style={{ position: 'relative' }}>
                  <Calendar
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 16,
                      height: 16,
                      color: colors.lightBrown,
                    }}
                  />
                  <input
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    style={{
                      ...inputStyle,
                      paddingLeft: '36px',
                    }}
                  />
                </div>
              </FormField>
            </div>

            {/* Advanced Options Toggle */}
            <motion.button
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: `${colors.parchment}50`,
                border: `1px dashed ${colors.golden}`,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                marginBottom: showAdvanced ? '16px' : 0,
              }}
            >
              <span
                style={{
                  fontFamily: '"Courier New", monospace',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '1px',
                  color: colors.mediumBrown,
                  textTransform: 'uppercase',
                }}
              >
                Link to Itinerary (Optional)
              </span>
              <motion.div
                animate={{ rotate: showAdvanced ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown
                  style={{
                    width: 16,
                    height: 16,
                    color: colors.mediumBrown,
                  }}
                />
              </motion.div>
            </motion.button>

            {/* Advanced Options */}
            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    background: `${colors.parchment}30`,
                    border: `1px solid ${colors.golden}40`,
                    borderRadius: '8px',
                    padding: '16px',
                    overflow: 'hidden',
                  }}
                >
                  <FormField label="Related Day Number">
                    <input
                      type="number"
                      value={relatedDay}
                      onChange={(e) => setRelatedDay(e.target.value)}
                      placeholder="e.g., 3"
                      min={1}
                      style={inputStyle}
                    />
                  </FormField>

                  <FormField label="Related Activity">
                    <input
                      type="text"
                      value={relatedActivity}
                      onChange={(e) => setRelatedActivity(e.target.value)}
                      placeholder="e.g., Eiffel Tower visit"
                      style={inputStyle}
                    />
                  </FormField>

                  <FormField label="Related Restaurant">
                    <input
                      type="text"
                      value={relatedRestaurant}
                      onChange={(e) => setRelatedRestaurant(e.target.value)}
                      placeholder="e.g., Le Jules Verne"
                      style={{
                        ...inputStyle,
                        marginBottom: 0,
                      }}
                    />
                  </FormField>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '20px 24px',
              background: `linear-gradient(180deg, ${colors.parchment}30 0%, ${colors.parchment}60 100%)`,
              borderTop: `1px solid ${colors.golden}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
            }}
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              style={{
                padding: '12px 24px',
                background: 'transparent',
                border: `1px solid ${colors.golden}`,
                borderRadius: '8px',
                fontFamily: '"Courier New", monospace',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '1px',
                color: colors.mediumBrown,
                cursor: 'pointer',
              }}
            >
              CANCEL
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={loading}
              style={{
                padding: '12px 28px',
                background: loading
                  ? colors.lightBrown
                  : `linear-gradient(135deg, ${colors.terracotta} 0%, ${colors.terracottaLight} 100%)`,
                border: 'none',
                borderRadius: '8px',
                fontFamily: '"Courier New", monospace',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '1px',
                color: colors.cream,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : `0 4px 12px ${colors.terracotta}40`,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {loading ? (
                <>
                  <Loader2
                    style={{
                      width: 16,
                      height: 16,
                      animation: 'spin 1s linear infinite',
                    }}
                  />
                  CREATING...
                </>
              ) : (
                <>CREATE ASSIGNMENT</>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

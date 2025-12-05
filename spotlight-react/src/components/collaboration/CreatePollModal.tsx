/**
 * Create Poll Modal - "The Traveler's Ballot Box"
 *
 * A vintage ballot box / voting form aesthetic for creating group decisions.
 * Features wax seal decorations, ballot paper styling, and typewriter text.
 *
 * Design: Wanderlust Editorial with vintage polling aesthetics
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, AlertCircle, Loader2, ChevronDown } from 'lucide-react';
import type { PollOption } from '../../types';

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
  waxRed: '#A52A2A',
  inkBlue: '#1C3A5F',
};

interface CreatePollModalProps {
  routeId: string;
  dayNumber?: number;
  targetType?: string;
  targetId?: string;
  onClose: () => void;
  onPollCreated?: (poll: any) => void;
}

const POLL_TYPES = [
  { value: 'general', label: 'General Decision', icon: '📋' },
  { value: 'activity', label: 'Activity Selection', icon: '🎯' },
  { value: 'restaurant', label: 'Restaurant Choice', icon: '🍽️' },
  { value: 'accommodation', label: 'Accommodation', icon: '🏨' },
  { value: 'time', label: 'Time/Schedule', icon: '📅' },
];

// =============================================================================
// DECORATIVE ELEMENTS
// =============================================================================

function BallotHeader() {
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
      {/* Wax seal decoration */}
      <div
        style={{
          position: 'absolute',
          top: '-8px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: `radial-gradient(circle at 30% 30%, ${colors.waxRed} 0%, #8B2323 100%)`,
          boxShadow: `0 2px 8px ${colors.waxRed}60`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ fontSize: '18px' }}>📋</span>
      </div>

      <div style={{ marginTop: '32px' }}>
        <p
          style={{
            fontFamily: '"Courier New", monospace',
            fontSize: '10px',
            letterSpacing: '3px',
            color: colors.lightBrown,
            marginBottom: '4px',
          }}
        >
          OFFICIAL BALLOT
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
          Create New Poll
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
          GROUP DECISION FORM
        </p>
      </div>
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
        {required && <span style={{ color: colors.stampRed, marginLeft: '4px' }}>*</span>}
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

export function CreatePollModal({
  routeId,
  dayNumber,
  targetType,
  targetId,
  onClose,
  onPollCreated,
}: CreatePollModalProps) {
  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [pollType, setPollType] = useState<'general' | 'activity' | 'restaurant' | 'accommodation' | 'time'>('general');
  const [multipleChoice, setMultipleChoice] = useState(false);
  const [maxChoices, setMaxChoices] = useState(1);
  const [options, setOptions] = useState<PollOption[]>([
    { id: '1', label: '' },
    { id: '2', label: '' },
  ]);
  const [deadline, setDeadline] = useState('');
  const [autoExecute, setAutoExecute] = useState(false);
  const [consensusThreshold, setConsensusThreshold] = useState(50);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddOption = () => {
    const newId = (Math.max(...options.map((o) => parseInt(o.id)), 0) + 1).toString();
    setOptions([...options, { id: newId, label: '' }]);
  };

  const handleRemoveOption = (id: string) => {
    if (options.length <= 2) {
      setError('Poll must have at least 2 options');
      return;
    }
    setOptions(options.filter((o) => o.id !== id));
  };

  const handleOptionChange = (id: string, label: string) => {
    setOptions(options.map((o) => (o.id === id ? { ...o, label } : o)));
  };

  const validateForm = (): boolean => {
    setError('');

    if (!question.trim()) {
      setError('Question is required');
      return false;
    }

    const filledOptions = options.filter((o) => o.label.trim());
    if (filledOptions.length < 2) {
      setError('At least 2 options are required');
      return false;
    }

    if (multipleChoice && maxChoices > filledOptions.length) {
      setError('Max choices cannot exceed number of options');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const filledOptions = options.filter((o) => o.label.trim());

      const response = await fetch(`/api/routes/${routeId}/polls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          question: question.trim(),
          description: description.trim() || undefined,
          pollType,
          targetType,
          targetId,
          dayNumber,
          options: filledOptions,
          multipleChoice,
          maxChoices: multipleChoice ? maxChoices : 1,
          deadline: deadline || undefined,
          autoExecute,
          consensusThreshold,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create poll');
      }

      const data = await response.json();

      if (onPollCreated) {
        onPollCreated(data.poll);
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
            <BallotHeader />
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

            {/* Question */}
            <FormField label="Poll Question" required hint={`${question.length}/200 characters`}>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g., Which restaurant should we visit for dinner?"
                style={inputStyle}
                maxLength={200}
              />
            </FormField>

            {/* Description */}
            <FormField label="Additional Context">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add context to help voters decide..."
                style={{
                  ...inputStyle,
                  resize: 'none',
                  minHeight: '70px',
                }}
                maxLength={500}
              />
            </FormField>

            {/* Poll Type */}
            <FormField label="Category">
              <select
                value={pollType}
                onChange={(e) => setPollType(e.target.value as any)}
                style={selectStyle}
              >
                {POLL_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </FormField>

            {/* Options */}
            <FormField label="Ballot Options" required hint="Minimum 2 options required">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {options.map((option, index) => (
                  <motion.div
                    key={option.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    {/* Option number badge */}
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${colors.golden} 0%, ${colors.goldenDark} 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: '"Courier New", monospace',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: colors.cream,
                        flexShrink: 0,
                      }}
                    >
                      {index + 1}
                    </div>
                    <input
                      type="text"
                      value={option.label}
                      onChange={(e) => handleOptionChange(option.id, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      style={{
                        ...inputStyle,
                        flex: 1,
                      }}
                    />
                    {options.length > 2 && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleRemoveOption(option.id)}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          background: `${colors.stampRed}15`,
                          border: `1px solid ${colors.stampRed}40`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: colors.stampRed,
                        }}
                      >
                        <Trash2 style={{ width: 14, height: 14 }} />
                      </motion.button>
                    )}
                  </motion.div>
                ))}
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddOption}
                style={{
                  marginTop: '12px',
                  padding: '10px 16px',
                  background: `${colors.sage}15`,
                  border: `1px dashed ${colors.sage}`,
                  borderRadius: '6px',
                  fontFamily: '"Courier New", monospace',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  color: colors.sage,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Plus style={{ width: 14, height: 14 }} />
                ADD OPTION
              </motion.button>
            </FormField>

            {/* Multiple Choice Toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '14px',
                background: `${colors.parchment}40`,
                borderRadius: '8px',
                border: `1px solid ${colors.golden}40`,
                marginBottom: '20px',
              }}
            >
              <input
                type="checkbox"
                id="multipleChoice"
                checked={multipleChoice}
                onChange={(e) => setMultipleChoice(e.target.checked)}
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: colors.terracotta,
                  cursor: 'pointer',
                }}
              />
              <div style={{ flex: 1 }}>
                <label
                  htmlFor="multipleChoice"
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: colors.espresso,
                    cursor: 'pointer',
                    display: 'block',
                  }}
                >
                  Allow multiple selections
                </label>
                <p
                  style={{
                    fontFamily: '"Courier New", monospace',
                    fontSize: '11px',
                    color: colors.lightBrown,
                    marginTop: '4px',
                  }}
                >
                  Voters can choose more than one option
                </p>
                {multipleChoice && (
                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        fontFamily: '"Courier New", monospace',
                        fontSize: '11px',
                        color: colors.mediumBrown,
                      }}
                    >
                      MAX CHOICES:
                    </span>
                    <input
                      type="number"
                      value={maxChoices}
                      onChange={(e) => setMaxChoices(parseInt(e.target.value) || 1)}
                      min={1}
                      max={options.length}
                      style={{
                        ...inputStyle,
                        width: '70px',
                        padding: '6px 10px',
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Deadline */}
            <FormField label="Voting Deadline (Optional)">
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                style={inputStyle}
              />
            </FormField>

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
                Advanced Settings
              </span>
              <motion.div animate={{ rotate: showAdvanced ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown style={{ width: 16, height: 16, color: colors.mediumBrown }} />
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
                  {/* Auto Execute */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      marginBottom: '16px',
                    }}
                  >
                    <input
                      type="checkbox"
                      id="autoExecute"
                      checked={autoExecute}
                      onChange={(e) => setAutoExecute(e.target.checked)}
                      style={{
                        width: '18px',
                        height: '18px',
                        accentColor: colors.terracotta,
                        cursor: 'pointer',
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <label
                        htmlFor="autoExecute"
                        style={{
                          fontFamily: 'Georgia, serif',
                          fontSize: '14px',
                          fontWeight: 600,
                          color: colors.espresso,
                          cursor: 'pointer',
                          display: 'block',
                        }}
                      >
                        Auto-execute winning option
                      </label>
                      <p
                        style={{
                          fontFamily: '"Courier New", monospace',
                          fontSize: '11px',
                          color: colors.lightBrown,
                          marginTop: '4px',
                        }}
                      >
                        Automatically apply when consensus is reached
                      </p>
                    </div>
                  </div>

                  {/* Consensus Threshold */}
                  {autoExecute && (
                    <div>
                      <label
                        style={{
                          fontFamily: '"Courier New", monospace',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: colors.mediumBrown,
                          display: 'block',
                          marginBottom: '8px',
                        }}
                      >
                        CONSENSUS THRESHOLD: {consensusThreshold}%
                      </label>
                      <input
                        type="range"
                        value={consensusThreshold}
                        onChange={(e) => setConsensusThreshold(parseInt(e.target.value))}
                        min={50}
                        max={100}
                        step={5}
                        style={{
                          width: '100%',
                          accentColor: colors.terracotta,
                        }}
                      />
                    </div>
                  )}
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
                  : `linear-gradient(135deg, ${colors.sage} 0%, ${colors.sageLight} 100%)`,
                border: 'none',
                borderRadius: '8px',
                fontFamily: '"Courier New", monospace',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '1px',
                color: colors.cream,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : `0 4px 12px ${colors.sage}40`,
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
                <>CREATE BALLOT</>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

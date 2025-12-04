/**
 * Invite Collaborator Modal - "The Invitation Telegram"
 *
 * A vintage telegram / invitation card aesthetic for inviting travel companions.
 * Features telegram header styling, wax seal decorations, and typewriter text.
 *
 * Design: Wanderlust Editorial with vintage telegram aesthetics
 */

import { useState } from 'react';
import { X, Mail, UserPlus, Loader2, CheckCircle, AlertCircle, Edit3, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

interface InviteCollaboratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  routeId: string;
  onSuccess: () => void;
}

type RoleType = 'editor' | 'viewer';

// =============================================================================
// DECORATIVE ELEMENTS
// =============================================================================

function TelegramHeader() {
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
      {/* Decorative telegram lines */}
      <div
        style={{
          position: 'absolute',
          top: '8px',
          left: 0,
          right: 0,
          height: '3px',
          background: `repeating-linear-gradient(90deg, ${colors.golden} 0px, ${colors.golden} 8px, transparent 8px, transparent 12px)`,
        }}
      />

      <div style={{ marginTop: '20px' }}>
        <p
          style={{
            fontFamily: '"Courier New", monospace',
            fontSize: '10px',
            letterSpacing: '4px',
            color: colors.lightBrown,
            marginBottom: '4px',
          }}
        >
          CORRESPONDENCE BUREAU
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
          Invitation Telegram
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
          ADD A FELLOW TRAVELER
        </p>
      </div>
    </div>
  );
}

export function InviteCollaboratorModal({
  isOpen,
  onClose,
  routeId,
  onSuccess,
}: InviteCollaboratorModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<RoleType>('editor');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Email address is required');
      return;
    }

    if (!isValidEmail(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/routes/${routeId}/collaborators`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: email.trim(),
          role,
          message: message.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 1500);
      } else {
        setError(data.error || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Error inviting collaborator:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClose() {
    setEmail('');
    setRole('editor');
    setMessage('');
    setError(null);
    setSuccess(false);
    onClose();
  }

  if (!isOpen) return null;

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

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          background: 'rgba(44, 24, 16, 0.6)',
          backdropFilter: 'blur(4px)',
        }}
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          style={{
            width: '100%',
            maxWidth: '480px',
            background: `linear-gradient(180deg, ${colors.cream} 0%, ${colors.warmWhite} 100%)`,
            borderRadius: '16px',
            border: `2px solid ${colors.golden}`,
            boxShadow: `0 25px 50px -12px rgba(44, 24, 16, 0.4), inset 0 1px 0 ${colors.parchment}`,
            overflow: 'hidden',
          }}
          onClick={(e) => e.stopPropagation()}
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
                onClick={handleClose}
                disabled={isSubmitting}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: `${colors.terracotta}15`,
                  border: `1px solid ${colors.terracotta}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  color: colors.terracotta,
                  opacity: isSubmitting ? 0.5 : 1,
                }}
              >
                <X style={{ width: 16, height: 16 }} />
              </motion.button>
            </div>
            <TelegramHeader />
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} style={{ padding: '20px 24px 24px' }}>
            {/* Success message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px',
                  background: `${colors.sage}15`,
                  border: `1px solid ${colors.sage}`,
                  borderRadius: '8px',
                  marginBottom: '20px',
                }}
              >
                <CheckCircle style={{ width: 20, height: 20, color: colors.sage, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontFamily: 'Georgia, serif',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: colors.sage,
                      margin: 0,
                    }}
                  >
                    Telegram dispatched!
                  </p>
                  <p
                    style={{
                      fontFamily: '"Courier New", monospace',
                      fontSize: '11px',
                      color: colors.sageLight,
                      marginTop: '2px',
                    }}
                  >
                    They will receive an invitation to collaborate.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px',
                  background: `${colors.stampRed}10`,
                  border: `1px solid ${colors.stampRed}`,
                  borderRadius: '8px',
                  marginBottom: '20px',
                }}
              >
                <AlertCircle style={{ width: 20, height: 20, color: colors.stampRed, flexShrink: 0 }} />
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

            {/* Email input */}
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
                RECIPIENT ADDRESS <span style={{ color: colors.stampRed }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
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
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder="fellow.traveler@example.com"
                  disabled={isSubmitting || success}
                  style={{
                    ...inputStyle,
                    paddingLeft: '40px',
                    opacity: isSubmitting || success ? 0.6 : 1,
                  }}
                  required
                />
              </div>
              <p
                style={{
                  fontFamily: '"Courier New", monospace',
                  fontSize: '10px',
                  color: colors.lightBrown,
                  marginTop: '4px',
                  fontStyle: 'italic',
                }}
              >
                An account is required to accept the invitation
              </p>
            </div>

            {/* Role selector */}
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
                TRAVEL ROLE <span style={{ color: colors.stampRed }}>*</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {/* Editor */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setRole('editor')}
                  disabled={isSubmitting || success}
                  style={{
                    padding: '14px',
                    borderRadius: '10px',
                    border: `2px solid ${role === 'editor' ? colors.terracotta : colors.golden}`,
                    background: role === 'editor' ? `${colors.terracotta}10` : colors.warmWhite,
                    cursor: isSubmitting || success ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting || success ? 0.6 : 1,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        background: role === 'editor' ? `${colors.terracotta}20` : `${colors.golden}20`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Edit3
                        style={{
                          width: 20,
                          height: 20,
                          color: role === 'editor' ? colors.terracotta : colors.mediumBrown,
                        }}
                      />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p
                        style={{
                          fontFamily: 'Georgia, serif',
                          fontSize: '14px',
                          fontWeight: 600,
                          color: role === 'editor' ? colors.terracotta : colors.espresso,
                          margin: 0,
                        }}
                      >
                        Editor
                      </p>
                      <p
                        style={{
                          fontFamily: '"Courier New", monospace',
                          fontSize: '10px',
                          color: colors.lightBrown,
                          marginTop: '2px',
                        }}
                      >
                        Can make changes
                      </p>
                    </div>
                  </div>
                </motion.button>

                {/* Viewer */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setRole('viewer')}
                  disabled={isSubmitting || success}
                  style={{
                    padding: '14px',
                    borderRadius: '10px',
                    border: `2px solid ${role === 'viewer' ? colors.sage : colors.golden}`,
                    background: role === 'viewer' ? `${colors.sage}10` : colors.warmWhite,
                    cursor: isSubmitting || success ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting || success ? 0.6 : 1,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        background: role === 'viewer' ? `${colors.sage}20` : `${colors.golden}20`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Eye
                        style={{
                          width: 20,
                          height: 20,
                          color: role === 'viewer' ? colors.sage : colors.mediumBrown,
                        }}
                      />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p
                        style={{
                          fontFamily: 'Georgia, serif',
                          fontSize: '14px',
                          fontWeight: 600,
                          color: role === 'viewer' ? colors.sage : colors.espresso,
                          margin: 0,
                        }}
                      >
                        Viewer
                      </p>
                      <p
                        style={{
                          fontFamily: '"Courier New", monospace',
                          fontSize: '10px',
                          color: colors.lightBrown,
                          marginTop: '2px',
                        }}
                      >
                        View only access
                      </p>
                    </div>
                  </div>
                </motion.button>
              </div>
            </div>

            {/* Optional message */}
            <div style={{ marginBottom: '24px' }}>
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
                PERSONAL MESSAGE{' '}
                <span style={{ color: colors.lightBrown, fontWeight: 400, fontStyle: 'italic' }}>(Optional)</span>
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Greetings! Care to join me on this adventure?"
                disabled={isSubmitting || success}
                rows={3}
                style={{
                  ...inputStyle,
                  resize: 'none',
                  opacity: isSubmitting || success ? 0.6 : 1,
                }}
                maxLength={500}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '4px',
                }}
              >
                <p
                  style={{
                    fontFamily: '"Courier New", monospace',
                    fontSize: '10px',
                    color: colors.lightBrown,
                    fontStyle: 'italic',
                  }}
                >
                  Add a personal note to the invitation
                </p>
                <p
                  style={{
                    fontFamily: '"Courier New", monospace',
                    fontSize: '10px',
                    color: colors.lightBrown,
                  }}
                >
                  {message.length}/500
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleClose}
                disabled={isSubmitting}
                style={{
                  flex: 1,
                  padding: '14px 20px',
                  background: 'transparent',
                  border: `1px solid ${colors.golden}`,
                  borderRadius: '8px',
                  fontFamily: '"Courier New", monospace',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '1px',
                  color: colors.mediumBrown,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.5 : 1,
                }}
              >
                CANCEL
              </motion.button>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isSubmitting || success || !email.trim()}
                style={{
                  flex: 1,
                  padding: '14px 20px',
                  background:
                    isSubmitting || success || !email.trim()
                      ? colors.lightBrown
                      : `linear-gradient(135deg, ${colors.terracotta} 0%, ${colors.terracottaLight} 100%)`,
                  border: 'none',
                  borderRadius: '8px',
                  fontFamily: '"Courier New", monospace',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '1px',
                  color: colors.cream,
                  cursor: isSubmitting || success || !email.trim() ? 'not-allowed' : 'pointer',
                  boxShadow:
                    isSubmitting || success || !email.trim() ? 'none' : `0 4px 12px ${colors.terracotta}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
                    DISPATCHING...
                  </>
                ) : success ? (
                  <>
                    <CheckCircle style={{ width: 16, height: 16 }} />
                    SENT!
                  </>
                ) : (
                  <>
                    <UserPlus style={{ width: 16, height: 16 }} />
                    DISPATCH TELEGRAM
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

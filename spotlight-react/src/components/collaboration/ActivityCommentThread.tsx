/**
 * Activity Comment Thread - "The Postcard Thread"
 *
 * A vintage postcard-style comment thread for discussing activities.
 * Features postcard borders, wax seal resolved markers, and typewriter text.
 *
 * Design: Wanderlust Editorial with vintage correspondence aesthetics
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, Reply, Check, X, Trash2, Loader2 } from 'lucide-react';
import type { ActivityComment } from '../../types';

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
};

interface ActivityCommentThreadProps {
  routeId: string;
  targetType: 'activity' | 'day' | 'restaurant' | 'route';
  targetId: string;
  dayNumber?: number;
  currentUserId: string;
  userRole?: 'owner' | 'editor' | 'viewer';
  onClose: () => void;
}

// =============================================================================
// PASSPORT AVATAR
// =============================================================================

function PassportAvatar({ name, isCurrentUser }: { name: string; isCurrentUser: boolean }) {
  return (
    <div
      style={{
        width: '32px',
        height: '32px',
        borderRadius: '4px',
        background: isCurrentUser
          ? `linear-gradient(135deg, ${colors.terracotta} 0%, ${colors.terracottaLight} 100%)`
          : `linear-gradient(135deg, ${colors.golden} 0%, ${colors.goldenDark} 100%)`,
        border: `2px solid ${isCurrentUser ? colors.terracotta : colors.golden}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"Courier New", monospace',
        fontSize: '13px',
        fontWeight: 700,
        color: colors.cream,
        flexShrink: 0,
      }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export function ActivityCommentThread({
  routeId,
  targetType,
  targetId,
  dayNumber,
  currentUserId,
  userRole = 'viewer',
  onClose,
}: ActivityCommentThreadProps) {
  const [comments, setComments] = useState<ActivityComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [routeId, targetType, targetId]);

  async function fetchComments() {
    try {
      const params = new URLSearchParams({
        targetType,
        targetId,
        ...(dayNumber && { dayNumber: dayNumber.toString() }),
      });

      const token = localStorage.getItem('rdtrip_auth_token');
      const response = await fetch(`/api/routes/${routeId}/comments?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit() {
    if (!newComment.trim() || isSending) return;

    setIsSending(true);
    try {
      const token = localStorage.getItem('rdtrip_auth_token');
      const response = await fetch(`/api/routes/${routeId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetType,
          targetId,
          dayNumber,
          comment: newComment.trim(),
          parentCommentId: replyTo,
        }),
      });

      if (response.ok) {
        setNewComment('');
        setReplyTo(null);
        fetchComments();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSending(false);
    }
  }

  async function handleResolve(commentId: string, resolved: boolean) {
    try {
      const token = localStorage.getItem('rdtrip_auth_token');
      const response = await fetch(`/api/routes/${routeId}/comments/${commentId}/resolve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ resolved }),
      });

      if (response.ok) {
        fetchComments();
      }
    } catch (error) {
      console.error('Error resolving comment:', error);
    }
  }

  async function handleDelete(commentId: string) {
    if (!confirm('Delete this correspondence?')) return;

    try {
      const token = localStorage.getItem('rdtrip_auth_token');
      const response = await fetch(`/api/routes/${routeId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchComments();
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  }

  function renderComment(comment: ActivityComment, isReply = false) {
    const canResolve = userRole === 'owner' || userRole === 'editor';
    const canDelete = comment.userId === currentUserId || userRole === 'owner' || userRole === 'editor';
    const isCurrentUser = comment.userId === currentUserId;

    return (
      <motion.div
        key={comment.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginLeft: isReply ? '40px' : 0, marginTop: isReply ? '10px' : '14px' }}
      >
        <div
          style={{
            padding: '14px',
            borderRadius: '10px',
            background: comment.resolved ? `${colors.sage}10` : colors.warmWhite,
            border: `1px solid ${comment.resolved ? colors.sage : colors.golden}`,
            position: 'relative',
          }}
        >
          {/* Resolved wax seal */}
          {comment.resolved && (
            <div
              style={{
                position: 'absolute',
                top: '-8px',
                right: '12px',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: `radial-gradient(circle at 30% 30%, ${colors.sage} 0%, #4A6B5A 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 2px 4px ${colors.sage}40`,
              }}
            >
              <Check style={{ width: 12, height: 12, color: colors.cream }} />
            </div>
          )}

          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '10px',
            }}
          >
            <PassportAvatar name={comment.userName} isCurrentUser={isCurrentUser} />
            <div style={{ flex: 1 }}>
              <p
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: colors.espresso,
                  margin: 0,
                }}
              >
                {isCurrentUser ? 'You' : comment.userName}
              </p>
              <p
                style={{
                  fontFamily: '"Courier New", monospace',
                  fontSize: '10px',
                  color: colors.lightBrown,
                  margin: 0,
                }}
              >
                {new Date(comment.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Comment text */}
          <p
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: '13px',
              color: colors.darkBrown,
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {comment.comment}
          </p>

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginTop: '12px',
              paddingTop: '10px',
              borderTop: `1px dashed ${colors.golden}40`,
            }}
          >
            {!isReply && (
              <button
                onClick={() => setReplyTo(comment.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontFamily: '"Courier New", monospace',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: colors.mediumBrown,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <Reply style={{ width: 12, height: 12 }} />
                REPLY
              </button>
            )}

            {canResolve && !isReply && (
              <button
                onClick={() => handleResolve(comment.id, !comment.resolved)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontFamily: '"Courier New", monospace',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: comment.resolved ? colors.lightBrown : colors.sage,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                {comment.resolved ? <X style={{ width: 12, height: 12 }} /> : <Check style={{ width: 12, height: 12 }} />}
                {comment.resolved ? 'UNRESOLVE' : 'RESOLVE'}
              </button>
            )}

            {canDelete && (
              <button
                onClick={() => handleDelete(comment.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontFamily: '"Courier New", monospace',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: colors.stampRed,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <Trash2 style={{ width: 12, height: 12 }} />
                DELETE
              </button>
            )}
          </div>
        </div>

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div>{comment.replies.map((reply) => renderComment(reply, true))}</div>
        )}

        {/* Reply input */}
        {replyTo === comment.id && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            style={{ marginLeft: '40px', marginTop: '10px' }}
          >
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubmit();
                  if (e.key === 'Escape') setReplyTo(null);
                }}
                placeholder="Write a reply..."
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  fontFamily: 'Georgia, serif',
                  fontSize: '13px',
                  color: colors.espresso,
                  background: colors.warmWhite,
                  border: `1px solid ${colors.golden}`,
                  borderRadius: '6px',
                  outline: 'none',
                }}
                autoFocus
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmit}
                disabled={!newComment.trim() || isSending}
                style={{
                  padding: '10px 14px',
                  background: `linear-gradient(135deg, ${colors.terracotta} 0%, ${colors.terracottaLight} 100%)`,
                  border: 'none',
                  borderRadius: '6px',
                  color: colors.cream,
                  cursor: !newComment.trim() || isSending ? 'not-allowed' : 'pointer',
                  opacity: !newComment.trim() || isSending ? 0.5 : 1,
                }}
              >
                <Send style={{ width: 14, height: 14 }} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setReplyTo(null)}
                style={{
                  padding: '10px 14px',
                  background: colors.parchment,
                  border: `1px solid ${colors.golden}`,
                  borderRadius: '6px',
                  color: colors.mediumBrown,
                  cursor: 'pointer',
                }}
              >
                <X style={{ width: 14, height: 14 }} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
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
      onClick={onClose}
    >
      <div
        style={{
          background: `linear-gradient(180deg, ${colors.cream} 0%, ${colors.warmWhite} 100%)`,
          borderRadius: '16px',
          border: `2px solid ${colors.golden}`,
          boxShadow: `0 25px 50px -12px rgba(44, 24, 16, 0.4)`,
          width: '100%',
          maxWidth: '600px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: `1px solid ${colors.golden}`,
            background: `${colors.parchment}40`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                background: `${colors.terracotta}15`,
                border: `1px solid ${colors.terracotta}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MessageCircle style={{ width: 16, height: 16, color: colors.terracotta }} />
            </div>
            <div>
              <h3
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: '16px',
                  fontWeight: 700,
                  color: colors.espresso,
                  margin: 0,
                }}
              >
                Correspondence Thread
              </h3>
              <p
                style={{
                  fontFamily: '"Courier New", monospace',
                  fontSize: '10px',
                  color: colors.lightBrown,
                  margin: 0,
                }}
              >
                {targetId}
              </p>
            </div>
          </div>
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

        {/* Comments list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
          {isLoading ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px',
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
          ) : comments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <MessageCircle
                style={{
                  width: 48,
                  height: 48,
                  color: colors.parchment,
                  margin: '0 auto 12px',
                }}
              />
              <p
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: '14px',
                  fontStyle: 'italic',
                  color: colors.lightBrown,
                  margin: 0,
                }}
              >
                No correspondence yet
              </p>
              <p
                style={{
                  fontFamily: '"Courier New", monospace',
                  fontSize: '11px',
                  color: colors.lightBrown,
                  marginTop: '4px',
                }}
              >
                Be the first to leave a note!
              </p>
            </div>
          ) : (
            <AnimatePresence>{comments.map((comment) => renderComment(comment))}</AnimatePresence>
          )}
        </div>

        {/* New comment input */}
        {!replyTo && (
          <div
            style={{
              padding: '16px 20px',
              borderTop: `1px solid ${colors.golden}`,
              background: `${colors.parchment}30`,
            }}
          >
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="Add a note..."
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  fontFamily: 'Georgia, serif',
                  fontSize: '14px',
                  color: colors.espresso,
                  background: colors.warmWhite,
                  border: `1px solid ${colors.golden}`,
                  borderRadius: '8px',
                  outline: 'none',
                }}
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={!newComment.trim() || isSending}
                style={{
                  padding: '12px 20px',
                  background:
                    !newComment.trim() || isSending
                      ? colors.lightBrown
                      : `linear-gradient(135deg, ${colors.terracotta} 0%, ${colors.terracottaLight} 100%)`,
                  border: 'none',
                  borderRadius: '8px',
                  fontFamily: '"Courier New", monospace',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  color: colors.cream,
                  cursor: !newComment.trim() || isSending ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {isSending ? (
                  <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                ) : (
                  <>
                    <Send style={{ width: 14, height: 14 }} />
                    SEND
                  </>
                )}
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

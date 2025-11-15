import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, Reply, Check, X, Trash2 } from 'lucide-react';
import type { ActivityComment } from '../../types';

interface ActivityCommentThreadProps {
  routeId: string;
  targetType: 'activity' | 'day' | 'restaurant' | 'route';
  targetId: string;
  dayNumber?: number;
  currentUserId: string;
  userRole?: 'owner' | 'editor' | 'viewer';
  onClose: () => void;
}

export function ActivityCommentThread({
  routeId,
  targetType,
  targetId,
  dayNumber,
  currentUserId,
  userRole = 'viewer',
  onClose
}: ActivityCommentThreadProps) {
  const [comments, setComments] = useState<ActivityComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Fetch comments
  useEffect(() => {
    fetchComments();
  }, [routeId, targetType, targetId]);

  async function fetchComments() {
    try {
      const params = new URLSearchParams({
        targetType,
        targetId,
        ...(dayNumber && { dayNumber: dayNumber.toString() })
      });

      const token = localStorage.getItem('rdtrip_auth_token');
      const response = await fetch(`/api/routes/${routeId}/comments?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
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
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          targetType,
          targetId,
          dayNumber,
          comment: newComment.trim(),
          parentCommentId: replyTo
        })
      });

      if (response.ok) {
        setNewComment('');
        setReplyTo(null);
        fetchComments(); // Refresh comments
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
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ resolved })
      });

      if (response.ok) {
        fetchComments(); // Refresh to show updated status
      }
    } catch (error) {
      console.error('Error resolving comment:', error);
    }
  }

  async function handleDelete(commentId: string) {
    if (!confirm('Delete this comment?')) return;

    try {
      const token = localStorage.getItem('rdtrip_auth_token');
      const response = await fetch(`/api/routes/${routeId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchComments(); // Refresh comments
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
        className={`${isReply ? 'ml-8 mt-2' : 'mt-3'}`}
      >
        <div className={`p-3 rounded-lg ${
          comment.resolved ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
        }`}>
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                {comment.userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {isCurrentUser ? 'You' : comment.userName}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(comment.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {comment.resolved && (
                <span className="flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">
                  <Check className="w-3 h-3" />
                  Resolved
                </span>
              )}
            </div>
          </div>

          {/* Comment text */}
          <p className="text-sm text-gray-700 mb-2">{comment.comment}</p>

          {/* Actions */}
          <div className="flex items-center gap-3 text-xs">
            {!isReply && (
              <button
                onClick={() => setReplyTo(comment.id)}
                className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <Reply className="w-3 h-3" />
                Reply
              </button>
            )}

            {canResolve && !isReply && (
              <button
                onClick={() => handleResolve(comment.id, !comment.resolved)}
                className="flex items-center gap-1 text-gray-600 hover:text-green-600 transition-colors"
              >
                {comment.resolved ? <X className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                {comment.resolved ? 'Unresolve' : 'Resolve'}
              </button>
            )}

            {canDelete && (
              <button
                onClick={() => handleDelete(comment.id)}
                className="flex items-center gap-1 text-gray-600 hover:text-red-600 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            {comment.replies.map(reply => renderComment(reply, true))}
          </div>
        )}

        {/* Reply input */}
        {replyTo === comment.id && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="ml-8 mt-2"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubmit();
                  if (e.key === 'Escape') setReplyTo(null);
                }}
                placeholder="Write a reply..."
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button
                onClick={handleSubmit}
                disabled={!newComment.trim() || isSending}
                className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
              <button
                onClick={() => setReplyTo(null)}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Comments: {targetId}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No comments yet</p>
              <p className="text-xs mt-1">Be the first to comment!</p>
            </div>
          ) : (
            <AnimatePresence>
              {comments.map(comment => renderComment(comment))}
            </AnimatePresence>
          )}
        </div>

        {/* New comment input */}
        {!replyTo && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="Add a comment..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSubmit}
                disabled={!newComment.trim() || isSending}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isSending ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Send</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

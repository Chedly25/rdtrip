/**
 * Collaboration Panel - "The Correspondent's Club"
 *
 * A sophisticated editorial collaboration hub styled as a vintage travel
 * magazine correspondent's room. Features postcard-style messaging,
 * passport stamp avatars, and wax seal accents.
 *
 * Design: Wanderlust Editorial aesthetic with vintage correspondence styling
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Users,
  Send,
  Loader2,
  UserPlus,
  Crown,
  Edit,
  Eye,
  Reply,
  X,
  ListTodo,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useWebSocket } from '../../hooks/useWebSocket';
import type { Collaborator, TripMessage, PresenceStatus } from '../../types';
import { MessageReactionPicker } from './MessageReactionPicker';
import { MentionAutocomplete } from './MentionAutocomplete';
import { ActivityMessageCard } from './ActivityMessageCard';
import { TaskBoard } from './TaskBoard';

// =============================================================================
// WANDERLUST EDITORIAL COLOR PALETTE
// =============================================================================
const colors = {
  // Core editorial
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

  // Correspondence accents
  inkBlue: '#1A365D',
  sepia: '#704214',
  parchment: '#F5E6C8',
  waxRed: '#8B2323',
  stampBlue: '#234E70',
};

interface CollaborationPanelProps {
  routeId: string;
  currentUserId: string;
  onInviteClick: () => void;
  onClose?: () => void;
}

type TabType = 'chat' | 'collaborators' | 'tasks';

// =============================================================================
// POSTCARD TEXTURE BACKGROUND
// =============================================================================
const PostcardTexture: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      background: `
        radial-gradient(ellipse at 20% 0%, rgba(212, 168, 83, 0.08) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 100%, rgba(196, 88, 48, 0.05) 0%, transparent 50%),
        linear-gradient(180deg, ${colors.cream} 0%, ${colors.warmWhite} 100%)
      `,
      pointerEvents: 'none',
    }}
  />
);

// =============================================================================
// WAX SEAL DECORATION
// =============================================================================
const WaxSeal: React.FC<{ size?: number; color?: string }> = ({
  size = 24,
  color = colors.waxRed,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10" fill={color} />
    <circle cx="12" cy="12" r="8" fill={color} style={{ filter: 'brightness(1.1)' }} />
    <circle cx="12" cy="12" r="6" fill={color} style={{ filter: 'brightness(0.9)' }} />
    <text
      x="12"
      y="16"
      textAnchor="middle"
      fontSize="10"
      fontFamily="Georgia, serif"
      fontWeight="bold"
      fill={colors.cream}
    >
      R
    </text>
  </svg>
);

// =============================================================================
// PASSPORT STAMP AVATAR
// =============================================================================
const PassportAvatar: React.FC<{
  name: string;
  size?: 'sm' | 'md' | 'lg';
  status?: string;
  role?: string;
}> = ({ name, size = 'md', status, role }) => {
  const sizes = {
    sm: { container: 32, font: 12, border: 2 },
    md: { container: 40, font: 14, border: 2 },
    lg: { container: 48, font: 16, border: 3 },
  };

  const s = sizes[size];
  const initial = name.charAt(0).toUpperCase();

  const statusColors: Record<string, string> = {
    viewing: colors.sage,
    editing: colors.terracotta,
    idle: colors.golden,
    offline: colors.lightBrown,
  };

  const roleColors: Record<string, string> = {
    owner: colors.golden,
    editor: colors.terracotta,
    viewer: colors.sage,
  };

  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          width: s.container,
          height: s.container,
          borderRadius: '4px',
          background: `linear-gradient(135deg, ${colors.parchment} 0%, ${colors.cream} 100%)`,
          border: `${s.border}px solid ${role ? roleColors[role] || colors.espresso : colors.espresso}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: '"Courier New", monospace',
          fontSize: s.font,
          fontWeight: 700,
          color: colors.espresso,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Stamp texture overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `repeating-linear-gradient(
              0deg,
              transparent 0,
              transparent 2px,
              rgba(44, 24, 16, 0.03) 2px,
              rgba(44, 24, 16, 0.03) 4px
            )`,
          }}
        />
        <span style={{ position: 'relative', zIndex: 1 }}>{initial}</span>
      </div>

      {/* Presence indicator */}
      {status && status !== 'offline' && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: statusColors[status] || colors.lightBrown,
            border: `2px solid ${colors.cream}`,
          }}
        />
      )}
    </div>
  );
};

// =============================================================================
// TAB BUTTON
// =============================================================================
const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
}> = ({ active, onClick, icon, label, count }) => (
  <motion.button
    whileHover={{ y: -1 }}
    whileTap={{ y: 0 }}
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 16px',
      background: active
        ? `linear-gradient(135deg, ${colors.espresso} 0%, ${colors.darkBrown} 100%)`
        : 'transparent',
      border: active ? 'none' : `1px solid ${colors.golden}`,
      borderRadius: '8px',
      fontFamily: 'Georgia, serif',
      fontSize: '13px',
      fontWeight: active ? 600 : 400,
      color: active ? colors.cream : colors.espresso,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    }}
  >
    {icon}
    <span className="hidden sm:inline">{label}</span>
    {count !== undefined && count > 0 && (
      <span
        style={{
          marginLeft: '4px',
          padding: '2px 6px',
          background: active ? 'rgba(255,255,255,0.2)' : colors.golden,
          borderRadius: '10px',
          fontSize: '11px',
          fontFamily: '"Courier New", monospace',
          color: active ? colors.cream : colors.espresso,
        }}
      >
        {count}
      </span>
    )}
  </motion.button>
);

// =============================================================================
// MESSAGE BUBBLE (POSTCARD STYLE)
// =============================================================================
const MessageBubble: React.FC<{
  message: TripMessage;
  isCurrentUser: boolean;
  onReply: () => void;
  onReactionAdd: (messageId: string, emoji: string) => void;
  currentUserId: string;
  routeId: string;
  allMessages: TripMessage[];
}> = ({ message, isCurrentUser, onReply, onReactionAdd, currentUserId, routeId, allMessages }) => {
  const parentMsg = message.parentMessageId
    ? allMessages.find((m) => m.id === message.parentMessageId)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      style={{
        display: 'flex',
        gap: '12px',
        flexDirection: isCurrentUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
      }}
    >
      <PassportAvatar name={message.userName} size="sm" />

      <div
        style={{
          maxWidth: '70%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: isCurrentUser ? 'flex-end' : 'flex-start',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '4px',
          }}
        >
          <span
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: '12px',
              fontWeight: 600,
              color: colors.espresso,
            }}
          >
            {isCurrentUser ? 'You' : message.userName}
          </span>
          <span
            style={{
              fontFamily: '"Courier New", monospace',
              fontSize: '10px',
              color: colors.lightBrown,
            }}
          >
            {formatTime(message.createdAt)}
          </span>
        </div>

        {/* Message Card */}
        <div
          style={{
            position: 'relative',
            background: isCurrentUser
              ? `linear-gradient(135deg, ${colors.espresso} 0%, ${colors.darkBrown} 100%)`
              : `linear-gradient(135deg, ${colors.parchment} 0%, ${colors.cream} 100%)`,
            padding: '12px 16px',
            borderRadius: '12px',
            borderTopLeftRadius: isCurrentUser ? '12px' : '4px',
            borderTopRightRadius: isCurrentUser ? '4px' : '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: isCurrentUser ? 'none' : `1px solid ${colors.golden}`,
          }}
        >
          {/* Decorative stamp corner for others' messages */}
          {!isCurrentUser && (
            <div
              style={{
                position: 'absolute',
                top: '-4px',
                right: '8px',
                transform: 'rotate(12deg)',
              }}
            >
              <WaxSeal size={16} color={colors.terracotta} />
            </div>
          )}

          {/* Reply indicator */}
          {parentMsg && (
            <div
              style={{
                marginBottom: '8px',
                paddingBottom: '8px',
                borderLeft: `2px solid ${isCurrentUser ? 'rgba(255,255,255,0.3)' : colors.golden}`,
                paddingLeft: '8px',
                fontSize: '11px',
                color: isCurrentUser ? 'rgba(255,255,255,0.7)' : colors.lightBrown,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                <Reply style={{ width: 10, height: 10 }} />
                <span style={{ fontWeight: 600 }}>
                  {parentMsg.userId === currentUserId ? 'You' : parentMsg.userName}
                </span>
              </div>
              <p style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {parentMsg.message}
              </p>
            </div>
          )}

          {/* Activity card if present */}
          {message.messageType === 'activity' && message.messageMetadata?.activity && (
            <div style={{ marginBottom: '8px' }}>
              <ActivityMessageCard
                activity={message.messageMetadata.activity}
                isCurrentUser={isCurrentUser}
              />
            </div>
          )}

          {/* Message text */}
          {message.message && (
            <p
              style={{
                margin: 0,
                fontFamily: 'Georgia, serif',
                fontSize: '14px',
                lineHeight: 1.5,
                color: isCurrentUser ? colors.cream : colors.espresso,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {message.message}
            </p>
          )}
        </div>

        {/* Actions */}
        <div
          style={{
            marginTop: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <MessageReactionPicker
            messageId={message.id}
            routeId={routeId}
            onReactionAdd={onReactionAdd}
            existingReactions={message.reactions || []}
            currentUserId={currentUserId}
          />
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onReply}
            style={{
              padding: '4px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: colors.lightBrown,
              borderRadius: '4px',
            }}
            title="Reply"
          >
            <Reply style={{ width: 14, height: 14 }} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

// =============================================================================
// COLLABORATOR ROW
// =============================================================================
const CollaboratorRow: React.FC<{
  collaborator: Collaborator;
  isCurrentUser: boolean;
}> = ({ collaborator, isCurrentUser }) => {
  const roleConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    owner: { label: 'Owner', icon: <Crown style={{ width: 12, height: 12 }} />, color: colors.golden },
    editor: { label: 'Editor', icon: <Edit style={{ width: 12, height: 12 }} />, color: colors.terracotta },
    viewer: { label: 'Viewer', icon: <Eye style={{ width: 12, height: 12 }} />, color: colors.sage },
  };

  const role = roleConfig[collaborator.role];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 4 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: colors.cream,
        borderRadius: '8px',
        border: `1px solid ${colors.golden}`,
        marginBottom: '8px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
        <PassportAvatar
          name={collaborator.name}
          size="md"
          status={collaborator.presence?.status}
          role={collaborator.role}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <p
              style={{
                margin: 0,
                fontFamily: 'Georgia, serif',
                fontSize: '14px',
                fontWeight: 600,
                color: colors.espresso,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {collaborator.name}
              {isCurrentUser && (
                <span style={{ marginLeft: '4px', color: colors.lightBrown, fontWeight: 400 }}>
                  (You)
                </span>
              )}
            </p>
          </div>
          <p
            style={{
              margin: 0,
              fontFamily: '"Courier New", monospace',
              fontSize: '11px',
              color: colors.lightBrown,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {collaborator.email}
          </p>
          {collaborator.presence?.status && collaborator.presence.status !== 'offline' && (
            <p
              style={{
                margin: '4px 0 0 0',
                fontFamily: 'Georgia, serif',
                fontSize: '11px',
                color: colors.sage,
                fontStyle: 'italic',
              }}
            >
              {collaborator.presence.currentSection || collaborator.presence.status}
            </p>
          )}
        </div>
      </div>

      {/* Role badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 10px',
          background: `${role.color}20`,
          border: `1px solid ${role.color}`,
          borderRadius: '12px',
          color: role.color,
        }}
      >
        {role.icon}
        <span
          style={{
            fontFamily: '"Courier New", monospace',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.5px',
          }}
        >
          {role.label.toUpperCase()}
        </span>
      </div>
    </motion.div>
  );
};

// =============================================================================
// TYPING INDICATOR
// =============================================================================
const TypingIndicator: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      background: colors.parchment,
      borderRadius: '12px',
      width: 'fit-content',
    }}
  >
    <div style={{ display: 'flex', gap: '4px' }}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: colors.golden,
          }}
        />
      ))}
    </div>
    <span
      style={{
        fontFamily: 'Georgia, serif',
        fontSize: '12px',
        color: colors.lightBrown,
        fontStyle: 'italic',
      }}
    >
      Someone is writing...
    </span>
  </motion.div>
);

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================
function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export function CollaborationPanel({
  routeId,
  currentUserId,
  onInviteClick,
  onClose,
}: CollaborationPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [messages, setMessages] = useState<TripMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState<Set<string>>(new Set());
  const [isLoadingCollaborators, setIsLoadingCollaborators] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [taskWsMessage, setTaskWsMessage] = useState<any>(null);

  // Mention autocomplete state
  const [mentionTrigger, setMentionTrigger] = useState('');
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionStartPos, setMentionStartPos] = useState(0);

  // Thread/reply state
  const [replyingTo, setReplyingTo] = useState<TripMessage | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  // WebSocket connection
  const { send, isOpen } = useWebSocket('/ws/collab', {
    onOpen: () => {
      send({ type: 'join_route', routeId });
    },
    onMessage: handleWebSocketMessage,
  });

  useEffect(() => {
    fetchCollaborators();
    fetchMessages();
  }, [routeId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleWebSocketMessage(message: any) {
    switch (message.type) {
      case 'chat_message':
        setMessages((prev) => [...prev, message.data]);
        break;
      case 'message_reaction_added':
      case 'message_reaction_removed':
        setMessages((prev) =>
          prev.map((msg) => (msg.id === message.data.messageId ? message.data.message : msg))
        );
        break;
      case 'user_joined':
        fetchCollaborators();
        break;
      case 'user_left':
        setCollaborators((prev) =>
          prev.map((c) =>
            c.userId === message.userId ? { ...c, presence: { ...c.presence!, status: 'offline' } } : c
          )
        );
        break;
      case 'presence_update':
        updatePresence(message.userId, message.data);
        break;
      case 'typing_indicator':
        handleTypingIndicator(message.userId, message.isTyping);
        break;
      case 'collaborator_added':
        fetchCollaborators();
        break;
      case 'collaborator_removed':
        setCollaborators((prev) => prev.filter((c) => c.userId !== message.userId));
        break;
      case 'task_created':
      case 'task_updated':
      case 'task_deleted':
        setTaskWsMessage(message);
        break;
    }
  }

  async function fetchCollaborators() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/routes/${routeId}/collaborators`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setCollaborators(data.collaborators || []);
      }
    } catch (error) {
      console.error('Failed to fetch collaborators:', error);
    } finally {
      setIsLoadingCollaborators(false);
    }
  }

  async function fetchMessages() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/routes/${routeId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  }

  async function sendMessage() {
    if (!messageInput.trim() || isSending) return;

    setIsSending(true);
    try {
      const mentionedUserIds: string[] = [];
      const mentionPattern = /@(\w+)/g;
      let match;

      while ((match = mentionPattern.exec(messageInput)) !== null) {
        const mentionedUsername = match[1];
        const user = collaborators.find(
          (c) => c.name.replace(/\s+/g, '').toLowerCase() === mentionedUsername.toLowerCase()
        );
        if (user && !mentionedUserIds.includes(user.userId)) {
          mentionedUserIds.push(user.userId);
        }
      }

      const token = localStorage.getItem('rdtrip_auth_token');
      const response = await fetch(`/api/routes/${routeId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: messageInput.trim(),
          mentionedUsers: mentionedUserIds.length > 0 ? mentionedUserIds : undefined,
          parentMessageId: replyingTo?.id || undefined,
        }),
      });

      if (response.ok) {
        setMessageInput('');
        setShowMentionDropdown(false);
        setReplyingTo(null);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  }

  async function handleReactionAdd(messageId: string, emoji: string) {
    try {
      const token = localStorage.getItem('rdtrip_auth_token');
      await fetch(`/api/routes/${routeId}/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ emoji }),
      });
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  }

  function handleInputChange(value: string) {
    setMessageInput(value);

    const cursorPos = messageInputRef.current?.selectionStart || value.length;
    const textBeforeCursor = value.substring(0, cursorPos);
    const match = textBeforeCursor.match(/@(\w*)$/);

    if (match) {
      setMentionTrigger(match[1]);
      setShowMentionDropdown(true);
      setMentionStartPos(cursorPos - match[0].length);
    } else {
      setShowMentionDropdown(false);
    }

    if (isOpen) {
      send({ type: 'typing_indicator', routeId, isTyping: true });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        send({ type: 'typing_indicator', routeId, isTyping: false });
      }, 2000);
    }
  }

  function handleMentionSelect(user: { id: string; name: string; avatarUrl?: string }) {
    const beforeMention = messageInput.substring(0, mentionStartPos);
    const afterMention = messageInput.substring(
      messageInputRef.current?.selectionStart || messageInput.length
    );
    const mentionText = `@${user.name.replace(/\s+/g, '')} `;

    const newValue = beforeMention + mentionText + afterMention;
    setMessageInput(newValue);
    setShowMentionDropdown(false);

    setTimeout(() => {
      if (messageInputRef.current) {
        const newCursorPos = beforeMention.length + mentionText.length;
        messageInputRef.current.focus();
        messageInputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  }

  function handleTypingIndicator(userId: string, typing: boolean) {
    if (userId === currentUserId) return;

    setIsTyping((prev) => {
      const updated = new Set(prev);
      if (typing) {
        updated.add(userId);
      } else {
        updated.delete(userId);
      }
      return updated;
    });
  }

  function updatePresence(userId: string, presence: PresenceStatus) {
    setCollaborators((prev) => prev.map((c) => (c.userId === userId ? { ...c, presence } : c)));
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: colors.warmWhite,
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        border: `1px solid ${colors.golden}`,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <PostcardTexture />

      {/* Header */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          padding: '16px 20px',
          borderBottom: `1px solid ${colors.golden}`,
          gap: '12px',
        }}
      >
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
          <TabButton
            active={activeTab === 'chat'}
            onClick={() => setActiveTab('chat')}
            icon={<MessageCircle style={{ width: 16, height: 16 }} />}
            label="Chat"
            count={messages.length}
          />
          <TabButton
            active={activeTab === 'collaborators'}
            onClick={() => setActiveTab('collaborators')}
            icon={<Users style={{ width: 16, height: 16 }} />}
            label="Team"
            count={collaborators.length}
          />
          <TabButton
            active={activeTab === 'tasks'}
            onClick={() => setActiveTab('tasks')}
            icon={<ListTodo style={{ width: 16, height: 16 }} />}
            label="Tasks"
          />
        </div>

        {/* Connection status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <motion.div
            animate={{ opacity: isOpen ? 1 : 0.5 }}
            style={{ color: isOpen ? colors.sage : colors.lightBrown }}
          >
            {isOpen ? <Wifi style={{ width: 16, height: 16 }} /> : <WifiOff style={{ width: 16, height: 16 }} />}
          </motion.div>
        </div>

        {/* Close button */}
        {onClose && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            style={{
              padding: '6px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: colors.lightBrown,
              borderRadius: '6px',
            }}
          >
            <X style={{ width: 20, height: 20 }} />
          </motion.button>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        {activeTab === 'chat' ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Messages */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px 20px',
              }}
            >
              {isLoadingMessages ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                  }}
                >
                  <Loader2
                    style={{ width: 24, height: 24, animation: 'spin 1s linear infinite' }}
                    color={colors.golden}
                  />
                </div>
              ) : messages.length === 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    textAlign: 'center',
                    color: colors.lightBrown,
                  }}
                >
                  <WaxSeal size={48} color={colors.terracotta} />
                  <p style={{ fontFamily: 'Georgia, serif', fontSize: '16px', marginTop: '12px' }}>
                    No correspondence yet
                  </p>
                  <p style={{ fontFamily: 'Georgia, serif', fontSize: '13px', fontStyle: 'italic' }}>
                    Start the conversation!
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isCurrentUser={message.userId === currentUserId}
                      onReply={() => setReplyingTo(message)}
                      onReactionAdd={handleReactionAdd}
                      currentUserId={currentUserId}
                      routeId={routeId}
                      allMessages={messages}
                    />
                  ))}

                  <AnimatePresence>{isTyping.size > 0 && <TypingIndicator />}</AnimatePresence>

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input area */}
            <div
              style={{
                borderTop: `1px solid ${colors.golden}`,
                padding: '16px 20px',
                background: colors.cream,
              }}
            >
              {/* Reply indicator */}
              <AnimatePresence>
                {replyingTo && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    style={{
                      marginBottom: '12px',
                      padding: '8px 12px',
                      background: colors.parchment,
                      borderLeft: `3px solid ${colors.terracotta}`,
                      borderRadius: '0 8px 8px 0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        <Reply style={{ width: 12, height: 12, color: colors.terracotta }} />
                        <span style={{ fontFamily: 'Georgia, serif', fontSize: '11px', fontWeight: 600, color: colors.espresso }}>
                          Replying to {replyingTo.userId === currentUserId ? 'yourself' : replyingTo.userName}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontFamily: 'Georgia, serif', fontSize: '12px', color: colors.lightBrown, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {replyingTo.message}
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      onClick={() => setReplyingTo(null)}
                      style={{ padding: '4px', background: 'transparent', border: 'none', cursor: 'pointer', color: colors.lightBrown }}
                    >
                      <X style={{ width: 14, height: 14 }} />
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Mention autocomplete */}
              <MentionAutocomplete
                users={collaborators.map((c) => ({ id: c.userId, name: c.name, avatarUrl: c.avatar }))}
                onSelect={handleMentionSelect}
                trigger={mentionTrigger}
                isOpen={showMentionDropdown}
                onClose={() => setShowMentionDropdown(false)}
                inputRef={messageInputRef as React.RefObject<HTMLInputElement | HTMLTextAreaElement>}
              />

              <div style={{ display: 'flex', gap: '12px' }}>
                <input
                  ref={messageInputRef}
                  type="text"
                  value={messageInput}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !showMentionDropdown) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Write your message... (@ to mention)"
                  disabled={!isOpen}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    fontFamily: 'Georgia, serif',
                    fontSize: '14px',
                    color: colors.espresso,
                    background: colors.warmWhite,
                    border: `1px solid ${colors.golden}`,
                    borderRadius: '12px',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                  }}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={sendMessage}
                  disabled={!messageInput.trim() || isSending || !isOpen}
                  style={{
                    padding: '12px 20px',
                    background: !messageInput.trim() || !isOpen
                      ? colors.lightBrown
                      : `linear-gradient(135deg, ${colors.terracotta} 0%, ${colors.terracottaLight} 100%)`,
                    border: 'none',
                    borderRadius: '12px',
                    cursor: !messageInput.trim() || !isOpen ? 'not-allowed' : 'pointer',
                    color: colors.cream,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 8px rgba(196, 88, 48, 0.3)',
                  }}
                >
                  {isSending ? (
                    <Loader2 style={{ width: 20, height: 20, animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <Send style={{ width: 20, height: 20 }} />
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        ) : activeTab === 'collaborators' ? (
          <div style={{ padding: '20px', overflowY: 'auto', height: '100%' }}>
            {/* Invite button */}
            <motion.button
              whileHover={{ scale: 1.01, y: -2 }}
              whileTap={{ scale: 0.99 }}
              onClick={onInviteClick}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '16px',
                background: 'transparent',
                border: `2px dashed ${colors.golden}`,
                borderRadius: '12px',
                cursor: 'pointer',
                marginBottom: '20px',
                color: colors.espresso,
                transition: 'all 0.2s ease',
              }}
            >
              <UserPlus style={{ width: 20, height: 20, color: colors.terracotta }} />
              <span style={{ fontFamily: 'Georgia, serif', fontSize: '14px', fontWeight: 600 }}>
                Invite Travel Companion
              </span>
            </motion.button>

            {/* Collaborators list */}
            {isLoadingCollaborators ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
                <Loader2 style={{ width: 24, height: 24, animation: 'spin 1s linear infinite' }} color={colors.golden} />
              </div>
            ) : collaborators.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: colors.lightBrown }}>
                <Users style={{ width: 48, height: 48, marginBottom: '12px', opacity: 0.5 }} />
                <p style={{ fontFamily: 'Georgia, serif', fontSize: '14px' }}>No companions yet</p>
              </div>
            ) : (
              <div>
                {collaborators.map((collaborator) => (
                  <CollaboratorRow
                    key={collaborator.id}
                    collaborator={collaborator}
                    isCurrentUser={collaborator.userId === currentUserId}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <TaskBoard
            routeId={routeId}
            currentUserId={currentUserId}
            userRole={collaborators.find((c) => c.userId === currentUserId)?.role}
            wsMessage={taskWsMessage}
          />
        )}
      </div>
    </div>
  );
}

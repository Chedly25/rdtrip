import { useState, useEffect, useRef } from 'react'
import { MessageCircle, Users, Send, Loader2, UserPlus, MoreVertical, Crown, Edit, Eye, Reply, X } from 'lucide-react'
import { useWebSocket } from '../../hooks/useWebSocket'
import type { Collaborator, TripMessage, PresenceStatus } from '../../types'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageReactionPicker } from './MessageReactionPicker'
import { MentionAutocomplete } from './MentionAutocomplete'

interface CollaborationPanelProps {
  routeId: string
  currentUserId: string
  onInviteClick: () => void
}

type TabType = 'chat' | 'collaborators'

export function CollaborationPanel({ routeId, currentUserId, onInviteClick }: CollaborationPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('chat')
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [messages, setMessages] = useState<TripMessage[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [isTyping, setIsTyping] = useState<Set<string>>(new Set())
  const [isLoadingCollaborators, setIsLoadingCollaborators] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(true)
  const [isSending, setIsSending] = useState(false)

  // Mention autocomplete state
  const [mentionTrigger, setMentionTrigger] = useState('')
  const [showMentionDropdown, setShowMentionDropdown] = useState(false)
  const [mentionStartPos, setMentionStartPos] = useState(0)

  // Thread/reply state
  const [replyingTo, setReplyingTo] = useState<TripMessage | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const messageInputRef = useRef<HTMLInputElement>(null)

  // WebSocket connection for real-time updates
  const { send, isOpen } = useWebSocket('/ws/collab', {
    onOpen: () => {
      // Join this route's room
      send({ type: 'join_route', routeId })
    },
    onMessage: handleWebSocketMessage,
  })

  // Fetch initial data
  useEffect(() => {
    fetchCollaborators()
    fetchMessages()
  }, [routeId])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle WebSocket messages
  function handleWebSocketMessage(message: any) {
    switch (message.type) {
      case 'chat_message':
        setMessages((prev) => [...prev, message.data])
        break

      case 'message_reaction_added':
      case 'message_reaction_removed':
        // Update the message with new reactions
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === message.data.messageId ? message.data.message : msg
          )
        )
        break

      case 'user_joined':
        // Refresh collaborators list
        fetchCollaborators()
        break

      case 'user_left':
        // Update presence
        setCollaborators((prev) =>
          prev.map((c) =>
            c.userId === message.userId
              ? { ...c, presence: { ...c.presence!, status: 'offline' } }
              : c
          )
        )
        break

      case 'presence_update':
        // Update user presence
        updatePresence(message.userId, message.data)
        break

      case 'typing_indicator':
        handleTypingIndicator(message.userId, message.isTyping)
        break

      case 'collaborator_added':
        fetchCollaborators()
        break

      case 'collaborator_removed':
        setCollaborators((prev) => prev.filter((c) => c.userId !== message.userId))
        break

      case 'route_update':
        // Could show a notification here
        break
    }
  }

  // Fetch collaborators from API
  async function fetchCollaborators() {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/routes/${routeId}/collaborators`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setCollaborators(data.collaborators || [])
      }
    } catch (error) {
      console.error('Failed to fetch collaborators:', error)
    } finally {
      setIsLoadingCollaborators(false)
    }
  }

  // Fetch message history from API
  async function fetchMessages() {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/routes/${routeId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    } finally {
      setIsLoadingMessages(false)
    }
  }

  // Send chat message
  async function sendMessage() {
    if (!messageInput.trim() || isSending) return

    setIsSending(true)
    try {
      // Parse mentions from message
      const mentionedUserIds: string[] = []
      const mentionPattern = /@(\w+)/g
      let match

      while ((match = mentionPattern.exec(messageInput)) !== null) {
        const mentionedUsername = match[1]
        // Find user by name (removing spaces for matching)
        const user = collaborators.find(
          (c) => c.name.replace(/\s+/g, '').toLowerCase() === mentionedUsername.toLowerCase()
        )
        if (user && !mentionedUserIds.includes(user.userId)) {
          mentionedUserIds.push(user.userId)
        }
      }

      const token = localStorage.getItem('rdtrip_auth_token')
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
      })

      if (response.ok) {
        setMessageInput('')
        setShowMentionDropdown(false)
        setReplyingTo(null)
        // Message will be added via WebSocket broadcast
      } else {
        console.error('Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsSending(false)
    }
  }

  // Handle reaction add
  async function handleReactionAdd(messageId: string, emoji: string) {
    try {
      const token = localStorage.getItem('rdtrip_auth_token')
      const response = await fetch(`/api/routes/${routeId}/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ emoji }),
      })

      if (!response.ok) {
        console.error('Failed to add reaction')
      }
      // Reaction will be updated via WebSocket broadcast
    } catch (error) {
      console.error('Error adding reaction:', error)
    }
  }

  // Handle typing indicator and mention detection
  function handleInputChange(value: string) {
    setMessageInput(value)

    // Detect @ mentions
    const cursorPos = messageInputRef.current?.selectionStart || value.length
    const textBeforeCursor = value.substring(0, cursorPos)
    const match = textBeforeCursor.match(/@(\w*)$/)

    if (match) {
      setMentionTrigger(match[1])
      setShowMentionDropdown(true)
      setMentionStartPos(cursorPos - match[0].length)
    } else {
      setShowMentionDropdown(false)
    }

    // Send typing indicator
    if (isOpen) {
      send({ type: 'typing_indicator', routeId, isTyping: true })

      // Clear typing after 2 seconds of inactivity
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      typingTimeoutRef.current = setTimeout(() => {
        send({ type: 'typing_indicator', routeId, isTyping: false })
      }, 2000)
    }
  }

  // Handle mention selection
  function handleMentionSelect(user: { id: string; name: string; avatarUrl?: string }) {
    const beforeMention = messageInput.substring(0, mentionStartPos)
    const afterMention = messageInput.substring(messageInputRef.current?.selectionStart || messageInput.length)
    const mentionText = `@${user.name.replace(/\s+/g, '')} `

    const newValue = beforeMention + mentionText + afterMention
    setMessageInput(newValue)
    setShowMentionDropdown(false)

    // Set cursor position after mention
    setTimeout(() => {
      if (messageInputRef.current) {
        const newCursorPos = beforeMention.length + mentionText.length
        messageInputRef.current.focus()
        messageInputRef.current.setSelectionRange(newCursorPos, newCursorPos)
      }
    }, 0)
  }

  // Update typing indicators from other users
  function handleTypingIndicator(userId: string, isTyping: boolean) {
    if (userId === currentUserId) return

    setIsTyping((prev) => {
      const updated = new Set(prev)
      if (isTyping) {
        updated.add(userId)
      } else {
        updated.delete(userId)
      }
      return updated
    })
  }

  // Update presence status
  function updatePresence(userId: string, presence: PresenceStatus) {
    setCollaborators((prev) =>
      prev.map((c) => (c.userId === userId ? { ...c, presence } : c))
    )
  }

  // Get presence indicator color
  function getPresenceColor(status?: string): string {
    switch (status) {
      case 'viewing':
      case 'editing':
        return 'bg-green-500'
      case 'idle':
        return 'bg-yellow-500'
      case 'offline':
      default:
        return 'bg-gray-400'
    }
  }

  // Get role icon
  function getRoleIcon(role: string) {
    switch (role) {
      case 'owner':
        return <Crown className="h-3 w-3 text-yellow-500" />
      case 'editor':
        return <Edit className="h-3 w-3 text-blue-500" />
      case 'viewer':
        return <Eye className="h-3 w-3 text-gray-500" />
      default:
        return null
    }
  }

  // Format timestamp
  function formatTime(timestamp: string): string {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    // Less than 1 minute
    if (diff < 60000) return 'Just now'

    // Less than 1 hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000)
      return `${minutes}m ago`
    }

    // Less than 24 hours
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000)
      return `${hours}h ago`
    }

    // Show time for today, date for older
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    }

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg border border-gray-200">
      {/* Header with tabs */}
      <div className="flex items-center justify-between border-b border-gray-200 p-4">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'chat'
                ? 'bg-blue-50 text-blue-600 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <MessageCircle className="h-4 w-4" />
            <span>Chat</span>
            {messages.length > 0 && (
              <span className="ml-1 text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                {messages.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('collaborators')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'collaborators'
                ? 'bg-blue-50 text-blue-600 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Collaborators</span>
            <span className="ml-1 text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
              {collaborators.length}
            </span>
          </button>
        </div>

        {/* Connection status indicator */}
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${isOpen ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span className="text-xs text-gray-500">{isOpen ? 'Connected' : 'Connecting...'}</span>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' ? (
          <div className="flex flex-col h-full">
            {/* Messages list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                  <MessageCircle className="h-12 w-12 mb-2 text-gray-300" />
                  <p className="text-sm">No messages yet</p>
                  <p className="text-xs mt-1">Start the conversation!</p>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 ${
                        message.userId === currentUserId ? 'flex-row-reverse' : ''
                      }`}
                    >
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                          {message.userName.charAt(0).toUpperCase()}
                        </div>
                      </div>

                      {/* Message bubble */}
                      <div
                        className={`flex flex-col max-w-[70%] ${
                          message.userId === currentUserId ? 'items-end' : 'items-start'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-gray-700">
                            {message.userId === currentUserId ? 'You' : message.userName}
                          </span>
                          <span className="text-xs text-gray-400">{formatTime(message.createdAt)}</span>
                        </div>
                        <div
                          className={`px-4 py-2 rounded-2xl ${
                            message.userId === currentUserId
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          {/* Parent message indicator (if this is a reply) */}
                          {message.parentMessageId && (() => {
                            const parentMsg = messages.find((m) => m.id === message.parentMessageId)
                            if (parentMsg) {
                              return (
                                <div
                                  className={`mb-2 pb-2 border-l-2 pl-2 text-xs ${
                                    message.userId === currentUserId
                                      ? 'border-blue-300 text-blue-100'
                                      : 'border-gray-300 text-gray-500'
                                  }`}
                                >
                                  <div className="flex items-center gap-1 mb-0.5">
                                    <Reply className="w-2.5 h-2.5" />
                                    <span className="font-medium">
                                      {parentMsg.userId === currentUserId ? 'You' : parentMsg.userName}
                                    </span>
                                  </div>
                                  <p className="truncate">{parentMsg.message}</p>
                                </div>
                              )
                            }
                            return null
                          })()}
                          <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
                        </div>

                        {/* Reaction picker and reply button */}
                        <div className="mt-1 flex items-center gap-2">
                          <MessageReactionPicker
                            messageId={message.id}
                            routeId={routeId}
                            onReactionAdd={handleReactionAdd}
                            existingReactions={message.reactions || []}
                            currentUserId={currentUserId}
                          />
                          <button
                            onClick={() => setReplyingTo(message)}
                            className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                            title="Reply to this message"
                          >
                            <Reply className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* Typing indicator */}
                  <AnimatePresence>
                    {isTyping.size > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2 text-xs text-gray-500"
                      >
                        <div className="flex gap-1">
                          <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span>Someone is typing...</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Message input */}
            <div className="border-t border-gray-200 p-4">
              {/* Reply indicator */}
              <AnimatePresence>
                {replyingTo && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="mb-2 p-2 bg-blue-50 border-l-4 border-blue-500 rounded flex items-start justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Reply className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-xs font-medium text-blue-700">
                          Replying to {replyingTo.userId === currentUserId ? 'yourself' : replyingTo.userName}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 truncate">{replyingTo.message}</p>
                    </div>
                    <button
                      onClick={() => setReplyingTo(null)}
                      className="ml-2 p-1 hover:bg-blue-100 rounded transition-colors"
                      title="Cancel reply"
                    >
                      <X className="w-3.5 h-3.5 text-blue-600" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Mention autocomplete */}
              <MentionAutocomplete
                users={collaborators.map((c) => ({
                  id: c.userId,
                  name: c.name,
                  avatarUrl: c.avatar,
                }))}
                onSelect={handleMentionSelect}
                trigger={mentionTrigger}
                isOpen={showMentionDropdown}
                onClose={() => setShowMentionDropdown(false)}
                inputRef={messageInputRef as React.RefObject<HTMLInputElement | HTMLTextAreaElement>}
              />

              <div className="flex gap-2">
                <input
                  ref={messageInputRef}
                  type="text"
                  value={messageInput}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !showMentionDropdown) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  placeholder="Type a message... (use @ to mention)"
                  disabled={!isOpen}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
                />
                <button
                  onClick={sendMessage}
                  disabled={!messageInput.trim() || isSending || !isOpen}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isSending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Collaborators list */
          <div className="p-4 space-y-2">
            {/* Invite button */}
            <button
              onClick={onInviteClick}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-gray-600 hover:text-blue-600"
            >
              <UserPlus className="h-5 w-5" />
              <span className="font-medium">Invite Collaborator</span>
            </button>

            {/* Collaborators */}
            {isLoadingCollaborators ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : collaborators.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No collaborators yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {collaborators.map((collaborator) => (
                  <div
                    key={collaborator.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Avatar with presence indicator */}
                      <div className="relative flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium">
                          {collaborator.name.charAt(0).toUpperCase()}
                        </div>
                        <div
                          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${getPresenceColor(
                            collaborator.presence?.status
                          )}`}
                        />
                      </div>

                      {/* Name and email */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {collaborator.name}
                            {collaborator.userId === currentUserId && (
                              <span className="ml-1 text-gray-500">(You)</span>
                            )}
                          </p>
                          {getRoleIcon(collaborator.role)}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{collaborator.email}</p>
                        {collaborator.presence?.status && collaborator.presence.status !== 'offline' && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {collaborator.presence.currentSection || collaborator.presence.status}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Options menu (could expand for owner/editor) */}
                    {collaborator.role !== 'owner' && (
                      <button className="p-1 hover:bg-gray-200 rounded transition-colors">
                        <MoreVertical className="h-4 w-4 text-gray-400" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

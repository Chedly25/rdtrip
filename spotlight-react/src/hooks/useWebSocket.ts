import { useState, useEffect, useRef, useCallback } from 'react'

export const ReadyState = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
} as const

export type ReadyState = typeof ReadyState[keyof typeof ReadyState]

interface WebSocketMessage {
  type: string
  [key: string]: any
}

interface UseWebSocketOptions {
  /** Whether to automatically reconnect on disconnect */
  reconnect?: boolean
  /** Maximum number of reconnection attempts (0 = infinite) */
  maxReconnectAttempts?: number
  /** Initial reconnection delay in ms */
  reconnectInterval?: number
  /** Maximum reconnection delay in ms */
  maxReconnectInterval?: number
  /** Function to get authentication token */
  getToken?: () => string | null
  /** Whether to queue messages when offline */
  queueMessages?: boolean
  /** Called when connection opens */
  onOpen?: (event: Event) => void
  /** Called when connection closes */
  onClose?: (event: CloseEvent) => void
  /** Called when error occurs */
  onError?: (event: Event) => void
  /** Called when message received */
  onMessage?: (message: WebSocketMessage) => void
}

const DEFAULT_OPTIONS: Required<Omit<UseWebSocketOptions, 'onOpen' | 'onClose' | 'onError' | 'onMessage'>> = {
  reconnect: true,
  maxReconnectAttempts: 0, // infinite
  reconnectInterval: 1000, // 1 second
  maxReconnectInterval: 30000, // 30 seconds
  getToken: () => localStorage.getItem('token'),
  queueMessages: true,
}

export function useWebSocket(path: string, options: UseWebSocketOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  const [readyState, setReadyState] = useState<ReadyState>(ReadyState.CONNECTING)
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const [reconnectAttempt, setReconnectAttempt] = useState(0)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const messageQueueRef = useRef<WebSocketMessage[]>([])
  const didUnmountRef = useRef(false)
  const reconnectAttemptsRef = useRef(0)

  // Calculate exponential backoff delay
  const getReconnectDelay = useCallback(() => {
    const delay = Math.min(
      opts.reconnectInterval * Math.pow(2, reconnectAttemptsRef.current),
      opts.maxReconnectInterval
    )
    return delay
  }, [opts.reconnectInterval, opts.maxReconnectInterval])

  // Connect to WebSocket server
  const connect = useCallback(() => {
    if (didUnmountRef.current || wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      // Get token and construct URL
      const token = opts.getToken()
      if (!token) {
        console.error('No auth token available for WebSocket connection')
        setReadyState(ReadyState.CLOSED)
        return
      }

      // Construct WebSocket URL with token
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const host = window.location.host
      const url = `${protocol}//${host}${path}?token=${encodeURIComponent(token)}`

      console.log('Connecting to WebSocket:', path)
      const ws = new WebSocket(url)
      wsRef.current = ws
      setReadyState(ReadyState.CONNECTING)

      ws.onopen = (event) => {
        console.log('WebSocket connected')
        setReadyState(ReadyState.OPEN)
        reconnectAttemptsRef.current = 0
        setReconnectAttempt(0)

        // Send queued messages
        if (opts.queueMessages && messageQueueRef.current.length > 0) {
          console.log(`Sending ${messageQueueRef.current.length} queued messages`)
          messageQueueRef.current.forEach((msg) => {
            ws.send(JSON.stringify(msg))
          })
          messageQueueRef.current = []
        }

        opts.onOpen?.(event)
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage
          setLastMessage(message)
          opts.onMessage?.(message)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      ws.onerror = (event) => {
        console.error('WebSocket error:', event)
        opts.onError?.(event)
      }

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason)
        setReadyState(ReadyState.CLOSED)
        wsRef.current = null
        opts.onClose?.(event)

        // Attempt reconnection if enabled
        if (
          opts.reconnect &&
          !didUnmountRef.current &&
          (opts.maxReconnectAttempts === 0 || reconnectAttemptsRef.current < opts.maxReconnectAttempts)
        ) {
          reconnectAttemptsRef.current++
          setReconnectAttempt(reconnectAttemptsRef.current)

          const delay = getReconnectDelay()
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`)

          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, delay)
        }
      }
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      setReadyState(ReadyState.CLOSED)
    }
  }, [path, opts, getReconnectDelay])

  // Send message through WebSocket
  const send = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    } else if (opts.queueMessages) {
      console.log('WebSocket not open, queuing message:', message.type)
      messageQueueRef.current.push(message)
    } else {
      console.warn('WebSocket not open and message queueing disabled')
    }
  }, [opts.queueMessages])

  // Manually disconnect
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    setReadyState(ReadyState.CLOSED)
  }, [])

  // Manually reconnect
  const reconnect = useCallback(() => {
    disconnect()
    reconnectAttemptsRef.current = 0
    setReconnectAttempt(0)
    connect()
  }, [connect, disconnect])

  // Connect on mount
  useEffect(() => {
    didUnmountRef.current = false
    connect()

    // Cleanup on unmount
    return () => {
      didUnmountRef.current = true
      disconnect()
    }
  }, [connect, disconnect])

  return {
    send,
    disconnect,
    reconnect,
    readyState,
    lastMessage,
    reconnectAttempt,
    isConnecting: readyState === ReadyState.CONNECTING,
    isOpen: readyState === ReadyState.OPEN,
    isClosed: readyState === ReadyState.CLOSED,
  }
}

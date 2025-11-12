/**
 * Collaboration Service
 * Handles real-time WebSocket connections for collaborative trip planning
 * 
 * Features:
 * - Multi-user chat within trip context
 * - Real-time presence tracking
 * - Broadcast route updates
 * - Room-based message distribution
 */

const WebSocket = require('ws');
const { EventEmitter } = require('events');
const { Pool } = require('pg');

class CollaborationService extends EventEmitter {
  constructor(server, pool) {
    super();
    
    this.pool = pool;
    this.wss = new WebSocket.Server({
      server,
      path: '/ws/collab',
      clientTracking: true
    });

    // Route rooms: routeId -> Set<WebSocket>
    this.routeRooms = new Map();
    
    // User sockets: userId -> WebSocket
    this.userSockets = new Map();

    this.setupWebSocketServer();
    this.startHeartbeat();

    console.log('✅ Collaboration WebSocket server initialized');
  }

  setupWebSocketServer() {
    this.wss.on('connection', (ws, req) => {
      console.log('📡 New WebSocket connection');

      // Authenticate user
      const userId = this.authenticateWebSocket(req);
      if (!userId) {
        console.warn('❌ Unauthorized WebSocket connection');
        ws.close(1008, 'Unauthorized');
        return;
      }

      // Setup client
      ws.userId = userId;
      ws.isAlive = true;
      ws.currentRouteId = null;
      this.userSockets.set(userId, ws);

      console.log(`✅ User ${userId} authenticated via WebSocket`);

      // Handle messages
      ws.on('message', (data) => this.handleMessage(ws, data));

      // Handle disconnect
      ws.on('close', () => this.handleDisconnect(ws));

      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });

      // Heartbeat response
      ws.on('pong', () => {
        ws.isAlive = true;
      });
    });
  }

  authenticateWebSocket(req) {
    try {
      // Extract JWT from query params
      const url = new URL(req.url, `http://${req.headers.host}`);
      const token = url.searchParams.get('token');

      if (!token) {
        console.warn('No token provided in WebSocket connection');
        return null;
      }

      // Verify JWT
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return decoded.userId;
    } catch (error) {
      console.error('WebSocket authentication failed:', error.message);
      return null;
    }
  }

  handleMessage(ws, data) {
    try {
      const message = JSON.parse(data);
      console.log(`📨 Message from ${ws.userId}:`, message.type);

      switch (message.type) {
        case 'join_route':
          this.joinRoute(ws, message.routeId);
          break;
        case 'leave_route':
          this.leaveRoute(ws, message.routeId);
          break;
        case 'chat_message':
          this.handleChatMessage(ws, message);
          break;
        case 'route_update':
          this.handleRouteUpdate(ws, message);
          break;
        case 'presence_update':
          this.handlePresenceUpdate(ws, message);
          break;
        case 'typing_indicator':
          this.handleTypingIndicator(ws, message);
          break;
        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process message'
      }));
    }
  }

  async joinRoute(ws, routeId) {
    try {
      // Verify user has permission
      const hasPermission = await this.checkRoutePermission(routeId, ws.userId);
      if (!hasPermission) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Not authorized to access this route'
        }));
        return;
      }

      // Add to room
      if (!this.routeRooms.has(routeId)) {
        this.routeRooms.set(routeId, new Set());
      }
      this.routeRooms.get(routeId).add(ws);
      ws.currentRouteId = routeId;

      // Update presence in database
      await this.updatePresence(ws.userId, routeId, 'viewing');

      // Notify others
      this.broadcast(routeId, {
        type: 'user_joined',
        userId: ws.userId,
        timestamp: Date.now()
      }, ws.userId);

      // Send confirmation
      ws.send(JSON.stringify({
        type: 'joined_route',
        routeId
      }));

      console.log(`✅ User ${ws.userId} joined route ${routeId}`);
    } catch (error) {
      console.error('Error joining route:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to join route'
      }));
    }
  }

  leaveRoute(ws, routeId) {
    const room = this.routeRooms.get(routeId);
    if (room) {
      room.delete(ws);
      if (room.size === 0) {
        this.routeRooms.delete(routeId);
      }
    }

    ws.currentRouteId = null;

    // Notify others
    this.broadcast(routeId, {
      type: 'user_left',
      userId: ws.userId,
      timestamp: Date.now()
    }, ws.userId);

    console.log(`📤 User ${ws.userId} left route ${routeId}`);
  }

  async handleChatMessage(ws, message) {
    const { routeId, text } = message;

    try {
      // Save to database
      const result = await this.pool.query(`
        INSERT INTO trip_messages (route_id, user_id, message)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [routeId, ws.userId, text]);

      const savedMessage = result.rows[0];

      // Broadcast to all in room
      this.broadcast(routeId, {
        type: 'chat_message',
        data: savedMessage
      });

      // Log activity
      await this.logActivity(routeId, ws.userId, 'message_sent');

      console.log(`💬 Chat message sent in route ${routeId}`);
    } catch (error) {
      console.error('Error handling chat message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to send message'
      }));
    }
  }

  async handleRouteUpdate(ws, message) {
    const { routeId, updateType, data } = message;

    // Broadcast update to all
    this.broadcast(routeId, {
      type: 'route_update',
      updateType,
      data,
      userId: ws.userId,
      timestamp: Date.now()
    }, ws.userId);

    // Log activity
    await this.logActivity(routeId, ws.userId, updateType, data);

    console.log(`🔄 Route update: ${updateType} in route ${routeId}`);
  }

  async handlePresenceUpdate(ws, message) {
    const { routeId, status, section } = message;

    await this.updatePresence(ws.userId, routeId, status, section);

    // Broadcast presence
    this.broadcast(routeId, {
      type: 'presence_update',
      userId: ws.userId,
      status,
      section
    }, ws.userId);
  }

  handleTypingIndicator(ws, message) {
    const { routeId, isTyping } = message;

    // Broadcast typing state (don't persist)
    this.broadcast(routeId, {
      type: 'typing_indicator',
      userId: ws.userId,
      isTyping
    }, ws.userId);
  }

  handleDisconnect(ws) {
    if (ws.currentRouteId) {
      this.leaveRoute(ws, ws.currentRouteId);
    }
    this.userSockets.delete(ws.userId);
    console.log(`👋 User ${ws.userId} disconnected`);
  }

  broadcast(routeId, message, excludeUserId = null) {
    const room = this.routeRooms.get(routeId);
    if (!room) return;

    const payload = JSON.stringify(message);

    room.forEach(client => {
      if (client.readyState === WebSocket.OPEN &&
          client.userId !== excludeUserId) {
        client.send(payload);
      }
    });
  }

  async checkRoutePermission(routeId, userId) {
    try {
      const result = await this.pool.query(`
        SELECT 1 FROM route_collaborators
        WHERE route_id = $1 AND user_id = $2 AND status = 'accepted'
        UNION
        SELECT 1 FROM routes WHERE id = $1 AND user_id = $2
        LIMIT 1
      `, [routeId, userId]);

      return result.rows.length > 0;
    } catch (error) {
      console.error('Error checking route permission:', error);
      return false;
    }
  }

  async updatePresence(userId, routeId, status, section = null) {
    try {
      await this.pool.query(`
        INSERT INTO user_presence (user_id, route_id, status, current_section, last_seen_at)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id, route_id)
        DO UPDATE SET
          status = $3,
          current_section = $4,
          last_seen_at = CURRENT_TIMESTAMP
      `, [userId, routeId, status, section]);
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  }

  async logActivity(routeId, userId, action, metadata = null) {
    try {
      await this.pool.query(`
        INSERT INTO route_activity (route_id, user_id, action, metadata)
        VALUES ($1, $2, $3, $4)
      `, [routeId, userId, action, metadata ? JSON.stringify(metadata) : null]);
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }

  startHeartbeat() {
    // Heartbeat to detect broken connections
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          console.log(`💀 Terminating dead connection for user ${ws.userId}`);
          return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30 seconds

    console.log('❤️  WebSocket heartbeat started (30s interval)');
  }

  close() {
    console.log('🛑 Closing WebSocket server...');
    clearInterval(this.heartbeatInterval);
    this.wss.close();
  }

  // Get connection stats
  getStats() {
    return {
      totalConnections: this.wss.clients.size,
      activeRooms: this.routeRooms.size,
      connectedUsers: this.userSockets.size
    };
  }
}

module.exports = CollaborationService;

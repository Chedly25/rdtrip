# Phase 2: Collaborative Trip Planning - Implementation Plan

**Feature**: Real-time collaborative workspace for trip planning  
**Status**: Planning → Implementation  
**Estimated Time**: 3-4 weeks  
**Complexity**: High  
**Priority**: Critical for social features

---

## 📋 Overview

Phase 2 transforms RDTrip from a single-user route planner into a **collaborative platform** where friends can plan trips together in real-time with chat, presence indicators, and role-based permissions.

### Key Capabilities

1. **Multi-user collaboration** - Invite friends as owner/editor/viewer
2. **Real-time chat** - Context-aware trip messaging  
3. **Live presence** - See who's online and what they're viewing
4. **Activity feed** - Track all changes to the trip
5. **Permission management** - Control who can edit vs view
6. **Notifications** - Email alerts for invites and updates

---

## 🎯 Success Criteria

- ✅ Users can invite collaborators by email
- ✅ Real-time updates < 200ms latency
- ✅ Chat messages appear instantly for all participants
- ✅ Presence indicators show who's online
- ✅ Permission system prevents unauthorized edits
- ✅ 95% WebSocket connection uptime

---

## 🏗️ Architecture Overview

### Technology Stack

**Backend**:
- WebSocket Server: \`ws\` npm package
- Real-time service: CollaborationService.js
- Database: PostgreSQL with 4 new tables

**Frontend**:
- WebSocket client: native WebSocket API  
- State management: React hooks + context
- UI components: Framer Motion animations

### Data Flow

\`\`\`
User Action (Frontend)
  ↓
WebSocket Message
  ↓
CollaborationService (Backend)
  ↓
Broadcast to Room Participants
  ↓
Other Users Receive Update (Real-time)
\`\`\`

---

## 📊 Database Schema

### New Tables (Migration: \`010_add_collaboration.sql\`)

See [FEATURE_ROADMAP_2025.md](./FEATURE_ROADMAP_2025.md#feature-2-collaborative-trip-planning) for complete schema.

**Tables to create**:
1. \`route_collaborators\` - Who has access + permissions
2. \`trip_messages\` - Chat messages  
3. \`route_activity\` - Audit log
4. \`user_presence\` - Real-time presence tracking

---

## 📝 Implementation Roadmap

### STEP 1: Database Setup ⏱️ 2 hours

**Goal**: Create collaboration tables

**Tasks**:
- [ ] Create migration file \`db/migrations/010_add_collaboration.sql\`
- [ ] Copy schema from FEATURE_ROADMAP_2025.md
- [ ] Run migration locally: \`node db/run-migration.js 010_add_collaboration.sql\`
- [ ] Verify tables created: \`psql $DATABASE_URL -c "\\dt route_*"\`

**Verification**:
\`\`\`sql
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('route_collaborators', 'trip_messages', 'route_activity', 'user_presence');
\`\`\`

---

### STEP 2: WebSocket Infrastructure ⏱️ 1 day

**Goal**: Install WebSocket library and create CollaborationService

**Tasks**:
- [ ] Install ws package: \`npm install ws\`
- [ ] Create \`server/services/CollaborationService.js\`
- [ ] Implement WebSocket server setup
- [ ] Add JWT authentication for WebSocket
- [ ] Implement room management (join/leave)
- [ ] Add heartbeat/ping-pong for connection health
- [ ] Initialize service in server.js

**Key Methods**:
- \`setupWebSocketServer()\` - Initialize WSS
- \`authenticateWebSocket(req)\` - Extract JWT token
- \`joinRoute(ws, routeId)\` - Add user to route room
- \`leaveRoute(ws, routeId)\` - Remove user from room
- \`broadcast(routeId, message)\` - Send to all in room
- \`handleMessage(ws, data)\` - Route incoming messages

**Testing**:
\`\`\`javascript
// Test with wscat
npm install -g wscat
wscat -c "ws://localhost:3001/ws/collab?token=YOUR_JWT_TOKEN"
// Send: {"type":"join_route","routeId":"uuid"}
\`\`\`

---

### STEP 3: Collaboration API Endpoints ⏱️ 2 days

**Goal**: Add REST endpoints for collaboration management

**Endpoints to add** (in server.js):

#### Collaborator Management
- \`POST /api/routes/:id/collaborators\` - Invite user
- \`GET /api/routes/:id/collaborators\` - List collaborators
- \`PATCH /api/routes/:id/collaborators/:userId\` - Update role
- \`DELETE /api/routes/:id/collaborators/:userId\` - Remove
- \`POST /api/routes/:id/collaborators/:userId/accept\` - Accept invite

#### Chat
- \`POST /api/routes/:id/messages\` - Send message  
- \`GET /api/routes/:id/messages\` - Get history

#### Activity
- \`GET /api/routes/:id/activity\` - Get activity log

**Helper Functions**:
\`\`\`javascript
async function checkRoutePermission(routeId, userId) {
  // Returns { role: 'owner'|'editor'|'viewer' } or null
}

async function logRouteActivity(routeId, userId, action, metadata) {
  // Insert into route_activity table
}
\`\`\`

**Testing**:
\`\`\`bash
# Invite collaborator
curl -X POST http://localhost:3001/api/routes/ROUTE_ID/collaborators \\
  -H "Authorization: Bearer TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"email":"friend@example.com","role":"editor"}'

# List collaborators  
curl http://localhost:3001/api/routes/ROUTE_ID/collaborators \\
  -H "Authorization: Bearer TOKEN"
\`\`\`

---

### STEP 4: Frontend WebSocket Hook ⏱️ 4 hours

**Goal**: Create reusable WebSocket React hook

**File**: \`spotlight-react/src/hooks/useWebSocket.ts\`

**Features**:
- Auto-reconnect with exponential backoff
- JWT token injection
- Message queue for offline messages
- Connection state tracking
- Heartbeat handling

**Usage**:
\`\`\`typescript
const { send, readyState, lastMessage } = useWebSocket('/ws/collab');

// Send message
send({ type: 'chat_message', routeId, text: 'Hello!' });

// Receive message
useEffect(() => {
  if (lastMessage) {
    const data = JSON.parse(lastMessage.data);
    // Handle message
  }
}, [lastMessage]);
\`\`\`

**Testing**:
- Create test component that connects/disconnects
- Verify reconnection works after server restart
- Test token refresh on expiry

---

### STEP 5: CollaborationPanel Component ⏱️ 2 days

**Goal**: Build main collaboration UI

**File**: \`spotlight-react/src/components/collaboration/CollaborationPanel.tsx\`

**Features**:
- Tabbed interface (Chat / Collaborators)
- Real-time message list with auto-scroll
- Typing indicators
- Presence indicators (green dot = online)
- Message input with Enter-to-send
- Collaborator avatars with status

**UI Layout**:
\`\`\`
┌─────────────────────────────┐
│ [Chat] [Collaborators (3)]  │ ← Tabs
├─────────────────────────────┤
│                             │
│  Chat Messages              │ ← Scrollable
│  or                         │
│  Collaborator List          │
│                             │
├─────────────────────────────┤
│ [Type message...] [Send]    │ ← Input
└─────────────────────────────┘
\`\`\`

**State Management**:
\`\`\`typescript
const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
const [messages, setMessages] = useState<Message[]>([]);
const [isTyping, setIsTyping] = useState<Set<string>>(new Set());
\`\`\`

---

### STEP 6: InviteCollaboratorModal ⏱️ 1 day

**Goal**: Build invite modal UI

**File**: \`spotlight-react/src/components/collaboration/InviteCollaboratorModal.tsx\`

**Form Fields**:
- Email input (required)
- Role selector (Editor / Viewer)
- Optional personal message
- Submit button

**Validation**:
- Email format check
- User exists check
- Not already a collaborator

**Success Flow**:
1. User fills form
2. POST to /api/routes/:id/collaborators
3. Show success message
4. Close modal
5. Refresh collaborators list

---

### STEP 7: Integration with Spotlight Page ⏱️ 1 day

**Goal**: Add CollaborationPanel to route detail page

**File**: \`spotlight-react/src/pages/SpotlightPage.tsx\`

**Layout Changes**:
\`\`\`tsx
// Add collaboration panel as sidebar or floating panel
<div className="flex gap-4">
  <div className="flex-1">
    {/* Existing route content */}
  </div>
  <div className="w-96">
    <CollaborationPanel routeId={routeId} />
  </div>
</div>
\`\`\`

**Mobile Responsiveness**:
- Show as bottom sheet on mobile
- Floating action button to open chat
- Badge with unread count

---

### STEP 8: Real-time Route Updates ⏱️ 1 day

**Goal**: Broadcast route changes to all collaborators

**When to broadcast**:
- Stop added/removed
- Itinerary regenerated
- Route renamed
- Budget changed

**Implementation**:
\`\`\`typescript
// In route update handler
const updateRoute = async (changes) => {
  // Save to database
  await saveChanges(changes);
  
  // Broadcast via WebSocket
  collaborationService.broadcast(routeId, {
    type: 'route_update',
    updateType: 'stop_added',
    data: changes
  });
};
\`\`\`

**Frontend handling**:
\`\`\`typescript
useEffect(() => {
  if (lastMessage?.type === 'route_update') {
    // Show toast notification
    toast.info('Route updated by collaborator');
    
    // Refresh route data
    refetchRoute();
  }
}, [lastMessage]);
\`\`\`

---

### STEP 9: Presence Indicators ⏱️ 4 hours

**Goal**: Show who's online

**Implementation**:
- Send presence updates every 30 seconds
- Update \`user_presence\` table
- Broadcast presence changes
- Show colored dots next to avatars

**Status Colors**:
- 🟢 Green = Viewing/Editing (online)
- 🟡 Yellow = Idle (5+ min inactive)  
- ⚫ Gray = Offline

**Presence Update Flow**:
\`\`\`typescript
// Every 30 seconds
send({
  type: 'presence_update',
  routeId,
  status: 'viewing',
  section: 'itinerary'
});
\`\`\`

---

### STEP 10: Activity Feed (Optional for V1) ⏱️ 1 day

**Goal**: Show audit log of changes

**Display**:
- Timeline view
- User avatars
- Action descriptions
- Timestamps

**Example Items**:
- "Alice added stop: Lyon, France"
- "Bob regenerated itinerary"
- "Charlie invited David as editor"

---

### STEP 11: Email Notifications ⏱️ 1 day

**Goal**: Send invitation emails

**Email Templates**:
1. Collaboration invite
2. Message notification (optional)
3. Route update digest (optional)

**Implementation**:
\`\`\`javascript
const sendCollaborationInvite = async (email, inviterName, routeName, routeUrl) => {
  // Use existing email service
  await sendEmail({
    to: email,
    subject: \`\${inviterName} invited you to plan a trip together\`,
    html: \`
      <h2>You've been invited!</h2>
      <p>\${inviterName} wants you to help plan: \${routeName}</p>
      <a href="\${routeUrl}">View Trip</a>
    \`
  });
};
\`\`\`

---

### STEP 12: Testing & QA ⏱️ 2 days

**Unit Tests**:
- CollaborationService methods
- Permission checking logic
- Message broadcasting

**Integration Tests**:
\`\`\`javascript
describe('Collaboration', () => {
  test('User can invite collaborator', async () => {
    const response = await request(app)
      .post('/api/routes/ROUTE_ID/collaborators')
      .send({ email: 'test@example.com', role: 'editor' })
      .expect(200);
  });
  
  test('Viewer cannot edit route', async () => {
    // Test permission system
  });
});
\`\`\`

**Manual Testing Checklist**:
- [ ] Invite flow works end-to-end
- [ ] Chat messages appear instantly
- [ ] Typing indicators work
- [ ] Presence dots update correctly
- [ ] Permission system enforced
- [ ] Reconnection works after disconnect
- [ ] Multiple users can edit simultaneously
- [ ] Mobile responsive

---

### STEP 13: Deployment ⏱️ 1 day

**Pre-deployment**:
- [ ] Run migration on Heroku Postgres
- [ ] Test WebSocket on Heroku
- [ ] Configure environment variables
- [ ] Update CORS settings

**Migration Command**:
\`\`\`bash
# Connect to Heroku Postgres
heroku pg:psql -a rdtrip

# Run migration
\\i db/migrations/010_add_collaboration.sql
\`\`\`

**Heroku WebSocket Config**:
- Heroku supports WebSocket by default
- No special dyno types needed
- Verify with \`wscat -c wss://rdtrip.herokuapp.com/ws/collab?token=TOKEN\`

**Deployment**:
\`\`\`bash
git add .
git commit -m "Phase 2: Add collaborative trip planning"
git push origin main
git push heroku main
\`\`\`

**Post-deployment Monitoring**:
- [ ] Check WebSocket connection count
- [ ] Monitor latency in Heroku metrics
- [ ] Test with real users
- [ ] Monitor error logs

---

## 🧪 Testing Strategy

### Manual Testing

**Scenario 1: Basic Collaboration**
1. User A creates route
2. User A invites User B as editor
3. User B accepts invitation
4. Both users can see each other in collaborators list
5. User A sends chat message → User B sees it instantly

**Scenario 2: Real-time Updates**  
1. User A adds stop
2. User B sees update notification
3. User B's route refreshes automatically

**Scenario 3: Permission System**
1. User A invites User C as viewer
2. User C can see route but cannot edit
3. API returns 403 when User C tries to edit

### Load Testing

\`\`\`bash
# Test WebSocket connections
npm install -g artillery
artillery quick --count 100 --num 10 wss://localhost:3001/ws/collab
\`\`\`

---

## 📈 Success Metrics

**Technical**:
- WebSocket uptime: > 95%
- Message latency: < 200ms
- Reconnection rate: > 98%

**Product**:
- % trips with 2+ collaborators: > 50%
- Avg messages per trip: > 15
- Invitation acceptance: > 70%

---

## 🚀 Launch Plan

### Soft Launch (Week 1)
- Enable for 10% of users
- Monitor metrics closely
- Collect feedback

### Full Launch (Week 2)
- Enable for all users
- Announce via email
- Blog post about collaboration

### Post-Launch
- Monitor adoption
- Fix bugs quickly
- Plan Phase 2.1 enhancements

---

## 🐛 Known Issues & Limitations

**V1 Limitations**:
- No message editing
- No file attachments
- No message search
- No offline queue
- Max 20 collaborators per route

**Future** (Phase 2.1):
- Video calls
- Screen sharing
- Voting system
- Calendar integration

---

## 📚 Resources

- [Feature Roadmap](./FEATURE_ROADMAP_2025.md#feature-2)
- [WebSocket Docs](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [\`ws\` npm package](https://github.com/websockets/ws)

---

**Ready to implement! Let's build collaborative trip planning! 🚀**

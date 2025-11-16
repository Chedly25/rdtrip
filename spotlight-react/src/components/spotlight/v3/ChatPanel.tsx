/**
 * ChatPanel - Real-time Collaboration Chat
 * Phase 1: Chat tab content
 *
 * Preserves existing CollaborationPanel features:
 * - Real-time messages via WebSocket
 * - Typing indicators
 * - User presence
 * - @mentions
 * - Invite collaborators
 */

import { CollaborationPanel } from '../../collaboration/CollaborationPanel';

interface ChatPanelProps {
  routeId: string | null;
  userId?: string;
}

const ChatPanel = ({ routeId, userId }: ChatPanelProps) => {
  if (!routeId || !userId) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-center">
        <div>
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-lg font-semibold mb-2">Collaboration Unavailable</h3>
          <p className="text-sm text-gray-600">Save your trip to enable chat</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white">
      <CollaborationPanel
        routeId={routeId}
        currentUserId={userId}
        onInviteClick={() => { /* TODO: Open invite modal */ }}
      />
    </div>
  );
};

export default ChatPanel;

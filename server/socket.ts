import { Server, Socket } from 'socket.io';

type SocketUserMap = Map<string, { userId: string; workspaceId: string }>;
type JoinAckData = { success: boolean; activeUsers: string[]; error?: string };

export function setupSocketServer(io: Server) {
  const workspaceUsers: Map<string, Map<string, Set<string>>> = new Map(); // workspace -> userId -> socketIds
  const socketToUser: SocketUserMap = new Map();
  const presenceTimestamps: Map<string, number> = new Map(); // workspaceId -> last update timestamp

  // Helper: broadcast presence with deduplication
  const broadcastPresence = (workspaceId: string) => {
    const now = Date.now();
    const lastUpdate = presenceTimestamps.get(workspaceId) || 0;
    
    // Only emit if enough time has passed (debounce rapid updates)
    if (now - lastUpdate < 100) return;
    
    presenceTimestamps.set(workspaceId, now);
    const uniqueUsers = Array.from(workspaceUsers.get(workspaceId)?.keys() || []);
    io.to(workspaceId).emit('presence-update', {
      activeUsers: uniqueUsers,
      timestamp: now
    });
  };

  io.on('connection', (socket: Socket) => {
    console.log('A user connected:', socket.id);

    // Rejoin previous workspace on reconnect
    socket.on('reconnect', () => {
      const userInfo = socketToUser.get(socket.id);
      if (userInfo) {
        const { workspaceId, userId } = userInfo;
        socket.join(workspaceId);
        console.log(`User ${userId} rejoined workspace ${workspaceId} after reconnect`);
        broadcastPresence(workspaceId);
      }
    });

    socket.on('join-workspace', ({ workspaceId, userId }, callback: (data: JoinAckData) => void) => {
      try {
        // Validate inputs
        if (!workspaceId || !userId) {
          const err = { success: false, activeUsers: [], error: 'Missing workspaceId or userId' };
          callback?.(err);
          return;
        }

        socket.join(workspaceId);

        if (!workspaceUsers.has(workspaceId)) {
          workspaceUsers.set(workspaceId, new Map());
        }

        const userMap = workspaceUsers.get(workspaceId)!;
        if (!userMap.has(userId)) {
          userMap.set(userId, new Set());
        }
        userMap.get(userId)?.add(socket.id);
        socketToUser.set(socket.id, { userId, workspaceId });

        const uniqueUsers = Array.from(workspaceUsers.get(workspaceId)?.keys() || []);
        
        // Acknowledge join with current active users
        callback?.({ success: true, activeUsers: uniqueUsers });
        
        // Broadcast presence update
        broadcastPresence(workspaceId);

        console.log(`User ${userId} joined workspace ${workspaceId}`);
      } catch (error) {
        console.error('Error in join-workspace:', error);
        callback?.({ success: false, activeUsers: [], error: String(error) });
      }
    });

    socket.on('cursor-move', (data: any, callback?: (ack: boolean) => void) => {
      try {
        if (!data?.workspaceId) {
          callback?.(false);
          return;
        }
        
        // Forward cursor only to others in workspace (not sender)
        socket.to(data.workspaceId).emit('cursor-update', {
          ...data,
          timestamp: Date.now()
        });
        
        callback?.(true);
      } catch (error) {
        console.error('Error in cursor-move:', error);
        callback?.(false);
      }
    });

    socket.on('leave-workspace', ({ workspaceId, userId }) => {
      try {
        if (!workspaceId || !userId) return;

        socket.leave(workspaceId);
        workspaceUsers.get(workspaceId)?.get(userId)?.delete(socket.id);
        
        if (workspaceUsers.get(workspaceId)?.get(userId)?.size === 0) {
          workspaceUsers.get(workspaceId)?.delete(userId);
        }

        // Broadcast updated presence only if this was the last socket for user
        broadcastPresence(workspaceId);
        console.log(`User ${userId} left workspace ${workspaceId}`);
      } catch (error) {
        console.error('Error in leave-workspace:', error);
      }
    });

    socket.on('disconnect', () => {
      const userInfo = socketToUser.get(socket.id);

      if (userInfo) {
        const { userId, workspaceId } = userInfo;
        workspaceUsers.get(workspaceId)?.get(userId)?.delete(socket.id);
        if (workspaceUsers.get(workspaceId)?.get(userId)?.size === 0) {
          workspaceUsers.get(workspaceId)?.delete(userId);
        }
        socketToUser.delete(socket.id);

        // Only broadcast if this was the last socket for this user
        broadcastPresence(workspaceId);
        console.log(`User ${userId} left workspace ${workspaceId}`);
      }

      console.log('User disconnected:', socket.id);
    });

    // Handle connection errors
    socket.on('error', (error: any) => {
      console.error('Socket error:', socket.id, error);
    });
  });
}
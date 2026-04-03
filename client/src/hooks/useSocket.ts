import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { useAuthStore } from '../store/useAuthStore';
import { setGlobalSocket } from '../services/socket';

type PresenceUpdate = {
  activeUsers: string[];
  timestamp: number;
};

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const previousWorkspaceRef = useRef<string | null>(null);
  const { activeWorkspace, addOrUpdateMember, members } = useWorkspaceStore();
  const { user } = useAuthStore();
  const lastPresenceRef = useRef<number>(0);

  useEffect(() => {
    if (!activeWorkspace || !user) return;

    // Handle workspace change: leave old room before joining new one
    if (socketRef.current && previousWorkspaceRef.current && previousWorkspaceRef.current !== activeWorkspace.id) {
      console.log(`Leaving workspace ${previousWorkspaceRef.current}, joining ${activeWorkspace.id}`);
      socketRef.current.emit('leave-workspace', { workspaceId: previousWorkspaceRef.current, userId: user.uid });
    }

    // Initialize socket connection once
    if (!socketRef.current) {
      const socket = io({
        reconnection: true,
        reconnectionDelay: 100,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 10,
        transports: ['websocket', 'polling'],
      });

      socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
        setGlobalSocket(socket);

        // Join workspace with acknowledgement
        socket.emit(
          'join-workspace',
          { workspaceId: activeWorkspace.id, userId: user.uid },
          (ack: any) => {
            if (ack?.success) {
              console.log('Successfully joined workspace', ack.activeUsers);
              updateMemberOnlineStatus(ack.activeUsers);
            } else {
              console.error('Failed to join workspace:', ack?.error);
            }
          }
        );
      });

      socket.on('connect_error', (error) => {
        console.warn('Socket connection error:', error);
      });

      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setGlobalSocket(null);
        // Mark all members as offline on disconnect
        members.forEach((m) => {
          if (m.isOnline) {
            addOrUpdateMember({ ...m, isOnline: false });
          }
        });
      });

      // Listen for presence updates with deduplication
      socket.on('presence-update', (data: PresenceUpdate) => {
        const now = Date.now();
        
        // Skip if we just processed a presence update (debounce)
        if (now - lastPresenceRef.current < 50) return;
        lastPresenceRef.current = now;

        updateMemberOnlineStatus(data.activeUsers);
      });

      // Listen for cursor updates
      socket.on('cursor-update', (data) => {
        // Could be used for real-time cursors if UI component needs it
        console.debug('Cursor update from', data.userId);
      });

      socketRef.current = socket;
    } else if (previousWorkspaceRef.current !== activeWorkspace.id) {
      // If socket exists but workspace changed, join the new workspace
      socketRef.current.emit(
        'join-workspace',
        { workspaceId: activeWorkspace.id, userId: user.uid },
        (ack: any) => {
          if (ack?.success) {
            console.log('Successfully joined new workspace', ack.activeUsers);
            updateMemberOnlineStatus(ack.activeUsers);
          } else {
            console.error('Failed to join new workspace:', ack?.error);
          }
        }
      );
    }

    // Track current workspace for next transition
    previousWorkspaceRef.current = activeWorkspace.id;

    // Cleanup on unmount or workspace change
    return () => {
      // Don't disconnect socket on unmount - keep connection alive for multi-tab
      // Socket will handle workspace transitions via join-workspace events
    };
  }, [activeWorkspace?.id, user?.uid, addOrUpdateMember, members]);

  // Update member online status based on active users list (preserve other member data)
  const updateMemberOnlineStatus = (activeUserIds: string[]) => {
    const activeSet = new Set(activeUserIds);
    members.forEach((member) => {
      const shouldBeOnline = activeSet.has(member.uid);
      if (member.isOnline !== shouldBeOnline) {
        // Only update if status changed to reduce store thrashing
        addOrUpdateMember({ ...member, isOnline: shouldBeOnline });
      }
    });
  };

  // Return socket instance for direct use if needed
  return socketRef.current;
}

// Helper to emit events with optional callback
export function emitWithAck<T = any>(
  socket: Socket | null,
  event: string,
  data: any,
  timeout = 5000
): Promise<T> {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject(new Error('Socket not connected'));
      return;
    }

    const timer = setTimeout(() => {
      reject(new Error(`[${event}] timeout after ${timeout}ms`));
    }, timeout);

    socket.emit(event, data, (ack: T) => {
      clearTimeout(timer);
      resolve(ack);
    });
  });
}

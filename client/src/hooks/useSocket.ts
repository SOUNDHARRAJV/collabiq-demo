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
  const { activeWorkspace, addOrUpdateMember, members, setActiveUserIds } = useWorkspaceStore();
  const { user } = useAuthStore();
  const lastPresenceRef = useRef<number>(0);
  const membersRef = useRef(members);
  const addOrUpdateMemberRef = useRef(addOrUpdateMember);
  const lastActiveUsersRef = useRef<string[]>([]);

  useEffect(() => {
    membersRef.current = members;
    addOrUpdateMemberRef.current = addOrUpdateMember;
  }, [members, addOrUpdateMember]);

  useEffect(() => {
    if (!activeWorkspace || !user) {
      console.log('[Trace][Socket] skip connect', { hasWorkspace: !!activeWorkspace, hasUser: !!user });
      setActiveUserIds([]);
      return;
    }

    console.log('[Trace][Socket] effect start', { workspaceId: activeWorkspace.id, userId: user.uid });

    // Handle workspace change: leave old room before joining new one
    if (socketRef.current && previousWorkspaceRef.current && previousWorkspaceRef.current !== activeWorkspace.id) {
      console.log('[Trace][Socket] leave-workspace emit', { from: previousWorkspaceRef.current, to: activeWorkspace.id, userId: user.uid });
      socketRef.current.emit('leave-workspace', { workspaceId: previousWorkspaceRef.current, userId: user.uid });
    }

    // Initialize socket connection once
    if (!socketRef.current) {
      const socketUrl = import.meta.env.VITE_SOCKET_URL || undefined;
      const socket = io(socketUrl, {
        reconnection: true,
        reconnectionDelay: 100,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 10,
        transports: ['websocket', 'polling'],
      });

      socket.on('connect', () => {
        console.log('[Trace][Socket] connected', { socketId: socket.id });
        setGlobalSocket(socket);

        // Join workspace with acknowledgement
        console.log('[Trace][Socket] join-workspace emit', { workspaceId: activeWorkspace.id, userId: user.uid, reason: 'connect' });
        socket.emit(
          'join-workspace',
          { workspaceId: activeWorkspace.id, userId: user.uid },
          (ack: any) => {
            if (ack?.success) {
              console.log('[Trace][Socket] join-workspace ack success', { workspaceId: activeWorkspace.id, activeUsers: ack.activeUsers?.length ?? 0 });
              lastActiveUsersRef.current = Array.isArray(ack.activeUsers) ? ack.activeUsers : [];
              setActiveUserIds(lastActiveUsersRef.current);
              updateMemberOnlineStatus(lastActiveUsersRef.current, 'join-ack');
            } else {
              console.error('[Trace][Socket] join-workspace ack error', ack?.error);
            }
          }
        );
      });

      socket.on('connect_error', (error) => {
        console.warn('[Trace][Socket] connect_error', error);
      });

      socket.on('disconnect', (reason) => {
        console.log('[Trace][Socket] disconnected', { reason });
        setGlobalSocket(null);
        setActiveUserIds([]);
        // Mark all members as offline on disconnect
        membersRef.current.forEach((m) => {
          if (m.isOnline) {
            addOrUpdateMemberRef.current({ ...m, isOnline: false });
          }
        });
      });

      // Listen for presence updates with deduplication
      socket.on('presence-update', (data: PresenceUpdate) => {
        const now = Date.now();
        
        // Skip if we just processed a presence update (debounce)
        if (now - lastPresenceRef.current < 50) return;
        lastPresenceRef.current = now;

        console.log('[Trace][Socket] presence-update received', { activeUsers: data.activeUsers.length, timestamp: data.timestamp });
        lastActiveUsersRef.current = Array.isArray(data.activeUsers) ? data.activeUsers : [];
        setActiveUserIds(lastActiveUsersRef.current);
        updateMemberOnlineStatus(lastActiveUsersRef.current, 'presence-update');
      });

      // Listen for cursor updates
      socket.on('cursor-update', (data) => {
        // Could be used for real-time cursors if UI component needs it
        console.debug('[Trace][Socket] cursor-update', { userId: data.userId });
      });

      socketRef.current = socket;
    } else if (previousWorkspaceRef.current !== activeWorkspace.id) {
      // If socket exists but workspace changed, join the new workspace
      console.log('[Trace][Socket] join-workspace emit', { workspaceId: activeWorkspace.id, userId: user.uid, reason: 'workspace-switch' });
      socketRef.current.emit(
        'join-workspace',
        { workspaceId: activeWorkspace.id, userId: user.uid },
        (ack: any) => {
          if (ack?.success) {
            console.log('[Trace][Socket] join-workspace (switch) ack success', { workspaceId: activeWorkspace.id, activeUsers: ack.activeUsers?.length ?? 0 });
            lastActiveUsersRef.current = Array.isArray(ack.activeUsers) ? ack.activeUsers : [];
            setActiveUserIds(lastActiveUsersRef.current);
            updateMemberOnlineStatus(lastActiveUsersRef.current, 'join-ack-switch');
          } else {
            console.error('[Trace][Socket] join-workspace (switch) ack error', ack?.error);
          }
        }
      );
    }

    // Track current workspace for next transition
    previousWorkspaceRef.current = activeWorkspace.id;

    // Cleanup on unmount or workspace change
    return () => {
      if (socketRef.current && activeWorkspace?.id && user?.uid) {
        console.log('[Trace][Socket] leave-workspace emit', { workspaceId: activeWorkspace.id, userId: user.uid, reason: 'cleanup' });
        socketRef.current.emit('leave-workspace', { workspaceId: activeWorkspace.id, userId: user.uid });
      }
    };
  }, [activeWorkspace?.id, user?.uid, setActiveUserIds]);

  useEffect(() => {
    if (!activeWorkspace || !user || lastActiveUsersRef.current.length === 0) return;
    console.log('[Trace][Socket] replay presence for hydrated members', {
      workspaceId: activeWorkspace.id,
      members: members.length,
      activeUsers: lastActiveUsersRef.current.length,
    });
    updateMemberOnlineStatus(lastActiveUsersRef.current, 'members-hydrated');
  }, [members, activeWorkspace?.id, user?.uid]);

  useEffect(() => {
    const onBeforeUnload = () => {
      if (socketRef.current && activeWorkspace?.id && user?.uid) {
        console.log('[Trace][Socket] leave-workspace emit', {
          workspaceId: activeWorkspace.id,
          userId: user.uid,
          reason: 'beforeunload',
        });
        socketRef.current.emit('leave-workspace', { workspaceId: activeWorkspace.id, userId: user.uid });
      }
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [activeWorkspace?.id, user?.uid]);

  // Update member online status based on active users list (preserve other member data)
  const updateMemberOnlineStatus = (activeUserIds: string[], source: string) => {
    const activeSet = new Set(activeUserIds);
    const currentMembers = membersRef.current;
    console.log('[Trace][Socket] updateMemberOnlineStatus', { source, incomingActiveUsers: activeUserIds.length, memberCount: currentMembers.length });
    currentMembers.forEach((member) => {
      const shouldBeOnline = activeSet.has(member.uid);
      if (member.isOnline !== shouldBeOnline) {
        console.log('[Trace][Socket] member status change', { uid: member.uid, from: member.isOnline ?? false, to: shouldBeOnline });
        // Only update if status changed to reduce store thrashing
        addOrUpdateMemberRef.current({ ...member, isOnline: shouldBeOnline });
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
      console.error('[Trace][Socket] emitWithAck blocked: no socket', { event });
      reject(new Error('Socket not connected'));
      return;
    }

    console.log('[Trace][Socket] emitWithAck start', { event, timeout });

    const timer = setTimeout(() => {
      console.error('[Trace][Socket] emitWithAck timeout', { event, timeout });
      reject(new Error(`[${event}] timeout after ${timeout}ms`));
    }, timeout);

    socket.emit(event, data, (ack: T) => {
      clearTimeout(timer);
      console.log('[Trace][Socket] emitWithAck ack', { event });
      resolve(ack);
    });
  });
}

import { Server, Socket } from 'socket.io';

type WorkspaceUserMap = Map<string, Set<string>>;
type SocketUserMap = Map<string, { userId: string; workspaceId: string }>;

export function setupSocketServer(io: Server) {
  const workspaceUsers: WorkspaceUserMap = new Map();
  const socketToUser: SocketUserMap = new Map();

  io.on('connection', (socket: Socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join-workspace', ({ workspaceId, userId }) => {
      socket.join(workspaceId);

      if (!workspaceUsers.has(workspaceId)) {
        workspaceUsers.set(workspaceId, new Set());
      }

      workspaceUsers.get(workspaceId)?.add(userId);
      socketToUser.set(socket.id, { userId, workspaceId });

      io.to(workspaceId).emit('presence-update', Array.from(workspaceUsers.get(workspaceId) || []));

      console.log(`User ${userId} joined workspace ${workspaceId}`);
    });

    socket.on('cursor-move', (data) => {
      socket.to(data.workspaceId).emit('cursor-update', data);
    });

    socket.on('disconnect', () => {
      const userInfo = socketToUser.get(socket.id);

      if (userInfo) {
        const { userId, workspaceId } = userInfo;
        workspaceUsers.get(workspaceId)?.delete(userId);
        socketToUser.delete(socket.id);

        io.to(workspaceId).emit('presence-update', Array.from(workspaceUsers.get(workspaceId) || []));
      }

      console.log('User disconnected:', socket.id);
    });
  });
}
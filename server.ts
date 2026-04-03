import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import { Server } from "socket.io";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import net from "net";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  const requestedPort = Number(process.env.PORT || 3000);

  const findAvailablePort = async (startPort: number) => {
    for (let port = startPort; port < startPort + 100; port += 1) {
      const isAvailable = await new Promise<boolean>((resolve) => {
        const tester = net.createServer();

        tester.once("error", () => resolve(false));
        tester.once("listening", () => {
          tester.close(() => resolve(true));
        });

        tester.listen(port, "0.0.0.0");
      });

      if (isAvailable) {
        return port;
      }
    }

    throw new Error(`No available port found starting from ${startPort}`);
  };

  const PORT = await findAvailablePort(requestedPort);

  // Socket.io for real-time presence and cursor tracking
  const workspaceUsers = new Map<string, Set<string>>();
  const socketToUser = new Map<string, { userId: string, workspaceId: string }>();

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("join-workspace", ({ workspaceId, userId }) => {
      socket.join(workspaceId);
      
      if (!workspaceUsers.has(workspaceId)) {
        workspaceUsers.set(workspaceId, new Set());
      }
      workspaceUsers.get(workspaceId)?.add(userId);
      socketToUser.set(socket.id, { userId, workspaceId });

      // Broadcast updated presence
      io.to(workspaceId).emit("presence-update", Array.from(workspaceUsers.get(workspaceId) || []));
      
      console.log(`User ${userId} joined workspace ${workspaceId}`);
    });

    socket.on("cursor-move", (data) => {
      socket.to(data.workspaceId).emit("cursor-update", data);
    });

    socket.on("disconnect", () => {
      const userInfo = socketToUser.get(socket.id);
      if (userInfo) {
        const { userId, workspaceId } = userInfo;
        workspaceUsers.get(workspaceId)?.delete(userId);
        socketToUser.delete(socket.id);
        
        // Broadcast updated presence
        io.to(workspaceId).emit("presence-update", Array.from(workspaceUsers.get(workspaceId) || []));
      }
      console.log("User disconnected:", socket.id);
    });
  });

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/auth/google/status", (req, res) => {
    res.json({
      hasGoogleClientId: Boolean(process.env.GOOGLE_CLIENT_ID),
      hasGoogleClientSecret: Boolean(process.env.GOOGLE_CLIENT_SECRET),
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  const PORT = 3000;

  // Socket.IO logic
  const users = new Map(); // uid -> socketId

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join", (uid) => {
      users.set(uid, socket.id);
      socket.join(uid);
      console.log(`User ${uid} joined`);
      io.emit("user_status", { uid, status: "online" });
    });

    socket.on("send_message", (data) => {
      // data: { from, to, content, type, timestamp }
      io.to(data.to).to(data.from).emit("new_message", data);
    });

    socket.on("typing", (data) => {
      // data: { from, to, isTyping }
      io.to(data.to).emit("user_typing", data);
    });

    socket.on("disconnect", () => {
      let disconnectedUid = null;
      for (const [uid, sid] of users.entries()) {
        if (sid === socket.id) {
          disconnectedUid = uid;
          users.delete(uid);
          break;
        }
      }
      if (disconnectedUid) {
        io.emit("user_status", { uid: disconnectedUid, status: "offline" });
      }
      console.log("User disconnected:", socket.id);
    });
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
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

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { initDB } from "./utility/db";
import { setupSocketHandlers } from "./sockets/socketHandler";
import { RoomManager } from "./models/RoomManager";

dotenv.config();

const app = express();
const server = http.createServer(app);

const rawClientUrl = process.env.CLIENT_URL || "*";
const CORS_ORIGIN = rawClientUrl === "*" ? "*" : rawClientUrl.replace(/\/+$/, "");

app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ["GET", "POST"],
  },
});

// Setup Socket.IO Event Handlers
setupSocketHandlers(io);

// Root & Health Check Endpoints for Railway
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "YouTube Watch Party API is running" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Room details API endpoint
app.get("/api/rooms/:code", (req, res) => {
  const roomManager = RoomManager.getInstance();
  const room = roomManager.getRoom(req.params.code);
  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }
  return res.json(room.toJSON());
});

const PORT = Number(process.env.PORT) || 5001;

server.listen(PORT, "0.0.0.0", () => {
  initDB().catch((err) => console.error("Database connection warning:", err));
  console.log(
    `🚀 YouTube Watch Party Server running on port ${PORT}`,
  );
});

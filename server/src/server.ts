import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { initDB, prisma } from "./utility/db";
import { setupSocketHandlers } from "./sockets/socketHandler";
import { RoomManager } from "./models/RoomManager";

dotenv.config();

const app = express();
const server = http.createServer(app);

const rawClientUrl = process.env.CLIENT_URL || "*";
const CORS_ORIGIN = rawClientUrl === "*" ? "*" : rawClientUrl.replace(/\/+$/, "");
const JWT_SECRET = process.env.JWT_SECRET || "syncbits_super_secret_jwt_key_2026";

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

// Root & Health Check Endpoints
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "syncbits Watch Party API is running" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Auth: Register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Email, password, and name are required." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return res.status(400).json({ error: "Email is already registered. Please sign in." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        password: hashedPassword,
        name: name.trim(),
      },
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ error: "Failed to register user." });
  }
});

// Auth: Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Failed to authenticate." });
  }
});

// Auth: Fetch Cross-Device User Rooms
app.get("/api/users/:userId/rooms", async (req, res) => {
  try {
    const { userId } = req.params;
    const participants = await prisma.participant.findMany({
      where: { userId },
      include: { room: true },
      orderBy: { joinedAt: "desc" },
      take: 10,
    });

    const roomsMap = new Map();
    participants.forEach((p) => {
      if (p.room && !roomsMap.has(p.room.code)) {
        roomsMap.set(p.room.code, {
          code: p.room.code,
          role: p.role === "HOST" ? "HOST" : "JOINED",
          joinedAt: new Date(p.joinedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });
      }
    });

    return res.json({ rooms: Array.from(roomsMap.values()) });
  } catch (error) {
    console.error("Fetch user rooms error:", error);
    return res.json({ rooms: [] });
  }
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
    `🚀 syncbits Watch Party Server running on port ${PORT}`,
  );
});

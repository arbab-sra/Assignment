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
const JWT_SECRET = process.env.JWT_SECRET || "syncbits_super_secret_jwt_key_2026";

const isAllowedOrigin = (origin?: string): boolean => {
  if (!origin) return true;
  if (rawClientUrl === "*") return true;
  const cleanOrigin = origin.replace(/\/+$/, "");
  const allowed = [
    "https://liveproject.fun",
    "https://assignment.arbab.fun",
    "http://localhost:3000",
    "http://localhost:5173",
  ];
  if (rawClientUrl && rawClientUrl !== "*") {
    allowed.push(rawClientUrl.replace(/\/+$/, ""));
  }
  return allowed.includes(cleanOrigin);
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

interface AuthRequest extends express.Request {
  user?: { userId: string; email: string; name: string };
}

const authenticateJWT = (
  req: AuthRequest,
  res: express.Response,
  next: express.NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Access denied. Bearer token required." });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      name: string;
    };
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token." });
  }
};

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

// Auth: Fetch Cross-Device User Rooms (Protected by Bearer Token)
app.get("/api/users/:userId/rooms", authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    if (req.user?.userId !== userId) {
      return res
        .status(403)
        .json({ error: "Access denied: You can only query your own room history." });
    }

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
          joinedAt: new Date(p.joinedAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        });
      }
    });

    return res.json({ rooms: Array.from(roomsMap.values()) });
  } catch (error) {
    console.error("[Fetch user rooms error]", error);
    return res.json({ rooms: [] });
  }
});

// Room details API endpoint (With Database Re-hydration Fallback)
app.get("/api/rooms/:code", async (req, res) => {
  try {
    const roomManager = RoomManager.getInstance();
    const room = await roomManager.getOrCreateRoom(req.params.code);
    return res.json(room.toJSON());
  } catch (error) {
    console.error("[GET /api/rooms/:code Error]", error);
    return res.status(404).json({ error: "Room not found" });
  }
});

const PORT = Number(process.env.PORT) || 5001;

server.listen(PORT, "0.0.0.0", () => {
  initDB().catch((err) => console.error("Database connection warning:", err));
  console.log(
    `🚀 syncbits Watch Party Server running on port ${PORT}`,
  );
});

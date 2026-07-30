"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./utility/db");
const socketHandler_1 = require("./sockets/socketHandler");
const RoomManager_1 = require("./models/RoomManager");
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const rawClientUrl = process.env.CLIENT_URL || "*";
const CORS_ORIGIN = rawClientUrl === "*" ? "*" : rawClientUrl.replace(/\/+$/, "");
app.use((0, cors_1.default)({ origin: CORS_ORIGIN, credentials: true }));
app.use(express_1.default.json());
const io = new socket_io_1.Server(server, {
    cors: {
        origin: CORS_ORIGIN,
        methods: ["GET", "POST"],
    },
});
// Setup Socket.IO Event Handlers
(0, socketHandler_1.setupSocketHandlers)(io);
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});
// Room details API endpoint
app.get("/api/rooms/:code", (req, res) => {
    const roomManager = RoomManager_1.RoomManager.getInstance();
    const room = roomManager.getRoom(req.params.code);
    if (!room) {
        return res.status(404).json({ error: "Room not found" });
    }
    return res.json(room.toJSON());
});
const PORT = process.env.PORT || 5001;
server.listen(PORT, async () => {
    await (0, db_1.initDB)();
    console.log(`🚀 YouTube Watch Party Server running on http://localhost:${PORT}`);
});

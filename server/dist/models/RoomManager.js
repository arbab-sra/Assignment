"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomManager = void 0;
const Room_1 = require("./Room");
const db_1 = require("../utility/db");
class RoomManager {
    static instance;
    rooms = new Map(); // Room Code -> Room instance
    constructor() { }
    static getInstance() {
        if (!RoomManager.instance) {
            RoomManager.instance = new RoomManager();
        }
        return RoomManager.instance;
    }
    // Create a new room
    async createRoom(roomName = "Watch Party Room", customCode) {
        const code = customCode || Math.random().toString(36).substring(2, 8).toUpperCase();
        const room = new Room_1.Room(code, roomName);
        this.rooms.set(code, room);
        // Save to DB asynchronously if DB connected
        try {
            await db_1.prisma.room.create({
                data: {
                    code,
                    name: roomName,
                    videoId: room.videoId,
                    currentTime: room.currentTime,
                    isPlaying: room.isPlaying,
                },
            });
        }
        catch (e) {
            // Ignored if DB is offline
        }
        return room;
    }
    // Get room by code
    getRoom(code) {
        return this.rooms.get(code.toUpperCase());
    }
    // Get or create room
    async getOrCreateRoom(code) {
        const uppercaseCode = code.toUpperCase();
        let room = this.getRoom(uppercaseCode);
        if (!room) {
            room = await this.createRoom("Watch Party Room", uppercaseCode);
        }
        return room;
    }
    // Find room containing socket ID
    findRoomBySocketId(socketId) {
        for (const room of this.rooms.values()) {
            if (room.participants.has(socketId)) {
                return room;
            }
        }
        return undefined;
    }
    // Delete empty rooms after delay if needed
    removeRoom(code) {
        this.rooms.delete(code.toUpperCase());
    }
}
exports.RoomManager = RoomManager;

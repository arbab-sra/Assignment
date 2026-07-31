import { Room } from "./Room";
import { prisma } from "../utility/db";

export class RoomManager {
  private static instance: RoomManager;
  private rooms: Map<string, Room> = new Map(); // Room Code -> Room instance

  private constructor() {}

  public static getInstance(): RoomManager {
    if (!RoomManager.instance) {
      RoomManager.instance = new RoomManager();
    }
    return RoomManager.instance;
  }

  // Create a new room
  public async createRoom(
    roomName: string = "Watch Party Room",
    customCode?: string,
  ): Promise<Room> {
    const code =
      customCode || Math.random().toString(36).substring(2, 8).toUpperCase();
    const room = new Room(code, roomName);
    this.rooms.set(code, room);

    // Save to DB asynchronously if DB connected
    try {
      await prisma.room.create({
        data: {
          code,
          name: roomName,
          videoId: room.videoId,
          currentTime: room.currentTime,
          isPlaying: room.isPlaying,
        },
      });
    } catch (e) {
      // Ignored if DB is offline
    }

    return room;
  }

  // Get room by code
  public getRoom(code: string): Room | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  // Get or create room
  public async getOrCreateRoom(code: string): Promise<Room> {
    const uppercaseCode = code.toUpperCase();
    let room = this.getRoom(uppercaseCode);
    if (!room) {
      try {
        const dbRoom = await prisma.room.findUnique({
          where: { code: uppercaseCode },
        });

        if (dbRoom) {
          room = new Room(dbRoom.code, dbRoom.name);
          room.videoId = dbRoom.videoId;
          room.currentTime = dbRoom.currentTime;
          room.isPlaying = dbRoom.isPlaying;
          this.rooms.set(dbRoom.code, room);
          return room;
        }
      } catch (e) {
        // Fallback to in-memory creation if DB is unavailable
      }

      room = await this.createRoom("Party Room", uppercaseCode);
    }
    return room;
  }

  // Find room containing socket ID
  public findRoomBySocketId(socketId: string): Room | undefined {
    for (const room of this.rooms.values()) {
      if (room.participants.has(socketId)) {
        return room;
      }
    }
    return undefined;
  }

  // Delete empty rooms after delay if needed
  public removeRoom(code: string): void {
    this.rooms.delete(code.toUpperCase());
  }
}

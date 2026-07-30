import { Server, Socket } from "socket.io";
import { RoomManager } from "../models/RoomManager";
import { Participant } from "../models/Participant";
import { Role } from "../utility/types";
import { prisma } from "../utility/db";

export function setupSocketHandlers(io: Server) {
  const roomManager = RoomManager.getInstance();

  io.on("connection", (socket: Socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // 1. Join Room
    socket.on(
      "join_room",
      async ({ roomId, username }: { roomId: string; username: string }) => {
        const code = (roomId || "default").toUpperCase();
        const room = await roomManager.getOrCreateRoom(code);

        // Create new participant instance
        const participant = new Participant(
          socket.id,
          username || `User_${socket.id.substring(0, 4)}`,
        );
        room.addParticipant(participant);

        // Save Participant to DB asynchronously
        try {
          const dbRoom = await prisma.room.findUnique({ where: { code: room.code } });
          if (dbRoom) {
            await prisma.participant.create({
              data: {
                socketId: participant.socketId,
                username: participant.username,
                role: participant.role,
                roomId: dbRoom.id,
              },
            });
          }
        } catch (e) {
          // Fallback if DB is unavailable
        }

        // Join socket.io channel
        socket.join(room.code);

        console.log(
          `👤 ${participant.username} joined room [${room.code}] as ${participant.role}`,
        );

        // Send initial room snapshot & sync state to joiner
        socket.emit("room_state", room.toJSON());

        // Broadcast user_joined to all other participants in the room
        io.to(room.code).emit("user_joined", {
          username: participant.username,
          userId: participant.id,
          role: participant.role,
          participants: Array.from(room.participants.values()).map((p) =>
            p.toJSON(),
          ),
        });
      },
    );

    // 2. Leave Room
    socket.on("leave_room", () => {
      handleUserDisconnect(socket);
    });

    // 3. Play Video
    socket.on("play", ({ currentTime }: { currentTime?: number }) => {
      const room = roomManager.findRoomBySocketId(socket.id);
      if (!room) return;

      if (!room.canUserControl(socket.id)) {
        return socket.emit(
          "error_message",
          "Permission denied: Only Host or Moderator can control playback.",
        );
      }

      room.updateVideoState(undefined, currentTime, true);
      const payload = {
        currentTime: room.currentTime,
        isPlaying: true,
        serverTimestamp: Date.now(),
        senderSocketId: socket.id,
      };

      // Broadcast to participants immediately without echoing back to acting host
      socket.broadcast.to(room.code).emit("play", payload);
    });

    // 4. Pause Video
    socket.on("pause", ({ currentTime }: { currentTime?: number }) => {
      const room = roomManager.findRoomBySocketId(socket.id);
      if (!room) return;

      if (!room.canUserControl(socket.id)) {
        return socket.emit(
          "error_message",
          "Permission denied: Only Host or Moderator can control playback.",
        );
      }

      room.updateVideoState(undefined, currentTime, false);
      const payload = {
        currentTime: room.currentTime,
        isPlaying: false,
        serverTimestamp: Date.now(),
        senderSocketId: socket.id,
      };

      socket.broadcast.to(room.code).emit("pause", payload);
    });

    // 5. Seek Video
    socket.on("seek", ({ time }: { time: number }) => {
      const room = roomManager.findRoomBySocketId(socket.id);
      if (!room) return;

      if (!room.canUserControl(socket.id)) {
        return socket.emit(
          "error_message",
          "Permission denied: Only Host or Moderator can seek.",
        );
      }

      room.updateVideoState(undefined, time, undefined);
      const payload = {
        currentTime: room.currentTime,
        isPlaying: room.isPlaying,
        serverTimestamp: Date.now(),
        senderSocketId: socket.id,
      };

      socket.broadcast.to(room.code).emit("seek", payload);
    });

    // 6. Change Video
    socket.on("change_video", ({ videoId }: { videoId: string }) => {
      const room = roomManager.findRoomBySocketId(socket.id);
      if (!room) return;

      if (!room.canUserControl(socket.id)) {
        return socket.emit(
          "error_message",
          "Permission denied: Only Host or Moderator can change video.",
        );
      }

      // Extract and validate video ID from URL or input
      const extractedId = parseYouTubeVideoId(videoId);
      if (!extractedId) {
        return socket.emit(
          "error_message",
          "Invalid YouTube URL or Video ID. Please provide a valid YouTube link.",
        );
      }

      // When video changes, reset room to PAUSED state at time 0 so all users cue up in sync
      room.updateVideoState(extractedId, 0, false);

      const payload = {
        videoId: room.videoId,
        currentTime: 0,
        isPlaying: false,
        serverTimestamp: Date.now(),
        senderSocketId: socket.id,
      };

      io.to(room.code).emit("change_video", payload);

      // System notification in chat
      const sysMsg = room.addChatMessage(
        "System",
        `Video changed to "${extractedId}"`,
      );
      io.to(room.code).emit("chat_message", sysMsg);
    });

    // 7. Request Sync (Participant-initiated manual sync)
    socket.on("request_sync", () => {
      const room = roomManager.findRoomBySocketId(socket.id);
      if (!room) return;

      const state = room.getVideoState();
      socket.emit("sync_state", {
        ...state,
        serverTimestamp: Date.now(),
        senderSocketId: "SERVER",
      });
    });

    // 8. Force Sync All (Host-initiated manual sync across room)
    socket.on("force_sync_all", () => {
      const room = roomManager.findRoomBySocketId(socket.id);
      if (!room) return;

      if (!room.canUserControl(socket.id)) {
        return socket.emit(
          "error_message",
          "Permission denied: Only Host or Moderator can force sync all.",
        );
      }

      const state = room.getVideoState();
      const payload = {
        ...state,
        serverTimestamp: Date.now(),
        senderSocketId: socket.id,
      };

      io.to(room.code).emit("sync_state", payload);

      const sysMsg = room.addChatMessage("System", "Host triggered a room-wide sync!");
      io.to(room.code).emit("chat_message", sysMsg);
    });

    // 7. Assign Role (Host only)
    socket.on(
      "assign_role",
      ({ targetSocketId, role }: { targetSocketId: string; role: Role }) => {
        const room = roomManager.findRoomBySocketId(socket.id);
        if (!room) return;

        const success = room.assignRole(targetSocketId, role, socket.id);
        if (!success) {
          return socket.emit(
            "error_message",
            "Permission denied: Only Host can assign roles.",
          );
        }

        const target = room.getParticipant(targetSocketId);
        io.to(room.code).emit("role_assigned", {
          userId: targetSocketId,
          username: target?.username,
          role: role,
          participants: Array.from(room.participants.values()).map((p) =>
            p.toJSON(),
          ),
        });
      },
    );

    // 8. Remove Participant (Host only)
    socket.on(
      "remove_participant",
      ({ targetSocketId }: { targetSocketId: string }) => {
        const room = roomManager.findRoomBySocketId(socket.id);
        if (!room) return;

        const target = room.getParticipant(targetSocketId);
        const success = room.removeUserByHost(targetSocketId, socket.id);

        if (!success) {
          return socket.emit(
            "error_message",
            "Permission denied: Only Host can remove participants.",
          );
        }

        // Notify target socket & force disconnect
        const targetSocket = io.sockets.sockets.get(targetSocketId);
        if (targetSocket) {
          targetSocket.emit(
            "kicked",
            "You have been removed from the room by the host.",
          );
          targetSocket.leave(room.code);
        }

        io.to(room.code).emit("participant_removed", {
          userId: targetSocketId,
          username: target?.username,
          participants: Array.from(room.participants.values()).map((p) =>
            p.toJSON(),
          ),
        });
      },
    );

    // 9. Chat Message
    socket.on("send_message", async ({ text }: { text: string }) => {
      const room = roomManager.findRoomBySocketId(socket.id);
      if (!room) return;

      const participant = room.getParticipant(socket.id);
      if (!participant) return;

      const msg = room.addChatMessage(participant.username, text);
      io.to(room.code).emit("chat_message", msg);

      // Save Chat Message to DB asynchronously
      try {
        const dbRoom = await prisma.room.findUnique({ where: { code: room.code } });
        if (dbRoom) {
          await prisma.chatMessage.create({
            data: {
              username: participant.username,
              text: text,
              roomId: dbRoom.id,
            },
          });
        }
      } catch (e) {
        // Fallback if DB unavailable
      }
    });

    // 10. Live Reaction
    socket.on("send_reaction", ({ emoji }: { emoji: string }) => {
      const room = roomManager.findRoomBySocketId(socket.id);
      if (!room) return;

      const participant = room.getParticipant(socket.id);
      if (!participant) return;

      io.to(room.code).emit("reaction", {
        username: participant.username,
        emoji,
      });
    });

    // Handle Disconnect
    socket.on("disconnect", () => {
      handleUserDisconnect(socket);
    });
  });

  async function handleUserDisconnect(socket: Socket) {
    const room = roomManager.findRoomBySocketId(socket.id);
    if (!room) return;

    const removedParticipant = room.removeParticipant(socket.id);
    if (removedParticipant) {
      console.log(`🚪 ${removedParticipant.username} left room [${room.code}]`);
      socket.leave(room.code);

      // Clean up Participant from DB asynchronously
      try {
        await prisma.participant.deleteMany({
          where: { socketId: socket.id },
        });
      } catch (e) {}

      io.to(room.code).emit("user_left", {
        username: removedParticipant.username,
        userId: socket.id,
        participants: Array.from(room.participants.values()).map((p) =>
          p.toJSON(),
        ),
      });
    }
  }

  // Helper to extract & validate 11-character YouTube video ID
  function parseYouTubeVideoId(urlOrId: string): string | null {
    if (!urlOrId) return null;
    const str = urlOrId.trim();

    // 1. Direct 11-character video ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(str)) {
      return str;
    }

    // 2. YouTube URL formats
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = str.match(regExp);
    if (match && match[2] && match[2].length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(match[2])) {
      return match[2];
    }

    return null;
  }
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Room = void 0;
class Room {
    id;
    code;
    name;
    videoId;
    currentTime;
    isPlaying;
    participants = new Map();
    chatMessages = [];
    lastUpdatedTimestamp = Date.now();
    constructor(code, name = "Watch Party Room", videoId = "dQw4w9WgXcQ", id) {
        this.id = id || code;
        this.code = code;
        this.name = name;
        this.videoId = videoId;
        this.currentTime = 0;
        this.isPlaying = false;
        this.lastUpdatedTimestamp = Date.now();
    }
    // Add participant to the room
    addParticipant(participant) {
        // If room is empty, first joiner automatically becomes HOST
        if (this.participants.size === 0) {
            participant.setRole("HOST");
        }
        this.participants.set(participant.socketId, participant);
        return participant;
    }
    // Remove participant by socket ID
    removeParticipant(socketId) {
        const participant = this.participants.get(socketId);
        if (!participant)
            return undefined;
        this.participants.delete(socketId);
        // If host left and participants remain, transfer Host to another user
        if (participant.role === "HOST" && this.participants.size > 0) {
            const nextParticipant = Array.from(this.participants.values())[0];
            nextParticipant.setRole("HOST");
        }
        return participant;
    }
    getParticipant(socketId) {
        return this.participants.get(socketId);
    }
    getHost() {
        return Array.from(this.participants.values()).find((p) => p.role === "HOST");
    }
    // Role management (Host only)
    assignRole(targetSocketId, newRole, requesterSocketId) {
        const requester = this.getParticipant(requesterSocketId);
        if (!requester || requester.role !== "HOST") {
            return false; // Only Host can assign roles
        }
        const target = this.getParticipant(targetSocketId);
        if (!target)
            return false;
        // If transferring host
        if (newRole === "HOST") {
            requester.setRole("MODERATOR"); // Demote old host to moderator
        }
        target.setRole(newRole);
        return true;
    }
    // Remove participant by Host
    removeUserByHost(targetSocketId, requesterSocketId) {
        const requester = this.getParticipant(requesterSocketId);
        if (!requester || requester.role !== "HOST") {
            return false; // Only Host can remove participants
        }
        return this.removeParticipant(targetSocketId) !== undefined;
    }
    // Check if requester has playback control permission (Host or Moderator)
    canUserControl(socketId) {
        const participant = this.getParticipant(socketId);
        return participant ? participant.hasControlPermission() : false;
    }
    // Update video state (requires Host or Moderator)
    updateVideoState(videoId, currentTime, isPlaying) {
        if (this.isPlaying && currentTime === undefined) {
            const elapsed = (Date.now() - this.lastUpdatedTimestamp) / 1000;
            this.currentTime += elapsed;
        }
        if (videoId !== undefined)
            this.videoId = videoId;
        if (currentTime !== undefined)
            this.currentTime = currentTime;
        if (isPlaying !== undefined)
            this.isPlaying = isPlaying;
        this.lastUpdatedTimestamp = Date.now();
    }
    // Add chat message
    addChatMessage(username, text) {
        const message = {
            id: Math.random().toString(36).substring(2, 9),
            username,
            text,
            timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            }),
        };
        this.chatMessages.push(message);
        // Keep last 100 messages
        if (this.chatMessages.length > 100) {
            this.chatMessages.shift();
        }
        return message;
    }
    getVideoState() {
        let current = this.currentTime;
        if (this.isPlaying) {
            const elapsed = (Date.now() - this.lastUpdatedTimestamp) / 1000;
            current += elapsed;
        }
        return {
            videoId: this.videoId,
            currentTime: current,
            isPlaying: this.isPlaying,
        };
    }
    toJSON() {
        return {
            id: this.id,
            code: this.code,
            name: this.name,
            videoState: this.getVideoState(),
            participants: Array.from(this.participants.values()).map((p) => p.toJSON()),
            chatMessages: this.chatMessages,
        };
    }
}
exports.Room = Room;

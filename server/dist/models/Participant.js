"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Participant = void 0;
class Participant {
    id;
    socketId;
    username;
    role;
    constructor(socketId, username, role = "PARTICIPANT", id) {
        this.id = id || socketId;
        this.socketId = socketId;
        this.username = username;
        this.role = role;
    }
    setRole(newRole) {
        this.role = newRole;
    }
    hasControlPermission() {
        return this.role === "HOST" || this.role === "MODERATOR";
    }
    toJSON() {
        return {
            id: this.id,
            socketId: this.socketId,
            username: this.username,
            role: this.role,
        };
    }
}
exports.Participant = Participant;

import { Participant } from "./Participant";
import { Role, VideoState, ChatMessageData, RoomData } from "../utility/types";

export class Room {
  public readonly id: string;
  public readonly code: string;
  public name: string;
  public videoId: string;
  public currentTime: number;
  public isPlaying: boolean;
  public participants: Map<string, Participant> = new Map();
  public chatMessages: ChatMessageData[] = [];

  public lastUpdatedTimestamp: number = Date.now();

  constructor(
    code: string,
    name: string = "Watch Party Room",
    videoId: string = "dQw4w9WgXcQ",
    id?: string,
  ) {
    this.id = id || code;
    this.code = code;
    this.name = name;
    this.videoId = videoId;
    this.currentTime = 0;
    this.isPlaying = false;
    this.lastUpdatedTimestamp = Date.now();
  }

  // Add participant to the room
  public addParticipant(participant: Participant): Participant {
    // If room is empty, first joiner automatically becomes HOST
    if (this.participants.size === 0) {
      participant.setRole("HOST");
    }
    this.participants.set(participant.socketId, participant);
    return participant;
  }

  // Remove participant by socket ID
  public removeParticipant(socketId: string): Participant | undefined {
    const participant = this.participants.get(socketId);
    if (!participant) return undefined;

    this.participants.delete(socketId);

    // If host left and participants remain, transfer Host to another user
    if (participant.role === "HOST" && this.participants.size > 0) {
      const nextParticipant = Array.from(this.participants.values())[0];
      nextParticipant.setRole("HOST");
    }

    return participant;
  }

  public getParticipant(socketId: string): Participant | undefined {
    return this.participants.get(socketId);
  }

  public getHost(): Participant | undefined {
    return Array.from(this.participants.values()).find(
      (p) => p.role === "HOST",
    );
  }

  // Role management (Host only)
  public assignRole(
    targetSocketId: string,
    newRole: Role,
    requesterSocketId: string,
  ): boolean {
    const requester = this.getParticipant(requesterSocketId);
    if (!requester || requester.role !== "HOST") {
      return false; // Only Host can assign roles
    }

    const target = this.getParticipant(targetSocketId);
    if (!target) return false;

    // If transferring host
    if (newRole === "HOST") {
      requester.setRole("MODERATOR"); // Demote old host to moderator
    }

    target.setRole(newRole);
    return true;
  }

  // Remove participant by Host
  public removeUserByHost(
    targetSocketId: string,
    requesterSocketId: string,
  ): boolean {
    const requester = this.getParticipant(requesterSocketId);
    if (!requester || requester.role !== "HOST") {
      return false; // Only Host can remove participants
    }

    return this.removeParticipant(targetSocketId) !== undefined;
  }

  // Check if requester has playback control permission (Host or Moderator)
  public canUserControl(socketId: string): boolean {
    const participant = this.getParticipant(socketId);
    return participant ? participant.hasControlPermission() : false;
  }

  // Update video state (requires Host or Moderator)
  public updateVideoState(
    videoId?: string,
    currentTime?: number,
    isPlaying?: boolean,
  ): void {
    if (this.isPlaying && currentTime === undefined) {
      const elapsed = (Date.now() - this.lastUpdatedTimestamp) / 1000;
      this.currentTime += elapsed;
    }
    if (videoId !== undefined) this.videoId = videoId;
    if (currentTime !== undefined) this.currentTime = currentTime;
    if (isPlaying !== undefined) this.isPlaying = isPlaying;
    this.lastUpdatedTimestamp = Date.now();
  }

  // Add chat message
  public addChatMessage(username: string, text: string): ChatMessageData {
    const message: ChatMessageData = {
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

  public getVideoState(): VideoState {
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

  public toJSON(): RoomData {
    return {
      id: this.id,
      code: this.code,
      name: this.name,
      videoState: this.getVideoState(),
      participants: Array.from(this.participants.values()).map((p) =>
        p.toJSON(),
      ),
      chatMessages: this.chatMessages,
    };
  }
}

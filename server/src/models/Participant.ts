import { Role, ParticipantData } from "../utility/types";

export class Participant {
  public readonly id: string;
  public readonly socketId: string;
  public readonly username: string;
  public role: Role;

  constructor(
    socketId: string,
    username: string,
    role: Role = "PARTICIPANT",
    id?: string,
  ) {
    this.id = id || socketId;
    this.socketId = socketId;
    this.username = username;
    this.role = role;
  }

  public setRole(newRole: Role): void {
    this.role = newRole;
  }

  public hasControlPermission(): boolean {
    return this.role === "HOST" || this.role === "MODERATOR";
  }

  public toJSON(): ParticipantData {
    return {
      id: this.id,
      socketId: this.socketId,
      username: this.username,
      role: this.role,
    };
  }
}

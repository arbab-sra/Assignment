export type Role = 'HOST' | 'MODERATOR' | 'PARTICIPANT';

export interface ParticipantData {
  id: string;
  socketId: string;
  username: string;
  role: Role;
}

export interface VideoState {
  videoId: string;
  currentTime: number;
  isPlaying: boolean;
}

export interface ChatMessageData {
  id: string;
  username: string;
  text: string;
  timestamp: string;
}

export interface RoomData {
  id: string;
  code: string;
  name: string;
  videoState: VideoState;
  participants: ParticipantData[];
  chatMessages: ChatMessageData[];
}

export interface ReactionData {
  username: string;
  emoji: string;
}

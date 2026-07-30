import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { socket } from './services/socket';
import { CreateJoinRoom } from './components/CreateJoinRoom';
import { YouTubePlayerComponent } from './components/YouTubePlayer';
import { ParticipantList } from './components/ParticipantList';
import { ChatBox } from './components/ChatBox';
import { RoomData, ParticipantData, VideoState, ChatMessageData, Role, ReactionData } from './types';
import { Video, LogOut, Radio } from 'lucide-react';

interface FloatingReaction extends ReactionData {
  id: string;
  left: number;
}

export const App: React.FC = () => {
  const [joined, setJoined] = useState(false);
  const [, setUsername] = useState('');
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Check URL search query for initial room code
  const queryRoomCode = new URLSearchParams(window.location.search).get('room') || '';

  // Setup Socket listeners
  useEffect(() => {
    socket.on('room_state', (data: RoomData) => {
      setRoomData(data);
      setJoined(true);
    });

    socket.on('user_joined', ({ participants }: { participants: ParticipantData[] }) => {
      setRoomData((prev) => (prev ? { ...prev, participants } : null));
    });

    socket.on('user_left', ({ participants }: { participants: ParticipantData[] }) => {
      setRoomData((prev) => (prev ? { ...prev, participants } : null));
    });

    socket.on('play', ({ currentTime, isPlaying }: { currentTime: number; isPlaying: boolean }) => {
      setRoomData((prev) =>
        prev
          ? {
              ...prev,
              videoState: { ...prev.videoState, currentTime, isPlaying },
            }
          : null
      );
    });

    socket.on('pause', ({ currentTime, isPlaying }: { currentTime: number; isPlaying: boolean }) => {
      setRoomData((prev) =>
        prev
          ? {
              ...prev,
              videoState: { ...prev.videoState, currentTime, isPlaying },
            }
          : null
      );
    });

    socket.on('seek', ({ time }: { time: number }) => {
      setRoomData((prev) =>
        prev
          ? {
              ...prev,
              videoState: { ...prev.videoState, currentTime: time },
            }
          : null
      );
    });

    socket.on('change_video', (videoState: VideoState) => {
      setRoomData((prev) => (prev ? { ...prev, videoState } : null));
    });

    socket.on('role_assigned', ({ participants }: { participants: ParticipantData[] }) => {
      setRoomData((prev) => (prev ? { ...prev, participants } : null));
    });

    socket.on('participant_removed', ({ participants }: { participants: ParticipantData[] }) => {
      setRoomData((prev) => (prev ? { ...prev, participants } : null));
    });

    socket.on('chat_message', (message: ChatMessageData) => {
      setRoomData((prev) =>
        prev ? { ...prev, chatMessages: [...prev.chatMessages, message] } : null
      );
    });

    socket.on('reaction', ({ username: reactorName, emoji }: ReactionData) => {
      // Trigger floating emoji animation
      const reaction: FloatingReaction = {
        id: Math.random().toString(36).substring(2, 9),
        username: reactorName,
        emoji,
        left: Math.random() * 70 + 15, // Random X position 15% to 85%
      };

      setFloatingReactions((prev) => [...prev, reaction]);
      setTimeout(() => {
        setFloatingReactions((prev) => prev.filter((r) => r.id !== reaction.id));
      }, 2000);

      // Trigger confetti on 🎉 or 🔥
      if (emoji === '🎉' || emoji === '🔥') {
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
      }
    });

    socket.on('kicked', (msg: string) => {
      alert(msg);
      setJoined(false);
      setRoomData(null);
      socket.disconnect();
    });

    socket.on('error_message', (msg: string) => {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 4000);
    });

    return () => {
      socket.off('room_state');
      socket.off('user_joined');
      socket.off('user_left');
      socket.off('play');
      socket.off('pause');
      socket.off('seek');
      socket.off('change_video');
      socket.off('role_assigned');
      socket.off('participant_removed');
      socket.off('chat_message');
      socket.off('reaction');
      socket.off('kicked');
      socket.off('error_message');
    };
  }, []);

  const handleJoinRoom = (name: string, code: string) => {
    setUsername(name);
    socket.connect();
    socket.emit('join_room', { roomId: code, username: name });
  };

  const handleLeaveRoom = () => {
    socket.emit('leave_room');
    socket.disconnect();
    setJoined(false);
    setRoomData(null);
  };

  // Find current user's role
  const currentUser = roomData?.participants.find((p) => p.socketId === socket.id);
  const currentRole: Role = currentUser?.role || 'PARTICIPANT';
  const canControl = currentRole === 'HOST' || currentRole === 'MODERATOR';

  if (!joined || !roomData) {
    return <CreateJoinRoom onJoinRoom={handleJoinRoom} defaultRoomCode={queryRoomCode} />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <header
        className="glass-panel"
        style={{
          borderRadius: 0,
          borderLeft: 'none',
          borderRight: 'none',
          borderTop: 'none',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Video size={20} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 800 }}>
              {roomData.name}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <Radio size={12} color="#10b981" /> Live Sync Connected
            </div>
          </div>
        </div>

        <button type="button" className="btn-secondary" onClick={handleLeaveRoom} style={{ padding: '8px 14px' }}>
          <LogOut size={16} /> Leave Party
        </button>
      </header>

      {/* Toast Error Alert */}
      {errorMsg && (
        <div
          style={{
            position: 'fixed',
            top: '80px',
            right: '24px',
            background: 'rgba(239, 68, 68, 0.9)',
            color: '#fff',
            padding: '12px 18px',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            fontSize: '13px',
            fontWeight: 600,
            zIndex: 1000,
          }}
        >
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Floating Reactions Overlay */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999, overflow: 'hidden' }}>
        {floatingReactions.map((r) => (
          <div
            key={r.id}
            className="floating-reaction"
            style={{ left: `${r.left}%`, bottom: '20%' }}
          >
            {r.emoji} <span style={{ fontSize: '12px', color: '#fff', fontWeight: 700 }}>{r.username}</span>
          </div>
        ))}
      </div>

      {/* Main Content Layout */}
      <main style={{ flex: 1, padding: '24px', maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 360px',
            gap: '24px',
            alignItems: 'start',
          }}
        >
          {/* Left Column: Video Player & Control Bar */}
          <div>
            <YouTubePlayerComponent
              videoState={roomData.videoState}
              canControl={canControl}
              onPlay={(time) => socket.emit('play', { currentTime: time })}
              onPause={(time) => socket.emit('pause', { currentTime: time })}
              onSeek={(time) => socket.emit('seek', { time })}
              onChangeVideo={(urlOrId) => socket.emit('change_video', { videoId: urlOrId })}
            />
          </div>

          {/* Right Column: Participants List & Live Chat */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <ParticipantList
              participants={roomData.participants}
              currentUserId={socket.id || ''}
              currentRole={currentRole}
              roomCode={roomData.code}
              onAssignRole={(targetSocketId, role) => socket.emit('assign_role', { targetSocketId, role })}
              onRemoveParticipant={(targetSocketId) => socket.emit('remove_participant', { targetSocketId })}
            />

            <ChatBox
              messages={roomData.chatMessages}
              onSendMessage={(text) => socket.emit('send_message', { text })}
              onSendReaction={(emoji) => socket.emit('send_reaction', { emoji })}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

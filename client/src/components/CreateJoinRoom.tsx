import React, { useState } from 'react';
import { Users, Sparkles, Video, ArrowRight } from 'lucide-react';

interface Props {
  onJoinRoom: (username: string, roomCode: string) => void;
  defaultRoomCode?: string;
}

export const CreateJoinRoom: React.FC<Props> = ({ onJoinRoom, defaultRoomCode = '' }) => {
  const [username, setUsername] = useState('');
  const [roomCode, setRoomCode] = useState(defaultRoomCode);
  const [mode, setMode] = useState<'JOIN' | 'CREATE'>('JOIN');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    let targetCode = roomCode.trim().toUpperCase();
    if (mode === 'CREATE') {
      targetCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    if (!targetCode) return;
    onJoinRoom(username.trim(), targetCode);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '24px'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '460px',
        width: '100%',
        padding: '36px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'var(--accent-gradient)',
            marginBottom: '16px',
            boxShadow: '0 8px 24px rgba(255, 51, 85, 0.4)'
          }}>
            <Video size={32} color="#fff" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', fontWeight: 800, marginBottom: '6px' }}>
            Watch<span style={{ color: 'var(--accent-red)' }}>Party</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Watch YouTube videos in real-time sync with friends
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'flex',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '12px',
          padding: '4px',
          marginBottom: '24px',
          border: '1px solid var(--glass-border)'
        }}>
          <button
            type="button"
            onClick={() => setMode('JOIN')}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              background: mode === 'JOIN' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              color: mode === 'JOIN' ? '#fff' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Join Room
          </button>
          <button
            type="button"
            onClick={() => setMode('CREATE')}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              background: mode === 'CREATE' ? 'var(--accent-gradient)' : 'transparent',
              color: mode === 'CREATE' ? '#fff' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Create Room
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Your Display Name
            </label>
            <input
              type="text"
              className="glass-input"
              style={{ width: '100%' }}
              placeholder="e.g. Alex"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          {mode === 'JOIN' && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Room Code
              </label>
              <input
                type="text"
                className="glass-input"
                style={{ width: '100%', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700 }}
                placeholder="e.g. PARTY1"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '14px',
              marginTop: '8px',
              fontSize: '15px'
            }}
          >
            {mode === 'CREATE' ? (
              <>
                <Sparkles size={18} /> Create & Host Watch Party
              </>
            ) : (
              <>
                <Users size={18} /> Join Watch Room <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
          Sync video playback • Assign participant roles • Live chat
        </div>
      </div>
    </div>
  );
};

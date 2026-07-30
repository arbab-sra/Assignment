import React from 'react';
import { Crown, Shield, User, UserX, Copy, Check } from 'lucide-react';
import { ParticipantData, Role } from '../types';

interface Props {
  participants: ParticipantData[];
  currentUserId: string;
  currentRole: Role;
  roomCode: string;
  onAssignRole: (targetSocketId: string, role: Role) => void;
  onRemoveParticipant: (targetSocketId: string) => void;
}

export const ParticipantList: React.FC<Props> = ({
  participants,
  currentUserId,
  currentRole,
  roomCode,
  onAssignRole,
  onRemoveParticipant,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}?room=${roomCode}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isHost = currentRole === 'HOST';

  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header & Share Room */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
            Room Participants ({participants.length})
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Code: <strong style={{ color: 'var(--text-primary)', letterSpacing: '1px' }}>{roomCode}</strong>
          </span>
        </div>

        <button
          type="button"
          className="btn-secondary"
          onClick={handleCopyLink}
          style={{ padding: '8px 12px', fontSize: '12px' }}
        >
          {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
      </div>

      {/* Participant List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
        {participants.map((p) => {
          const isSelf = p.socketId === currentUserId;

          return (
            <div
              key={p.socketId}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: '10px',
                background: isSelf ? 'rgba(121, 40, 202, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                border: isSelf ? '1px solid rgba(121, 40, 202, 0.3)' : '1px solid var(--glass-border)',
              }}
            >
              {/* Left: Username & Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {p.role === 'HOST' ? (
                  <Crown size={16} color="var(--role-host)" />
                ) : p.role === 'MODERATOR' ? (
                  <Shield size={16} color="var(--role-mod)" />
                ) : (
                  <User size={16} color="var(--role-user)" />
                )}

                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>
                    {p.username} {isSelf && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>(You)</span>}
                  </div>
                  <span
                    className={
                      p.role === 'HOST'
                        ? 'badge badge-host'
                        : p.role === 'MODERATOR'
                        ? 'badge badge-mod'
                        : 'badge badge-participant'
                    }
                  >
                    {p.role}
                  </span>
                </div>
              </div>

              {/* Right: Host Actions (Role Assign / Remove) */}
              {isHost && !isSelf && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <select
                    value={p.role}
                    onChange={(e) => onAssignRole(p.socketId, e.target.value as Role)}
                    style={{
                      background: 'rgba(0, 0, 0, 0.5)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '6px',
                      padding: '4px 6px',
                      fontSize: '11px',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="PARTICIPANT">Participant</option>
                    <option value="MODERATOR">Moderator</option>
                    <option value="HOST">Transfer Host</option>
                  </select>

                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => onRemoveParticipant(p.socketId)}
                    title="Remove user"
                  >
                    <UserX size={14} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

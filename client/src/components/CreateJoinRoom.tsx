import React, { useState, useEffect } from 'react';
import { Users, Sparkles, Video, ArrowRight, Loader2, Clock, Trash2, LogIn, UserCheck, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthModal } from './AuthModal';

interface Props {
  onJoinRoom: (username: string, roomCode: string, userId?: string) => void;
  defaultRoomCode?: string;
}

export interface RecentRoom {
  code: string;
  role: 'HOST' | 'JOINED';
  joinedAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5001';

export const CreateJoinRoom: React.FC<Props> = ({ onJoinRoom, defaultRoomCode = '' }) => {
  const [username, setUsername] = useState('');
  const [roomCode, setRoomCode] = useState(defaultRoomCode);
  const [mode, setMode] = useState<'JOIN' | 'CREATE'>('JOIN');
  const [isLoading, setIsLoading] = useState(false);
  const [recentRooms, setRecentRooms] = useState<RecentRoom[]>([]);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Load saved user & local/cloud recent rooms
  useEffect(() => {
    let localList: RecentRoom[] = [];
    try {
      // 1. Always load local recent rooms first
      const savedRooms = localStorage.getItem('watchparty_recent_rooms');
      if (savedRooms) {
        localList = JSON.parse(savedRooms) as RecentRoom[];
        setRecentRooms(localList);
      }

      // 2. Check saved auth user
      const savedAuth = localStorage.getItem('watchparty_auth_user');
      if (savedAuth) {
        const user: AuthUser = JSON.parse(savedAuth);
        setAuthUser(user);
        setUsername(user.name);
        fetchUserCloudRooms(user.id, localList);
      } else {
        const savedUser = localStorage.getItem('watchparty_saved_username');
        if (savedUser) setUsername(savedUser);
      }
    } catch (e) {
      console.warn('Could not read from localStorage:', e);
    }
  }, []);

  // Fetch cross-device rooms for authenticated user from PostgreSQL and merge
  const fetchUserCloudRooms = async (userId: string, currentLocal: RecentRoom[] = []) => {
    try {
      const token = localStorage.getItem('watchparty_auth_token') || '';
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${SERVER_URL}/api/users/${userId}/rooms`, { headers });
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          if (data.rooms && Array.isArray(data.rooms)) {
            const map = new Map<string, RecentRoom>();
            currentLocal.forEach((r) => map.set(r.code, r));
            data.rooms.forEach((r: RecentRoom) => {
              if (!map.has(r.code)) map.set(r.code, r);
            });
            const merged = Array.from(map.values()).slice(0, 5);
            setRecentRooms(merged);
            localStorage.setItem('watchparty_recent_rooms', JSON.stringify(merged));
          }
        }
      }
    } catch (e) {
      console.warn('Could not fetch cloud user rooms:', e);
    }
  };

  const handleLoginSuccess = (user: AuthUser) => {
    setAuthUser(user);
    setUsername(user.name);
    try {
      localStorage.setItem('watchparty_auth_user', JSON.stringify(user));
    } catch (e) {}
    fetchUserCloudRooms(user.id);
  };

  const handleSignOut = () => {
    setAuthUser(null);
    try {
      localStorage.removeItem('watchparty_auth_user');
      localStorage.removeItem('watchparty_auth_token');
    } catch (e) {}
    toast.success('Signed out. Switched to guest mode.');
  };

  // Save room to recent rooms history
  const saveToRecentRooms = (code: string, isHost: boolean) => {
    try {
      const raw = localStorage.getItem('watchparty_recent_rooms');
      const existing: RecentRoom[] = raw ? (JSON.parse(raw) as RecentRoom[]) : [];
      const filtered = existing.filter((r) => r.code !== code);
      const roleType: 'HOST' | 'JOINED' = isHost ? 'HOST' : 'JOINED';
      const updated: RecentRoom[] = [
        {
          code,
          role: roleType,
          joinedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        ...filtered,
      ].slice(0, 5);
      localStorage.setItem('watchparty_recent_rooms', JSON.stringify(updated));
      setRecentRooms(updated);
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || isLoading) return;

    let targetCode = roomCode.trim().toUpperCase();
    if (mode === 'CREATE') {
      targetCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    if (!targetCode) return;

    // Save username & recent room to localStorage
    try {
      localStorage.setItem('watchparty_saved_username', username.trim());
    } catch (e) {}
    saveToRecentRooms(targetCode, mode === 'CREATE');

    setIsLoading(true);
    onJoinRoom(username.trim(), targetCode, authUser?.id);
  };

  const handleRejoinRecent = (item: RecentRoom) => {
    const activeUsername = username.trim() || authUser?.name || localStorage.getItem('watchparty_saved_username') || '';
    if (!activeUsername.trim()) {
      toast.error('Please enter your display name first.');
      return;
    }
    setRoomCode(item.code);
    setMode('JOIN');
    saveToRecentRooms(item.code, false);
    setIsLoading(true);
    onJoinRoom(activeUsername.trim(), item.code, authUser?.id);
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "24px",
        position: "relative",
        background:
          "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(249, 115, 22, 0.25), transparent 70%), #000000",
        overflow: "hidden",
      }}
    >
      <div
        className="glass-panel"
        style={{
          maxWidth: "460px",
          width: "100%",
          padding: "36px",
          position: "relative",
          zIndex: 10,
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
        }}
      >
        {/* Auth Bar Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: "16px",
          }}
        >
          {authUser ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(180, 225, 235, 0.12)",
                padding: "4px 10px",
                borderRadius: "20px",
                border: "1px solid rgba(180, 225, 235, 0.25)",
              }}
            >
              <UserCheck size={14} color="var(--color-cyan)" />
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--color-cyan)",
                }}
              >
                {authUser.name}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  marginLeft: "4px",
                }}
                title="Sign Out"
              >
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(249, 232, 162, 0.15)",
                border: "1px solid rgba(249, 232, 162, 0.3)",
                color: "var(--color-yellow)",
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s ease",

              }}
            >
              <LogIn size={14} /> Sign In / Register
            </button>
          )}
        </div>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "64px",
              height: "64px",
              borderRadius: "18px",
              background: "var(--accent-gradient)",
              marginBottom: "16px",
              boxShadow: "0 8px 24px rgba(120, 164, 203, 0.4)",
            }}
          >
            <Video size={32} color="#090e17" />
          </div>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "30px",
              fontWeight: 800,
              marginBottom: "6px",
              letterSpacing: "-0.5px",
            }}
          >
            Watch<span style={{ color: "var(--color-yellow)" }}>Party</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            Real-time synchronized YouTube streaming with friends
          </p>
        </div>

        {/* Tab switcher */}
        <div
          style={{
            display: "flex",
            background: "rgba(9, 14, 23, 0.6)",
            borderRadius: "12px",
            padding: "4px",
            marginBottom: "24px",
            border: "1px solid var(--glass-border)",
          }}
        >
          <button
            type="button"
            onClick={() => setMode("JOIN")}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "8px",
              border: "none",
              background:
                mode === "JOIN" ? "rgba(180, 225, 235, 0.15)" : "transparent",
              color:
                mode === "JOIN" ? "var(--color-cyan)" : "var(--text-muted)",
              fontWeight: 700,
              fontSize: "14px",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            Join Room
          </button>
          <button
            type="button"
            onClick={() => setMode("CREATE")}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "8px",
              border: "none",
              background:
                mode === "CREATE" ? "var(--accent-gradient)" : "transparent",
              color: mode === "CREATE" ? "#090e17" : "var(--text-muted)",
              fontWeight: 700,
              fontSize: "14px",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            Create Room
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "20px" }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--text-secondary)",
                marginBottom: "8px",
              }}
            >
              Your Display Name
            </label>
            <input
              type="text"
              className="glass-input"
              style={{ width: "100%" }}
              placeholder="e.g. Alex"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          {mode === "JOIN" && (
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  marginBottom: "8px",
                }}
              >
                Room Code
              </label>
              <input
                type="text"
                className="glass-input"
                style={{
                  width: "100%",
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                  fontWeight: 700,
                }}
                placeholder="e.g. PARTY1"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary"
            style={{
              width: "100%",
              justifyContent: "center",
              padding: "14px",
              marginTop: "8px",
              fontSize: "15px",
              opacity: isLoading ? 0.75 : 1,
              cursor: isLoading ? "not-allowed" : "pointer",
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {mode === "CREATE" ? "Creating Room..." : "Joining Room..."}
              </>
            ) : mode === "CREATE" ? (
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

        {recentRooms.length > 0 && (
          <div
            style={{
              marginTop: "24px",
              paddingTop: "20px",
              borderTop: "1px solid var(--glass-border)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "12px",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Clock size={14} color="var(--color-cyan)" />{" "}
                {authUser ? "Your Cloud & Recent Rooms" : "Recent Rooms"}
              </span>
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.removeItem("watchparty_recent_rooms");
                  } catch (e) {}
                  setRecentRooms([]);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  fontSize: "11px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
                title="Clear recent rooms history"
              >
                <Trash2 size={12} /> Clear
              </button>
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {recentRooms.map((item) => (
                <div
                  key={item.code}
                  onClick={() => handleRejoinRecent(item)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    background: "rgba(9, 14, 23, 0.6)",
                    borderRadius: "10px",
                    border: "1px solid var(--glass-border)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  className="recent-room-item"
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontWeight: 800,
                        fontSize: "14px",
                        color: "var(--color-yellow)",
                        letterSpacing: "1px",
                      }}
                    >
                      {item.code}
                    </span>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: "4px",
                        background:
                          item.role === "HOST"
                            ? "rgba(249, 232, 162, 0.2)"
                            : "rgba(180, 225, 235, 0.2)",
                        color:
                          item.role === "HOST"
                            ? "var(--color-yellow)"
                            : "var(--color-cyan)",
                      }}
                    >
                      {item.role}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--color-cyan)",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    Rejoin <ArrowRight size={13} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div
          style={{
            marginTop: "24px",
            textAlign: "center",
            fontSize: "12px",
            color: "var(--text-muted)",
          }}
        >
          Sync video playback • Assign participant roles • Live chat
        </div>
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
};

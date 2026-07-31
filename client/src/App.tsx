import React, { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import toast, { Toaster } from "react-hot-toast";
import { socket } from "./services/socket";
import { CreateJoinRoom } from "./components/CreateJoinRoom";
import { YouTubePlayerComponent } from "./components/YouTubePlayer";
import { ParticipantList } from "./components/ParticipantList";
import { ChatBox } from "./components/ChatBox";
import {
  RoomData,
  ParticipantData,
  VideoState,
  ChatMessageData,
  Role,
  ReactionData,
} from "./types";
import { Video, LogOut, Radio } from "lucide-react";

interface FloatingReaction extends ReactionData {
  id: string;
  left: number;
}

export const App: React.FC = () => {
  const [joined, setJoined] = useState(false);
  const [, setUsername] = useState("");
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [floatingReactions, setFloatingReactions] = useState<
    FloatingReaction[]
  >([]);

  // Check URL search query for initial room code
  const queryRoomCode =
    new URLSearchParams(window.location.search).get("room") || "";

  // Setup Socket listeners
  useEffect(() => {
    socket.on("room_state", (data: RoomData) => {
      setRoomData(data);
      setJoined(true);
      toast.success(`🎉 Connected to Watch Party Room [${data.code}]!`);
    });

    socket.on(
      "user_joined",
      ({
        username,
        participants,
      }: {
        username: string;
        participants: ParticipantData[];
      }) => {
        setRoomData((prev) => (prev ? { ...prev, participants } : null));
        if (username) {
          toast.success(`👤 ${username} joined the watch party!`, {
            icon: "👋",
            style: {
              background: "#121624",
              color: "#f8fafc",
              border: "1px solid rgba(255,255,255,0.1)",
            },
          });
        }
      },
    );

    socket.on(
      "user_left",
      ({
        username,
        participants,
      }: {
        username: string;
        participants: ParticipantData[];
      }) => {
        setRoomData((prev) => (prev ? { ...prev, participants } : null));
        if (username) {
          toast(`🚪 ${username} left the room`, {
            icon: "👋",
            style: {
              background: "#121624",
              color: "#94a3b8",
              border: "1px solid rgba(255,255,255,0.1)",
            },
          });
        }
      },
    );

    socket.on(
      "play",
      ({
        currentTime,
        isPlaying,
        serverTimestamp,
        senderSocketId,
      }: {
        currentTime: number;
        isPlaying: boolean;
        serverTimestamp?: number;
        senderSocketId?: string;
      }) => {
        setRoomData((prev) =>
          prev
            ? {
                ...prev,
                videoState: {
                  ...prev.videoState,
                  currentTime,
                  isPlaying,
                  serverTimestamp,
                  senderSocketId,
                },
              }
            : null,
        );
      },
    );

    socket.on(
      "pause",
      ({
        currentTime,
        isPlaying = false,
        serverTimestamp,
        senderSocketId,
      }: {
        currentTime: number;
        isPlaying?: boolean;
        serverTimestamp?: number;
        senderSocketId?: string;
      }) => {
        setRoomData((prev) =>
          prev
            ? {
                ...prev,
                videoState: {
                  ...prev.videoState,
                  currentTime,
                  isPlaying,
                  serverTimestamp,
                  senderSocketId,
                },
              }
            : null,
        );
      },
    );

    socket.on(
      "seek",
      ({
        currentTime,
        time,
        serverTimestamp,
        senderSocketId,
      }: {
        currentTime?: number;
        time?: number;
        serverTimestamp?: number;
        senderSocketId?: string;
      }) => {
        const seekTime = time !== undefined ? time : currentTime || 0;
        setRoomData((prev) =>
          prev
            ? {
                ...prev,
                videoState: {
                  ...prev.videoState,
                  currentTime: seekTime,
                  serverTimestamp,
                  senderSocketId,
                },
              }
            : null,
        );
      },
    );

    socket.on("change_video", (videoState: VideoState) => {
      setRoomData((prev) => (prev ? { ...prev, videoState } : null));
      toast("🎬 Video was changed", {
        icon: "📺",
        style: {
          background: "#121624",
          color: "#38bdf8",
          border: "1px solid rgba(56,189,248,0.3)",
        },
      });
    });

    socket.on(
      "role_assigned",
      ({
        username,
        role,
        participants,
      }: {
        username: string;
        role: Role;
        participants: ParticipantData[];
      }) => {
        setRoomData((prev) => (prev ? { ...prev, participants } : null));
        if (role === "HOST") {
          toast(`👑 Control transferred to ${username}!`, {
            icon: "👑",
            style: {
              background: "#121624",
              color: "#fbbf24",
              border: "1px solid rgba(251,191,36,0.4)",
            },
          });
        } else if (role === "MODERATOR") {
          toast(`🛡️ ${username} was promoted to Moderator`, {
            icon: "🛡️",
            style: {
              background: "#121624",
              color: "#38bdf8",
              border: "1px solid rgba(56,189,248,0.4)",
            },
          });
        } else {
          toast(`👤 ${username} is now a Participant`, {
            icon: "👤",
            style: {
              background: "#121624",
              color: "#94a3b8",
              border: "1px solid rgba(255,255,255,0.1)",
            },
          });
        }
      },
    );

    socket.on(
      "participant_removed",
      ({
        username,
        participants,
      }: {
        username?: string;
        participants: ParticipantData[];
      }) => {
        setRoomData((prev) => (prev ? { ...prev, participants } : null));
        toast.error(`🚫 ${username || "Participant"} was removed by the Host`, {
          style: {
            background: "#121624",
            color: "#f87171",
            border: "1px solid rgba(239,68,68,0.3)",
          },
        });
      },
    );

    socket.on("chat_message", (message: ChatMessageData) => {
      setRoomData((prev) =>
        prev
          ? { ...prev, chatMessages: [...prev.chatMessages, message] }
          : null,
      );
    });

    socket.on("reaction", ({ username: reactorName, emoji }: ReactionData) => {
      // Trigger floating emoji animation
      const reaction: FloatingReaction = {
        id: Math.random().toString(36).substring(2, 9),
        username: reactorName,
        emoji,
        left: Math.random() * 70 + 15, // Random X position 15% to 85%
      };

      setFloatingReactions((prev) => [...prev, reaction]);
      setTimeout(() => {
        setFloatingReactions((prev) =>
          prev.filter((r) => r.id !== reaction.id),
        );
      }, 2000);

      // Trigger confetti on 🎉 or 🔥
      if (emoji === "🎉" || emoji === "🔥") {
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
      }
    });

    socket.on("kicked", (msg: string) => {
      toast.error(msg || "You have been removed from the room by the host.");
      setJoined(false);
      setRoomData(null);
      socket.disconnect();
    });

    socket.on("connect_error", () => {
      toast.error("Could not connect to backend server. Please verify backend server is running.", { id: "conn_err" });
    });

    socket.on("error_message", (msg: string) => {
      toast.error(msg, {
        style: {
          background: "#121624",
          color: "#f87171",
          border: "1px solid rgba(239,68,68,0.3)",
        },
      });
    });

    socket.on("sync_state", (videoState: VideoState) => {
      setRoomData((prev) => (prev ? { ...prev, videoState } : null));
      toast.success("✨ Synchronized with Host!", {
        style: {
          background: "#111a29",
          color: "#B4E1EB",
          border: "1px solid rgba(180, 225, 235, 0.3)",
        },
      });
    });

    return () => {
      socket.off("room_state");
      socket.off("user_joined");
      socket.off("user_left");
      socket.off("play");
      socket.off("pause");
      socket.off("seek");
      socket.off("change_video");
      socket.off("sync_state");
      socket.off("role_assigned");
      socket.off("participant_removed");
      socket.off("chat_message");
      socket.off("reaction");
      socket.off("kicked");
      socket.off("error_message");
      socket.off("connect_error");
    };
  }, []);

  const handleJoinRoom = (name: string, code: string, userId?: string) => {
    setUsername(name);
    socket.connect();
    socket.emit("join_room", { roomId: code, username: name, userId });
  };

  const handleLeaveRoom = () => {
    socket.emit("leave_room");
    socket.disconnect();
    setJoined(false);
    setRoomData(null);
    toast("You left the watch party", { icon: "👋" });
  };

  // Find current user's role
  const currentUser = roomData?.participants.find(
    (p) => p.socketId === socket.id,
  );
  const currentRole: Role = currentUser?.role || "PARTICIPANT";
  const canControl = currentRole === "HOST" || currentRole === "MODERATOR";

  if (!joined || !roomData) {
    return (
      <>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#121624",
              color: "#f8fafc",
              border: "1px solid rgba(255,255,255,0.1)",
            },
          }}
        />
        <CreateJoinRoom
          onJoinRoom={handleJoinRoom}
          defaultRoomCode={queryRoomCode}
        />
      </>
    );
  }

  return (
    <div
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#121624",
            color: "#f8fafc",
            border: "1px solid rgba(255,255,255,0.1)",
          },
        }}
      />
      {/* Navbar */}
      <header
        className="glass-panel watchparty-header"
        style={{
          borderRadius: 0,
          borderLeft: "none",
          borderRight: "none",
          borderTop: "none",
          padding: "14px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "12px",
              background: "var(--accent-gradient)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 16px rgba(120, 164, 203, 0.4)",
            }}
          >
            <Video size={20} color="#090e17" />
          </div>
          <div>
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "19px",
                fontWeight: 800,
                letterSpacing: "-0.3px",
              }}
            >
              {roomData.name}
            </h2>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "12px",
                color: "var(--text-muted)",
              }}
            >
              <Radio size={12} color="#10b981" /> Live Sync Connected
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn-secondary"
          onClick={handleLeaveRoom}
          style={{ padding: "8px 14px" }}
        >
          <LogOut size={16} /> Leave Party
        </button>
      </header>

      {/* Floating Reactions Overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 999,
          overflow: "hidden",
        }}
      >
        {floatingReactions.map((r) => (
          <div
            key={r.id}
            className="floating-reaction"
            style={{ left: `${r.left}%`, bottom: "20%" }}
          >
            {r.emoji}{" "}
            <span style={{ fontSize: "12px", color: "#fff", fontWeight: 700 }}>
              {r.username}
            </span>
          </div>
        ))}
      </div>

      {/* Main Content Layout */}
      <main
        className="watchparty-container"
        style={{
          flex: 1,
          padding: "24px",
          maxWidth: "1440px",
          width: "100%",
          margin: "0 auto",
        }}
      >
        <div className="watchparty-grid">
          {/* Left Column: Video Player & Control Bar */}
          <div>
            <YouTubePlayerComponent
              videoState={roomData.videoState}
              canControl={canControl}
              onPlay={(time) => socket.emit("play", { currentTime: time })}
              onPause={(time) => socket.emit("pause", { currentTime: time })}
              onSeek={(time) => socket.emit("seek", { time })}
              onChangeVideo={(urlOrId) =>
                socket.emit("change_video", { videoId: urlOrId })
              }
              onRequestSync={() => socket.emit("request_sync")}
              onForceSyncAll={() => socket.emit("force_sync_all")}
            />
          </div>

          {/* Right Column: Participants List & Live Chat */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            <ParticipantList
              participants={roomData.participants}
              currentUserId={socket.id || ""}
              currentRole={currentRole}
              roomCode={roomData.code}
              onAssignRole={(targetSocketId, role) =>
                socket.emit("assign_role", { targetSocketId, role })
              }
              onRemoveParticipant={(targetSocketId) =>
                socket.emit("remove_participant", { targetSocketId })
              }
            />

            <ChatBox
              messages={roomData.chatMessages}
              onSendMessage={(text) => socket.emit("send_message", { text })}
              onSendReaction={(emoji) =>
                socket.emit("send_reaction", { emoji })
              }
            />
          </div>
        </div>
      </main>
    </div>
  );
};

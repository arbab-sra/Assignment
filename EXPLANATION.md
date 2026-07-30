# 📖 syncbits Watch Party Technical Walkthrough

This document provides a detailed explanation of the core algorithms, design decisions, authentication workflows, and mobile video optimizations in **syncbits Watch Party**.

---

## 📚 Table of Contents

1. [Backend Domain Architecture (OOP)](#-backend-domain-architecture-oop)
2. [Authentication & Security System](#-authentication--security-system)
3. [Dual Room History Engine](#-dual-room-history-engine)
4. [Mobile WebKit Video Optimization](#-mobile-webkit-video-optimization)
5. [Role-Based Access Control (RBAC) & Host Failover](#-role-based-access-control-rbac--host-failover)

---

## 🧱 Backend Domain Architecture (OOP)

The backend uses Object-Oriented Programming (OOP) with clear domain encapsulation:

### 1. `RoomManager` (`server/src/models/RoomManager.ts`)
- **Design Pattern**: Singleton Pattern (`RoomManager.getInstance()`).
- **Responsibility**: Maintains an in-memory map of all active rooms (`Map<string, Room>`).
- **Methods**:
  - `getOrCreateRoom(code)`: Retrieves active room or instantiates a new `Room`.
  - `removeRoom(code)`: Cleans up empty rooms from memory.

### 2. `Room` (`server/src/models/Room.ts`)
- **Responsibility**: Represents an isolated watch room session.
- **State Properties**: `code`, `videoId`, `currentTime`, `isPlaying`, `participants`, `chatMessages`.
- **Automatic Host Failover**: If the active `HOST` disconnects, `Room` automatically promotes the next oldest connected participant to `HOST` and broadcasts `role_assigned` to the room.

### 3. `Participant` (`server/src/models/Participant.ts`)
- **Responsibility**: Models individual user connections.
- **Properties**: `socketId`, `username`, `role` (`HOST`, `MODERATOR`, `PARTICIPANT`), `joinedAt`.

---

## 🔐 Authentication & Security System

Authentication is **100% optional** to support unforced guest access while enabling cross-device cloud synchronization for registered users:

```
[ Register / Sign In ] ──► [ Bcryptjs Password Hash ] ──► [ PostgreSQL Storage ]
                                                                  │
[ Authenticated User ] ◄── [ 30-Day JWT Token Sign ] ─────────────┘
```

1. **Bcryptjs Password Hashing**: Passwords are encrypted before storage using `bcrypt.hash(password, 10)`. Verification uses `bcrypt.compare(password, user.password)`.
2. **JWT Token Signing**: On successful authentication, the server signs a JSON Web Token (`jwt.sign`) with a 30-day expiration.
3. **Bearer Authorization**: Clients include `Authorization: Bearer ${token}` on REST requests (`/api/users/:userId/rooms`).

---

## 🔄 Dual Room History Engine

To provide instant access without forcing logins:

- **Unauthenticated Guests**: Recently created or joined room codes are stored in browser `localStorage` (`watchparty_recent_rooms`).
- **Authenticated Users**: Room activities are stored in PostgreSQL (`Participant` and `Room` tables). When logging in on any device, the client merges cloud rooms with local `localStorage` history.

---

## 📱 Mobile WebKit Video Optimization

Mobile browsers (iOS Safari & Android Chrome) enforce strict autoplay and video playback constraints:

1. **Inline Parameters**: Enforces `playsinline: 1` and `enablejsapi: 1` in YouTube iframe options to prevent iOS Safari from launching native fullscreen video overlays.
2. **Locked Playback Speed**: Locks mobile playback rate at `1.0x`. Repeatedly calling `setPlaybackRate()` on mobile devices causes WebKit media decoders to pause and display spinning loading wheels.

---

## 🛡️ Role-Based Access Control (RBAC) & Host Failover

- **`HOST`**: Room creator. Can play/pause/seek, change video, promote/demote participants, transfer host role, and kick users.
- **`MODERATOR`**: Assigned by Host. Can play/pause/seek and change video URLs.
- **`PARTICIPANT`**: Watch-only synchronized playback with interactive live chat and floating emoji reactions.

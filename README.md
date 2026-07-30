# 🎬 YouTube Watch Party System

A full-stack, real-time synchronized **YouTube Watch Party** system built with **React (Vite + TypeScript)**, **Node.js (Express + TypeScript)**, **Socket.IO**, and **PostgreSQL with Prisma ORM**.

Allow multiple participants to create watch rooms, play YouTube videos in sync (play/pause/seek/URL change), assign host/moderator roles, kick participants, and chat in real-time.

---

## 🌟 Core Features

1. **Real-time Synchronization**: Synchronous play, pause, seek scrubbing, and video URL switching across all room participants without feedback loops.
2. **Room-Based Architecture**: Join via unique room codes (e.g. `PARTY1`) or 1-click shareable links (`?room=PARTY1`).
3. **Role-Based Access Control (RBAC)**:
   - **Host** (Creator): Full control over playback, room settings, promoting/demoting participants, removing users, and transferring host privileges.
   - **Moderator**: Assigned by Host. Can play, pause, seek, and change videos.
   - **Participant**: Watch-only access with interactive live chat & floating emoji reactions.
4. **OOP Server Architecture**: Clean separation of responsibilities (`RoomManager`, `Room`, `Participant`).
5. **Database Persistence**: Persistent rooms, user logs, and chat records using **PostgreSQL & Prisma ORM**.
6. **Live Interactive Chat & Reactions**: Real-time text messaging and floating animated emoji reactions (🔥, ❤️, 🎉, 😂, 👏, 😮) with particle effects.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS / Vanilla CSS Glassmorphic Design System, `react-youtube` (YouTube Iframe API), `socket.io-client`, `lucide-react`, `canvas-confetti`.
- **Backend**: Node.js, Express, TypeScript, Socket.IO Server, `@prisma/client`, CORS, dotenv.
- **Database**: PostgreSQL (Prisma ORM for schema, migrations, and model relationships).

---

## ⚡ Getting Started (Local Development)

### 1. Prerequisites
- Node.js (v18+)
- npm or yarn
- PostgreSQL (Optional: fallback in-memory store activates if DB is offline)

### 2. Backend Setup
```bash
cd server
npm install

# (Optional) Generate Prisma Client & Push DB Schema
npx prisma generate
npx prisma db push

# Start Backend Dev Server (Port 5001)
npm run dev
```

### 4. Running with Docker & Docker Compose
You can also run both the backend server and PostgreSQL database together using Docker:
```bash
# Build and run backend + PostgreSQL containers
docker compose up --build
```
This will launch the backend API server on `http://localhost:5001` connected to the PostgreSQL container.

---

## 📡 WebSocket Event API Reference

| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `join_room` | Client ➔ Server | `{ roomId, username }` | Joins room; server assigns `HOST` if creator, else `PARTICIPANT`. |
| `leave_room` | Client ➔ Server | `{ roomId }` | Leaves room; auto-transfers Host if Host disconnects. |
| `play` | Client ➔ Server | `{ currentTime }` | Synchronizes play action. Requires Host/Moderator. |
| `pause` | Client ➔ Server | `{ currentTime }` | Synchronizes pause action. Requires Host/Moderator. |
| `seek` | Client ➔ Server | `{ time }` | Seeks playback. Requires Host/Moderator. |
| `change_video` | Client ➔ Server | `{ videoId }` | Changes YouTube URL/video. Requires Host/Moderator. |
| `assign_role` | Client ➔ Server | `{ targetSocketId, role }` | Promotes/demotes participant. Host only. |
| `remove_participant` | Client ➔ Server | `{ targetSocketId }` | Kicks participant from room. Host only. |
| `send_message` | Client ➔ Server | `{ text }` | Broadcasts live text chat message to room. |
| `send_reaction` | Client ➔ Server | `{ emoji }` | Broadcasts floating emoji reaction & confetti. |

---

## 🏗️ Architecture Overview

```
 ┌───────────────────────────────────────────────────────────┐
 │                   React + Vite Frontend                   │
 │ (YouTube IFrame API, Socket.IO Client, Glassmorphism UI)  │
 └─────────────────────────────┬─────────────────────────────┘
                               │ WebSocket Bidirectional Events
 ┌─────────────────────────────▼─────────────────────────────┐
 │                Node.js + Express Backend                  │
 │                                                           │
 │  ┌─────────────────┐  ┌──────────────┐  ┌──────────────┐  │
 │  │   RoomManager   │  │     Room     │  │ Participant  │  │
 │  │   (Singleton)   │──► (OOP Model)  │──► (OOP Model)  │  │
 │  └─────────────────┘  └──────────────┘  └──────────────┘  │
 └─────────────────────────────┬─────────────────────────────┘
                               │ Prisma ORM
 ┌─────────────────────────────▼─────────────────────────────┐
 │                    PostgreSQL Database                    │
 └───────────────────────────────────────────────────────────┘
```

---

## 🚀 Public Deployment Guide

- **Backend (Render / Railway)**: Deploy `/server` as a Web Service. Set environment variables `PORT=5001` and `DATABASE_URL`.
- **Frontend (Vercel / Netlify)**: Deploy `/client`. Set `VITE_SERVER_URL=https://your-backend-service.onrender.com`.

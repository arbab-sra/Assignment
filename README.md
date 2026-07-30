# 🎬 syncbits Watch Party System

An enterprise-grade, full-stack, real-time synchronized **YouTube Watch Party Platform** built with **React (Vite + TypeScript)**, **Node.js (Express + TypeScript)**, **Socket.IO**, and **PostgreSQL with Prisma ORM**.

Designed for seamless, sub-200ms multi-device synchronized video playback across Desktop and Mobile browsers without audio stutters, feedback loops, or loading spinners.

---

## 📋 Table of Contents

- [🌟 Core Features](#-core-features)
- [📦 Environment Prerequisites](#-environment-prerequisites)
- [⚡ 1-Click Local Execution Guide](#-1-click-local-execution-guide)
  - [Option 1: 1-Click Parallel Launcher (`npm run dev`)](#option-1-1-click-parallel-launcher-npm-run-dev)
  - [Option 2: Shell Script Launcher (`./start.sh`)](#option-2-shell-script-launcher-startsh)
  - [Option 3: Containerized Docker Compose (`docker compose`)](#option-3-containerized-docker-compose-docker-compose)
- [🏗️ In-Depth Architecture Overview](#️-in-depth-architecture-overview)
  - [System Flow & Component Diagram](#system-flow--component-diagram)
  - [WebSocket Integration & Data Flow](#websocket-integration--data-flow)
  - [Sub-200ms Latency Compensation & Echo Suppression](#sub-200ms-latency-compensation--echo-suppression)
  - [Smart 3-Tier Adaptive Speed Engine & Mobile WebKit Optimization](#smart-3-tier-adaptive-speed-engine--mobile-webkit-optimization)
- [💻 Code Walkthrough & Design Logic](#-code-walkthrough--design-logic)
  - [Backend OOP Domain Models](#backend-oop-domain-models)
  - [Frontend Component Hierarchy](#frontend-component-hierarchy)
- [🛠️ Tech Stack](#️-tech-stack)
- [📡 WebSocket Event API Reference](#-websocket-event-api-reference)
- [☁️ Cloud Deployment (Vercel + Railway + Neon Tech)](#️-cloud-deployment-vercel--railway--neon-tech)

---

## 🌟 Core Features

1. ** Video Synchronization**: Instant play, pause, seek scrubbing, and video URL switching across all room members with transit time network compensation.
2. **Room-Based Multi-Tenancy**: Join via unique 6-character room codes (e.g. `PARTY1`) or 1-click shareable links (`?room=PARTY1`).
3. **Role-Based Access Control (RBAC)**:
   - **Host** (Room Creator): Full playback control, participant promotion/demotion, host transfer, and participant kicking.
   - **Moderator**: Elevated permissions assigned by Host to control playback and change video URLs.
   - **Participant**: Watch-only synchronized playback with interactive live chat and floating emoji reactions.
4. **Seamless Mobile Support**: Custom iOS Safari and Android Chrome inline player parameters (`playsinline: 1`, `enablejsapi: 1`) preventing WebKit fullscreen takeovers or spinning loading wheels.
5. **Adaptive Playback Rate Engine**: Uses YouTube Iframe API speed micro-adjustments (`1.08x` / `0.92x`) to align micro-drifts under 1.2s without audio pops or video buffering pauses.
6. **Robust Dual Persistence Engine**: Uses PostgreSQL with Prisma ORM for persistent data, with an automatic, zero-downtime in-memory fallback store if database connectivity is offline.
7. **Live Interactive Chat & Reactions**: Real-time text messaging with zero window scrolling shifts, plus floating animated emoji reactions (🔥, ❤️, 🎉, 😂, 👏, 😮) and confetti particle triggers.

---

## 📦 Environment Prerequisites

Before starting the application locally or in Docker, ensure your environment meets the following requirements:

### 1. Software Tools

- **Node.js**: v18.0.0 or higher ([Download Node.js](https://nodejs.org/))
- **npm**: v9.0.0 or higher (Bundled with Node.js)
- **Docker Desktop**: v24.0+ & **Docker Compose** v2.0+ (Required ONLY for Option 3 containerized deployment - [Download Docker](https://www.docker.com/products/docker-desktop/))
- **Git**: v2.30+

### 2. Environment Variables Configuration

#### Backend Configuration ([server/.env](file:///Users/arbab/Desktop/Assignment/server/.env))

Create a `.env` file inside the `server/` directory:

```env
CLIENT_URL=http://localhost:3000
DATABASE_URL="postgresql://arbab_neon_owner:Iy56uVfSceRj@ep-small-bar-a4nyo828.us-east-1.aws.neon.tech/neondb?sslmode=require&connect_timeout=15"
```

_(Note: You can use your Neon Tech Cloud database URL or local PostgreSQL `postgresql://postgres:postgrespassword@localhost:5432/watchpartydb`)_

#### Frontend Configuration ([client/.env](file:///Users/arbab/Desktop/Assignment/client/.env))

Create a `.env` file inside the `client/` directory:

```env
VITE_SERVER_URL=http://localhost:5001
```

---

## ⚡ 1-Click Local Execution Guide

You can run both the Backend Express server and Frontend Vite client simultaneously using any of the following 1-click methods:

### Option 1: 1-Click Parallel Launcher (`npm run dev`)

From the **root project directory**:

```bash
# Install dependencies in both server and client folders
cd server && npm install && cd ../client && npm install && cd ..

# Launch both Backend & Frontend simultaneously with 1 command
npm run dev
```

- **Backend Server**: Launches on `http://localhost:5001`
- **Frontend Client**: Launches on `http://localhost:3000`

---

### Option 2: Shell Script Launcher (`./start.sh`)

From the **root project directory**:

```bash
# Run 1-click startup script (macOS / Linux)
./start.sh
```

---

### Option 3: Containerized Docker Compose (`docker compose`)

Run the backend and database inside isolated Docker containers:

```bash
# From project root directory
docker compose up --build -d && cd client && npm install && npm run dev
```

This builds and starts the backend service container on `http://localhost:5001` connected to your database environment.

---

## 🏗️ In-Depth Architecture Overview

### System Flow & Component Diagram

```
 ┌───────────────────────────────────────────────────────────┐
 │                   React + Vite Frontend                   │
 │  ┌─────────────────┐  ┌──────────────┐  ┌──────────────┐  │
 │  │ YouTubePlayer   │  │   ChatBox    │  │ParticipantLst│  │
 │  │ (IFrame API)    │  │  (Realtime)  │  │  (RBAC UI)   │  │
 │  └─────────────────┘  └──────────────┘  └──────────────┘  │
 └─────────────────────────────┬─────────────────────────────┘
                               │ WebSocket Bidirectional Events (Socket.IO)
 ┌─────────────────────────────▼─────────────────────────────┐
 │                Node.js + Express Backend                  │
 │                                                           │
 │  ┌─────────────────┐  ┌──────────────┐  ┌──────────────┐  │
 │  │   RoomManager   │  │     Room     │  │ Participant  │  │
 │  │   (Singleton)   │──► (OOP Model)  │──► (OOP Model)  │  │
 │  └─────────────────┘  └──────────────┘  └──────────────┘  │
 └─────────────────────────────┬─────────────────────────────┘
                               │ Prisma ORM (Async / Fallback)
 ┌─────────────────────────────▼─────────────────────────────┐
 │            PostgreSQL Database (Neon Tech / Cloud)        │
 └───────────────────────────────────────────────────────────┘
```

---

### WebSocket Integration & Data Flow

WebSockets (powered by **Socket.IO 4**) serve as the core real-time backbone for the application.

1. **Connection & Session Handshake**:
   - On page load, the frontend initializes a single persistent WebSocket connection (`socket.ts`).
   - When a user joins or creates a room (`join_room`), the server validates room state, registers the socket in a dedicated Socket.IO room identifier (`room.code`), and assigns initial roles.
2. **Bidirectional Control Broadcast**:
   - When a Host performs a playback action (Play, Pause, Seek, Change Video), the client emits a socket event (`play`, `pause`, `seek`, `change_video`) containing the local timestamp and payload.
   - The backend validates the socket's role permission (`HOST` or `MODERATOR`), updates the room's server-side memory state, and broadcasts the event to all other room members (`socket.broadcast.to(room.code).emit(...)`).

---

### Sub-200ms Latency Compensation & Echo Suppression

To achieve precise frame alignment across different network latency conditions:

1. **Server Timestamping**: The backend attaches a server UTC timestamp (`serverTimestamp = Date.now()`) and `senderSocketId` to every broadcasted event.
2. **Transit Time Math**: When a participant receives a event, transit duration is calculated as:
   $$L = \max\left(0, \frac{\text{Date.now}() - \text{serverTimestamp}}{1000}\right)$$
   If the video is currently playing, expected timestamp is calculated as:
   $$\text{expectedTime} = \text{currentTime} + L$$
3. **Sender Echo Suppression**: Broadcasts strictly use `socket.broadcast.to(room.code).emit(...)`. The sender Host does not receive a delayed WebSocket echo, eliminating double-pause or back-seek playback flashes on the controller's screen.

---

### Smart 3-Tier Adaptive Speed Engine & Mobile WebKit Optimization

To eliminate video buffering pauses during runtime continuous playback:

- **Tier 1 ($< 150\text{ms}$ drift)**: Normal `1.0x` playback rate.
- **Tier 2 ($150\text{ms} \le \text{drift} \le 1.2\text{s}$)**:
  - If participant is behind Host: Player speeds up to **`1.08x` (+8%)** for 1–2 seconds.
  - If participant is ahead of Host: Player slows to **`0.92x` (-8%)**.
  - **Result**: Catches up to the exact matching frame seamlessly with **zero video buffering and zero audio stutter**.
- **Tier 3 ($> 1.2\text{s}$ drift)**: Performs direct `seekTo(expectedTime, true)`.
- **Mobile WebKit Safeguard**: On mobile touch devices (iOS Safari / Android Chrome), `playsinline: 1` and `enablejsapi: 1` parameters are enforced, and playback speed is locked at `1.0x` to prevent mobile WebKit hardware decoders from spinning a buffer wheel.

---

## 💻 Code Walkthrough & Design Logic

### Backend OOP Domain Models

- **`RoomManager` (`server/src/models/RoomManager.ts`)**:
  - Implements the **Singleton Pattern**.
  - Serves as the global memory repository managing all active `Room` instances.
  - Provides thread-safe methods to create, query, clean up, and persist rooms.
- **`Room` (`server/src/models/Room.ts`)**:
  - Encapsulates room properties: `code`, `videoId`, `currentTime`, `isPlaying`, `lastStateUpdate`, and participant collection.
  - Handles RBAC rules: validates permissions for playback changes, role assignments, and host transfers.
  - Contains automatic Host failover logic: if the Host disconnects, host privileges automatically transfer to the next senior participant in the room.
- **`Participant` (`server/src/models/Participant.ts`)**:
  - Represents individual connected client sockets, mapping `socketId`, `username`, `role`, and connection timestamps.

### Frontend Component Hierarchy

- **`App.tsx`**: Main orchestration container handling Socket.IO listeners, room routing via URL query parameters, and toast notification popups.
- **`CreateJoinRoom.tsx`**: Entry screen featuring glassmorphism UI, radial gradient background, tab switcher, loading submission guards, and form validation.
- **`YouTubePlayer.tsx`**: Encapsulates the `react-youtube` iframe component, custom playback toolbar, progress seek bar, manual "Sync with Host" / "Sync All" buttons, and the adaptive speed engine.
- **`ChatBox.tsx`**: Container-scoped scrollable live chat displaying text messages, floating emoji reaction animations, and particle triggers without triggering webpage scroll shifts.
- **`ParticipantList.tsx`**: Real-time room roster displaying role badges (`HOST`, `MODERATOR`, `PARTICIPANT`), online indicators, and Host management action menus.

---

## 🛠️ Tech Stack

### Frontend

- **Framework**: React 18, Vite 5, TypeScript
- **Styling**: Vanilla CSS Glassmorphism Design System, CSS Variables, Custom Scrollbars
- **Media**: `react-youtube` (YouTube IFrame Player API)
- **Real-Time**: `socket.io-client` 4.7
- **UI Assets**: `lucide-react`, `react-hot-toast`, `canvas-confetti`

### Backend

- **Runtime**: Node.js 20, Express, TypeScript
- **Real-Time**: `socket.io` 4.7
- **Database ORM**: Prisma ORM 5.22
- **Database**: PostgreSQL 17 (Neon Tech / Cloud Compatible)

---

## 📡 WebSocket Event API Reference

| Event Name           | Direction       | Payload Structure                                               | Description                                                                        |
| :------------------- | :-------------- | :-------------------------------------------------------------- | :--------------------------------------------------------------------------------- |
| `join_room`          | Client ➔ Server | `{ roomId: string, username: string }`                          | Registers user socket in room. Assigns `HOST` to creator, `PARTICIPANT` to others. |
| `room_state`         | Server ➔ Client | `{ code, videoId, currentTime, isPlaying, participants, role }` | Transmits complete initial room snapshot to newly joined user.                     |
| `play`               | Client ➔ Server | `{ currentTime: number }`                                       | Triggers video play action. Broadcasts with `serverTimestamp`.                     |
| `pause`              | Client ➔ Server | `{ currentTime: number }`                                       | Triggers video pause action. Broadcasts with `serverTimestamp`.                    |
| `seek`               | Client ➔ Server | `{ time: number }`                                              | Triggers position seek action. Broadcasts to room.                                 |
| `change_video`       | Client ➔ Server | `{ videoId: string }`                                           | Swaps video URL for all room members. Resets position to 0s.                       |
| `request_sync`       | Client ➔ Server | _(None)_                                                        | Sent by participant to request fresh host state snapshot.                          |
| `force_sync_all`     | Client ➔ Server | _(None)_                                                        | Sent by Host/Moderator to force immediate room-wide re-sync.                       |
| `assign_role`        | Client ➔ Server | `{ targetSocketId: string, role: Role }`                        | Promotes/demotes target participant (`HOST`, `MODERATOR`, `PARTICIPANT`).          |
| `remove_participant` | Client ➔ Server | `{ targetSocketId: string }`                                    | Kicks targeted user from room.                                                     |
| `send_message`       | Client ➔ Server | `{ text: string }`                                              | Broadcasts real-time chat message to room members.                                 |
| `send_reaction`      | Client ➔ Server | `{ emoji: string }`                                             | Triggers floating emoji reaction & particle confetti across room.                  |

---

## ☁️ Cloud Deployment (Vercel + Railway + Neon Tech)

### 1. Database (Neon Tech PostgreSQL)

- Create a PostgreSQL database on [neon.tech](https://neon.tech/).
- Copy your connection string and add SSL parameters:
  `DATABASE_URL="postgresql://user:password@ep-xyz.neon.tech/neondb?sslmode=require&connect_timeout=15"`
- Push schema: `npx prisma db push`

### 2. Backend (Railway)

- Deploy `/server` on [railway.app](https://railway.app/).
- Set variables:
  - `CLIENT_URL` = `https://your-app.vercel.app`
  - `DATABASE_URL` = _(Your Neon Tech URL)_
- Railway automatically detects `server/railway.json` and `Dockerfile`.

### 3. Frontend (Vercel)

- Deploy `/client` on [vercel.com](https://vercel.com/).
- Set environment variable:
  - `VITE_SERVER_URL` = `https://your-backend.up.railway.app`

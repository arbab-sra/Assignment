# 🎬 syncbits Watch Party Platform

An enterprise-grade, full-stack, real-time synchronized **YouTube Watch Party Platform** built with **React (Vite + TypeScript)**, **Node.js (Express + TypeScript)**, **Socket.IO 4**, and **PostgreSQL with Prisma ORM**.

Designed for seamless, sub-200ms multi-device synchronized video playback across Desktop and Mobile browsers without audio stutters, feedback loops, or loading spinners.

---

## 🌐 Live Link

**[https://liveproject.fun/](https://liveproject.fun/)**

---

## 📚 Complete Project Documentation Index

All documentation has been organized into dedicated, deep-dive guides:

- 🏗️ **[ARCHITECTURE.md](https://github.com/arbab-sra/Assignment/blob/main/ARCHITECTURE.md)** — In-depth System Architecture, WebSocket event flow, sub-200ms latency compensation math, 3-tier adaptive playback engine, & PostgreSQL ERD model.
- 📖 **[EXPLANATION.md](https://github.com/arbab-sra/Assignment/blob/main/EXPLANATION.md)** — Technical Code Walkthrough, OOP domain models (`RoomManager`, `Room`, `Participant`), Bcryptjs + JWT optional authentication, dual room history merging, & mobile WebKit optimizations.
- 🎨 **[client/README.md](https://github.com/arbab-sra/Assignment/blob/main/client/README.md)** — Frontend React + Vite setup, component hierarchy, glassmorphism CSS design system, and Vercel deployment guide.
- ⚙️ **[server/README.md](https://github.com/arbab-sra/Assignment/blob/main/server/README.md)** — Backend Express + Socket.IO setup, REST API reference, WebSocket event table, Prisma ORM schema, and Railway deployment guide.

---

## 🌟 Core Highlights

1. **Sub-200ms Video Synchronization**: Instant play, pause, position seek, and YouTube video swapping across all room members with real-time transit time network compensation.
2. **Hardened JWT Authentication & Authorization**: Optional guest access with local storage history, plus JWT-authenticated REST APIs (`Authorization: Bearer <token>`) enforcing strict user ownership checks.
3. **Continuous State & Database Persistence**: Live playback state updates (`videoId`, `currentTime`, `isPlaying`), role changes, and host transfers are written back to PostgreSQL via Prisma.
4. **Automatic Room & Chat Re-hydration**: On server restarts, rooms and historical chat messages are dynamically loaded into RAM from PostgreSQL upon access.
5. **Adaptive Playback Speed Engine**: Uses YouTube Iframe API speed micro-adjustments (`1.08x` / `0.92x`) to resolve micro-drifts under 1.2s without audio pops or buffering wheels.
6. **Automatic Host Promotion & Failover**: When a Host leaves, the backend automatically promotes the next participant to `HOST`, updates PostgreSQL, and notifies the room.
7. **Seamless Mobile WebKit Support**: Custom iOS Safari and Android Chrome parameters (`playsinline: 1`, `enablejsapi: 1`) preventing WebKit fullscreen takeovers.
8. **Role-Based Access Control (RBAC)**: `HOST`, `MODERATOR`, and `PARTICIPANT` roles with server-enforced event permissions.
9. **Live Interactive Chat & Reactions**: Real-time text chat with zero webpage scroll shifts, floating emoji animations (🔥, ❤️, 🎉, 😂, 👏, 😮), and confetti triggers.

---

## ⚡ 1-Click Local Execution Guide

Launch both Backend Express server (`http://localhost:5001`) and Frontend Vite client (`http://localhost:3000`) simultaneously:

### 1-Click Parallel Launcher (`npm run dev`)

From the **root project directory**:

```bash
# Install dependencies in both server and client folders
cd server && npm install && cd ../client && npm install && cd ..

# Launch both Backend & Frontend simultaneously
npm run dev
```

### Alternative Launchers

- **Shell Script**: `./start.sh` (macOS / Linux)
- **Containerized**: `docker compose up --build -d && cd client && npm run dev`

---

## ☁️ Cloud Deployment Quick Reference

- **Database**: PostgreSQL hosted on [Neon Tech](https://neon.tech/)
- **Backend API**: Deployed on [Railway](https://railway.app/)
- **Frontend App**: Deployed on [Vercel](https://vercel.com/)

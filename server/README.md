# ⚙️ syncbits Watch Party Backend Server

The backend server for **syncbits Watch Party**, built with **Node.js**, **Express**, **Socket.IO**, **Prisma ORM**, **Bcryptjs**, and **JWT**.

---

## 🛠️ Technology Stack

- **Runtime**: Node.js 20 & Express
- **Language**: TypeScript (`ts-node-dev`)
- **Real-Time Protocol**: `socket.io` 4.7
- **Database ORM**: Prisma ORM 5.22
- **Database**: PostgreSQL 17 (Neon Tech / Cloud Compatible)
- **Security**: `bcryptjs` (Password hashing) & `jsonwebtoken` (JWT tokens)

---

## ⚡ Quick Start

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Push database schema to PostgreSQL
npx prisma db push

# Start backend dev server
npm run dev
```

The server will launch on `http://localhost:5001`.

---

## ⚙️ Environment Variables ([.env](file:///Users/arbab/Desktop/Assignment/server/.env))

```env
PORT=5001
CLIENT_URL=http://localhost:3000
DATABASE_URL="postgresql://user:password@ep-xyz.neon.tech/neondb?sslmode=require&connect_timeout=15"
JWT_SECRET=your_jwt_secret_key_here
```

---

## 🌐 REST API Reference

| Endpoint | Method | Security / Headers | Description |
| :--- | :--- | :--- | :--- |
| `/` | `GET` | Open | Root deployment health check |
| `/api/health` | `GET` | Open | Service status check |
| `/api/auth/register` | `POST` | Open | Registers user (bcrypt hash) & returns 30-day JWT token |
| `/api/auth/login` | `POST` | Open | Authenticates user & returns 30-day JWT token |
| `/api/users/:userId/rooms` | `GET` | `Authorization: Bearer <token>` | Fetches cross-device room history (enforces `req.user.userId === userId`) |
| `/api/rooms/:code` | `GET` | Open | Fetches room state snapshot (with PostgreSQL auto-re-hydration) |

---

## 🔒 Security & Persistence Features

- **JWT Authorization Middleware**: `authenticateJWT` middleware validates Bearer tokens on protected REST routes and verifies caller user ownership.
- **Dynamic CORS Security**: Replaced wildcard CORS with dynamic origin validator supporting `https://liveproject.fun`, `https://assignment.arbab.fun`, `http://localhost:3000`, and `http://localhost:5173` with `credentials: true`.
- **Database Persistence**: Live playback state changes (`videoId`, `currentTime`, `isPlaying`), role updates, and chat messages are written back to PostgreSQL via Prisma.
- **PostgreSQL Re-hydration**: On server restarts, rooms and historical chat messages are restored from PostgreSQL into memory when accessed.

---

## 📡 WebSocket Event Reference

| Event | Payload | Description |
| :--- | :--- | :--- |
| `join_room` | `{ roomId, username, userId? }` | Enters socket into room channel (cleans up previous room) |
| `play` | `{ currentTime }` | Broadcasts video play with server timestamp |
| `pause` | `{ currentTime }` | Broadcasts video pause with server timestamp |
| `seek` | `{ time }` | Broadcasts video position seek |
| `change_video` | `{ videoId }` | Swaps YouTube video URL room-wide |
| `send_message` | `{ text }` | Broadcasts and persists chat message |
| `send_reaction` | `{ emoji }` | Broadcasts floating reaction emoji |
| `assign_role` | `{ targetSocketId, role }` | Promotes/demotes participant & updates DB |
| `remove_participant` | `{ targetSocketId }` | Kicks user & deletes DB record immediately |

---

## 🚀 Deployment (Railway)

1. Connect repository to [Railway](https://railway.app).
2. Set Root Directory to `server`.
3. Set environment variables (`CLIENT_URL`, `DATABASE_URL`, `JWT_SECRET`).
4. Railway automatically detects `railway.json` and `Dockerfile`.

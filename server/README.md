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

| Endpoint | Method | Body / Params | Description |
| :--- | :--- | :--- | :--- |
| `/` | `GET` | None | Root health check for deployment platforms |
| `/api/health` | `GET` | None | Service health status |
| `/api/auth/register` | `POST` | `{ email, password, name }` | Registers a user and returns JWT token |
| `/api/auth/login` | `POST` | `{ email, password }` | Authenticates user and returns JWT token |
| `/api/users/:userId/rooms` | `GET` | Header: `Authorization: Bearer <token>` | Fetches cross-device room history for user |
| `/api/rooms/:code` | `GET` | Code param | Fetches room details & state snapshot |

---

## 📡 WebSocket Event Reference

| Event | Payload | Description |
| :--- | :--- | :--- |
| `join_room` | `{ roomId, username, userId? }` | Enters socket into room channel |
| `play` | `{ currentTime }` | Broadcasts video play with server timestamp |
| `pause` | `{ currentTime }` | Broadcasts video pause with server timestamp |
| `seek` | `{ time }` | Broadcasts video position seek |
| `change_video` | `{ videoId }` | Swaps YouTube video URL room-wide |
| `send_message` | `{ text }` | Broadcasts chat message |
| `send_reaction` | `{ emoji }` | Broadcasts floating reaction emoji |
| `assign_role` | `{ targetSocketId, role }` | Promotes/demotes participant |
| `remove_participant` | `{ targetSocketId }` | Kicks user from room |

---

## 🚀 Deployment (Railway)

1. Connect repository to [Railway](https://railway.app).
2. Set Root Directory to `server`.
3. Set environment variables (`CLIENT_URL`, `DATABASE_URL`, `JWT_SECRET`).
4. Railway automatically detects `railway.json` and `Dockerfile`.

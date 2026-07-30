# 🎨 syncbits Watch Party Frontend Client

The frontend client for **syncbits Watch Party**, built with **React 18**, **Vite 5**, **TypeScript**, and **Vanilla CSS Glassmorphism Design**.

---

## 🛠️ Technology Stack

- **Framework**: React 18 & Vite 5
- **Language**: TypeScript
- **Styling**: Vanilla CSS, Glassmorphism CSS Variables, Custom Animated Scrollbars
- **Real-Time Client**: `socket.io-client` 4.7
- **Video Component**: `react-youtube` (YouTube IFrame Player API)
- **Icons & UI**: `lucide-react`, `react-hot-toast`, `canvas-confetti`

---

## ⚡ Quick Start

```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

The client will launch at `http://localhost:3000`.

---

## 📁 Directory Structure & Components

```
client/src/
├── components/
│   ├── AuthModal.tsx         # Glassmorphic Sign In / Registration Modal
│   ├── ChatBox.tsx           # Live chat & floating emoji reaction overlay
│   ├── CreateJoinRoom.tsx    # Room creation, joining, & recent rooms panel
│   ├── ParticipantList.tsx   # Room roster & host RBAC management menu
│   └── YouTubePlayer.tsx     # YouTube iframe player & adaptive sync engine
├── services/
│   └── socket.ts             # Socket.IO connection manager
├── types/
│   └── index.ts              # TypeScript interface definitions
├── App.tsx                   # Main layout container & socket router
├── index.css                 # Glassmorphism design tokens & styles
└── main.tsx                  # Application mount entry point
```

---

## ⚙️ Environment Variables ([.env](file:///Users/arbab/Desktop/Assignment/client/.env))

```env
VITE_SERVER_URL=http://localhost:5001
```

*(Set `VITE_SERVER_URL` to your production backend URL when deploying to Vercel).*

---

## 🚀 Deployment (Vercel)

1. Connect your repository to [Vercel](https://vercel.com).
2. Set Root Directory to `client`.
3. Add Environment Variable: `VITE_SERVER_URL=https://your-backend.up.railway.app`
4. Deploy!

# 🎲 Housie Night — Real-Time Online Multiplayer Tambola

**Housie Night** is a complete, production-ready website for playing authentic Indian Housie (Tambola) online in real time with family and friends across desktop, tablets, Android, and iOS mobile browsers.

No registration, login, phone number, email, application download, or browser extension required. Players simply pick a display name (with nicknames or emojis), create or join a room via a 6-letter room code or one-click share link, and play immediately.

---

## 🌟 Key Features

- **No Sign-Up or App Required**: Instant anonymous room-based multiplayer. Chosen display names are safely cached locally in the browser.
- **Authentic Indian Tambola Tickets**:
  - Valid 3 rows × 9 columns format.
  - Exactly 15 unique numbers per ticket (5 numbers & 4 blanks per row).
  - Authentic column ranges:
    - Col 1: 1–9 | Col 2: 10–19 | Col 3: 20–29 | Col 4: 30–39 | Col 5: 40–49
    - Col 6: 50–59 | Col 7: 60–69 | Col 8: 70–79 | Col 9: 80–90
  - Strict ascending order down each column without duplicates.
- **Synchronized 1–90 Number Caller**:
  - Draws numbers 1 to 90 randomly without repetition.
  - Authoritative Socket.IO broadcast: all connected players see identical calls at the exact same millisecond.
  - **Traditional Voice Caller**: Speaks numbers aloud using browser SpeechSynthesis with traditional Indian Tambola nicknames (e.g., *"Top of the house 1"*, *"Two little ducks 22"*, *"Lucky seven 7"*, *"Two fat ladies 88"*). Includes audio mute toggle.
  - Complete 1–90 board with live highlighted numbers and recent call history ribbon.
- **All 6 Winning Categories Supported**:
  1. **Early Five**: First 5 numbers called on the ticket.
  2. **Top Line**: All 5 numbers on the 1st row.
  3. **Middle Line**: All 5 numbers on the 2nd row.
  4. **Bottom Line**: All 5 numbers on the 3rd row.
  5. **Four Corners**: First and last numbers of the top row, and first and last numbers of the bottom row.
  6. **Full House**: All 15 numbers on the ticket.
- **Authoritative Server Verification**:
  - When a player taps *"Claim Win"*, the backend validates the player's ticket against called numbers before awarding the prize.
  - False / bogus claims are rejected safely.
  - Valid claims trigger real-time room announcements, triumphant audio fanfares, and full-screen confetti animations.
- **Host Privileges & Game Flow**:
  - Room creator is designated host with protected permissions.
  - Manual *"Call Next"* button or automatic caller with configurable intervals (3s, 5s, 8s, 10s).
  - Pause, Resume, End Round, and Start Next Round controls.
- **Resilient Reconnection**:
  - Cryptographic session tokens automatically restore player identity, ticket, marked cells, and active round state across mobile lock screens or network interruptions.
- **Festive UI/UX Design**:
  - Royal dark purple & festive gold color palette.
  - Fully responsive design engineered for mobile phone screens, tablets, and desktops.
  - Interactive tactile cell marking with Web Audio API sound effects.
  - Room statistics and leaderboard page (`/stats/[code]`).

---

## 🏗️ Architecture

```
├── src/
│   ├── app/
│   │   ├── page.tsx               # Housie Night festive landing page
│   │   ├── layout.tsx             # Root layout with responsive viewport metadata
│   │   ├── room/[code]/page.tsx   # Real-time live multiplayer room
│   │   ├── stats/[code]/page.tsx  # Room leaderboard & round history
│   │   └── api/rooms/             # Next.js room creation & stats endpoints
│   ├── components/
│   │   ├── TicketBoard.tsx        # Authentic 3x9 ticket with dabbing & row completion
│   │   ├── LatestCall.tsx         # Large call card, recent history & audio controls
│   │   ├── NumberBoard.tsx        # Complete 1–90 board with mobile collapser
│   │   ├── ClaimPanel.tsx         # 6 winning categories & live claim buttons
│   │   ├── HostControls.tsx       # Caller, auto-timer, pause/resume, round controls
│   │   ├── LobbyView.tsx          # Waiting lobby with shareable link & copy buttons
│   │   ├── PlayerList.tsx         # Connected players list & host badge
│   │   └── ResultsModal.tsx       # Round results & celebratory winner modal
│   └── lib/
│       ├── audio.ts               # Web Audio synthesizer + Tambola voice caller
│       ├── confetti.ts            # Lightweight pure canvas celebratory confetti
│       └── game/
│           ├── types.ts           # GameState, WinningCategory, Socket event contracts
│           ├── ticket-generator.ts# Indian Tambola 3x9 ticket generator & validator
│           ├── winning-checker.ts # Authoritative win validation (Early 5, Corners, Rows, Full House)
│           └── game-engine.ts     # Authoritative room & round state manager
├── server/
│   └── index.ts                   # Node.js + Socket.IO real-time WebSocket server
├── prisma/
│   └── schema.prisma              # Database schema (Rooms, Players, Rounds, Tickets, Claims)
└── scripts/
    └── test-multiplayer.ts        # End-to-end multi-client automated integration test
```

---

## 🚀 Local Development Setup

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v20/v22/v24)
- **npm**: v9+

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Your default `.env` for local testing:
```env
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3001"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
SOCKET_PORT=3001
PORT=3000
NODE_ENV=development
SERVE_NEXT=false
```

### 3. Initialize Database
Generate Prisma client and push schema:
```bash
npm run db:push
npm run db:generate
```

### 4. Start the Application
Run both services in two terminals:

**Terminal 1 — Socket.IO Server:**
```bash
npm run server
```

**Terminal 2 — Next.js Web App:**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing

### 1. Unit & Game Logic Tests
Run Vitest for ticket generator and claim verification tests:
```bash
npm test
```

### 2. Multi-Client Real-Time Integration Test
Simulates multiple simultaneous players, room joins, 3x9 ticket generation, synchronized number calling, unauthorized action rejection, false claim rejection, and session token reconnection:
```bash
# Ensure Socket.IO server is running in another terminal (npm run server)
npx tsx scripts/test-multiplayer.ts
```

---

## 🌐 Public Deployment Guide

To make Housie Night publicly accessible online with persistent WebSocket connections, follow either deployment strategy below:

### Option A: Decoupled Deployment (Recommended)
- **Frontend**: Deploy Next.js to **Vercel** or **Netlify** (Free tier available).
- **Backend**: Deploy Socket.IO Server to **Render**, **Railway**, **Fly.io**, or **Heroku** (supports persistent WebSockets).
- **Database**: Use a free managed PostgreSQL database (e.g. Supabase, Neon, or Railway PostgreSQL).

#### Step 1: Deploy Backend & Database (e.g., Render or Railway)
1. In `prisma/schema.prisma`, update provider to `postgresql`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Create a Web Service on Render or Railway pointing to this repository.
3. Configure environment variables:
   - `DATABASE_URL`: Your PostgreSQL connection string.
   - `PORT`: `3001` (or your platform's assigned port).
   - `NODE_ENV`: `production`.
4. Set Build Command:
   ```bash
   npm install && npm run db:generate && npm run db:push
   ```
5. Set Start Command:
   ```bash
   npm run server
   ```
6. Note your deployed backend URL (e.g., `https://housie-socket.onrender.com`).

#### Step 2: Deploy Frontend on Vercel
1. Import the repository into [Vercel](https://vercel.com).
2. Configure Environment Variables in the Vercel dashboard:
   - `NEXT_PUBLIC_SOCKET_URL`: Set to your deployed backend URL (e.g., `https://housie-socket.onrender.com`).
   - `NEXT_PUBLIC_APP_URL`: Set to your Vercel URL (e.g., `https://housie-night.vercel.app`).
   - `DATABASE_URL`: Set to your PostgreSQL connection string.
3. Deploy! Your website will be live at `https://housie-night.vercel.app`.

---

### Option B: Unified Fullstack Single-Port Deployment
You can deploy the entire app (Next.js + Socket.IO) on a single port to **Render**, **Railway**, **Fly.io**, or any VPS (Ubuntu/DigitalOcean):

1. Set the following environment variable:
   ```env
   SERVE_NEXT=true
   PORT=3000
   NEXT_PUBLIC_SOCKET_URL=""
   ```
   *(When `NEXT_PUBLIC_SOCKET_URL` is empty, Socket.IO connects directly to the same host/origin).*
2. Build Command:
   ```bash
   npm install && npm run db:generate && npm run db:push && npm run build
   ```
3. Start Command:
   ```bash
   npm run server
   ```
   The Node.js server will serve both the Next.js frontend and the Socket.IO WebSockets on the single assigned `PORT`.

---

## 📱 Testing from Multiple Devices

1. **Same Wi-Fi Network**: Find your machine's local IP (e.g. `192.168.1.5`). Set `NEXT_PUBLIC_SOCKET_URL="http://192.168.1.5:3001"` in `.env`, run `npm run dev -- -H 0.0.0.0`, and open `http://192.168.1.5:3000` on your mobile phone browser.
2. **Public Access via Tunnel**: Run `npx cloudflared tunnel --url http://localhost:3000` or `ngrok http 3000` to share with remote friends instantly.
3. Open in two separate browser windows (or one Desktop and one Mobile browser) to test live multiplayer calling, ticket marking, and winning claims in real time!

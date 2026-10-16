# Real-Time Multiplayer Housie Website

A complete, functional, real-time multiplayer Housie (Tambola) website built with **Next.js 14**, **TypeScript**, **Tailwind CSS**, **Socket.IO**, and **Prisma ORM** (configured with SQLite for effortless zero-config local runs, with instant PostgreSQL migration support).

---

## Features

- **No Registration Required**: Players create or join rooms using just a display name and a 6-character room code.
- **Custom 6 × 5 Ticket Format**:
  - Exactly 6 rows and 5 columns (30 numbers total).
  - Numbers randomly picked from 1 to 100 without duplicates.
  - Interactive board with manual convenience marking and auto-highlighted called numbers.
- **Server-Authoritative Gameplay**:
  - Draws numbers 1–100 without replacement.
  - Synchronized in real time to all room participants via Socket.IO.
  - Host controls for manual calling, automatic calling (configurable interval), pause/resume, and starting subsequent rounds.
  - Rejection of unauthorized actions (e.g. non-hosts attempting to call numbers).
- **8 Winning Categories**:
  - **Early Five**: First 5 numbers called on the ticket.
  - **Top Row (Row 1)**, **Row 2**, **Row 3**, **Row 4**, **Row 5**, **Bottom Row (Row 6)**.
  - **Full House**: All 30 numbers called on the ticket.
  - Server-authoritative claim validation preventing false or duplicate claims.
- **Persistent Stats & Leaderboard**:
  - Tracks total rounds, unique players, category wins, duration, and complete call histories.
  - Dedicated room statistics and leaderboard page (`/stats/[code]`).
- **Resilient Reconnection**:
  - Cryptographic session tokens allow reconnecting players to restore their identity, ticket, and active round progress seamlessly across page refreshes or network drops.

---

## Architecture

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS + Lucide Icons.
- **Real-Time Server**: Dedicated Node.js + Socket.IO server running on port `3001` to maintain persistent bidirectional WebSockets.
- **Database**: Prisma ORM with SQLite (`prisma/dev.db`) for immediate out-of-the-box local operation (also compatible with PostgreSQL).
- **Testing**: Vitest for unit & integration tests (`src/lib/game/*.test.ts`) + custom end-to-end multi-client simulation script (`scripts/test-multiplayer.ts`).

---

## Getting Started

### 1. Prerequisites
- Node.js 18+ (tested on Node.js v22.15.0 LTS)
- npm 9+

### 2. Environment Setup
Create a `.env` file in the root directory (or copy from `.env.example`):
```env
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3001"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
SOCKET_PORT=3001
PORT=3000
NODE_ENV=development
```

### 3. Database Setup
Sync the Prisma schema and generate the Prisma Client:
```bash
npm run db:push
npm run db:generate
```

### 4. Running the Servers
The project runs two services: the Socket.IO real-time engine and the Next.js web application.

**Terminal 1 - Socket.IO Server:**
```bash
npm run server
```

**Terminal 2 - Next.js Web App:**
```bash
npm run dev
# or for production:
npm run build && npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Testing

Run unit & game-engine integration tests with Vitest:
```bash
npm test
```

Run real-time multi-client end-to-end integration simulation:
```bash
npx tsx scripts/test-multiplayer.ts
```

---

## Deployment Notes
- For production deployments (e.g. VPS, Render, Railway, Fly.io, DigitalOcean):
  - Run `npm run server` as a persistent background service (e.g., using `pm2` or Docker).
  - Deploy Next.js to Vercel, Node, or Docker. Set `NEXT_PUBLIC_SOCKET_URL` to your Socket.IO server's public URL.
  - To switch to PostgreSQL in production, update `provider = "postgresql"` in `prisma/schema.prisma` and set `DATABASE_URL` in `.env`.

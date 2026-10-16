# 🎲 Housie Night — Real-Time Online Multiplayer Tambola

**Housie Night** is a complete, production-ready website for playing authentic Indian Housie (Tambola) online in real time with family and friends across mobile phones, tablets, and desktop computers.

Engineered with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase (PostgreSQL + Realtime)** for serverless deployment on **Vercel**. Zero login, accounts, downloads, or persistent WebSocket background daemons required.

---

## 🌟 Key Features

- **No Sign-Up or App Required**: Instant anonymous room-based multiplayer. Chosen display names (including emojis) are cached locally in browser storage.
- **Authentic Indian Tambola Tickets**:
  - Valid 3 rows × 9 columns format.
  - Exactly 15 unique numbers per ticket (5 numbers & 4 blanks per row).
  - Authentic column ranges:
    - Col 1: 1–9 | Col 2: 10–19 | Col 3: 20–29 | Col 4: 30–39 | Col 5: 40–49
    - Col 6: 50–59 | Col 7: 60–69 | Col 8: 70–79 | Col 9: 80–90
  - Strict ascending order down each column without duplicates.
- **Synchronized 1–90 Number Caller**:
  - Draws numbers 1 to 90 randomly without repetition.
  - Supabase Realtime broadcast: all connected players see identical calls at the exact same millisecond.
  - **Traditional Voice Caller**: Speaks numbers aloud using browser SpeechSynthesis with traditional Indian Tambola nicknames (e.g., *"Top of the house 1"*, *"Two little ducks 22"*, *"Lucky seven 7"*, *"Two fat ladies 88"*). Includes audio mute toggle.
  - Complete 1–90 board with live highlighted numbers and recent call history ribbon.
- **All 6 Winning Categories Supported**:
  1. **Early Five**: First 5 numbers called on the ticket.
  2. **Top Line**: All 5 numbers on the 1st row.
  3. **Middle Line**: All 5 numbers on the 2nd row.
  4. **Bottom Line**: All 5 numbers on the 3rd row.
  5. **Four Corners**: First and last numbers of the top row, and first and last numbers of the bottom row.
  6. **Full House**: All 15 numbers on the ticket.
- **Authoritative Server Verification & Atomic Claims**:
  - Validated by trusted Next.js Route Handlers and atomic Postgres database functions.
  - False / bogus claims are safely rejected.
  - Confirmed winners trigger triumphant fanfares, room alerts, and celebratory full-screen confetti.
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
│   │   ├── room/[code]/page.tsx   # Supabase Realtime live multiplayer room
│   │   ├── stats/[code]/page.tsx  # Room leaderboard & round history
│   │   └── api/rooms/             # Serverless Next.js Route Handlers (Start, Call, Claim, etc.)
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
│       ├── supabase/
│       │   ├── client.ts          # Browser Supabase client (Publishable key)
│       │   ├── server.ts          # Server-only client for Route Handlers
│       │   ├── types.ts           # Generated Database types
│       │   └── game-service.ts    # Authoritative multiplayer operations & Realtime broadcasting
│       └── game/
│           ├── types.ts           # GameState, WinningCategory contracts
│           ├── ticket-generator.ts# Indian Tambola 3x9 ticket generator & validator
│           └── winning-checker.ts # Authoritative win validation
├── supabase/
│   ├── schema.sql                 # Complete SQL schema, RLS policies, and RPCs
│   └── migrations/
│       └── 20261016_initial_housie_schema.sql # Version-controlled migration
```

---

## 🚀 Setup & Deployment Guide

Follow these 8 steps to run locally and deploy to Vercel with your Supabase project:

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure the Supabase Project
You have an existing Supabase project:
- **Project URL**: `https://zqnzakkmnwcygmeuwkgs.supabase.co`
- **Publishable Key**: `sb_publishable_NLSuRmc53NSj8i0byzBL2w_KuYQvfQO`

### Step 3: Apply Database Migrations in Supabase
1. Open the [Supabase Dashboard](https://supabase.com/dashboard) and select your project (`zqnzakkmnwcygmeuwkgs`).
2. Navigate to the **SQL Editor** on the left navigation bar.
3. Open [`supabase/schema.sql`](file:///c:/Users/samee/OneDrive/Desktop/New%20folder/supabase/schema.sql) in this repository and copy its entire contents.
4. Paste into the SQL Editor and click **Run**.
5. This automatically creates:
   - Tables: `rooms`, `players`, `game_rounds`, `tickets`, `winning_claims`.
   - Indexes and constraints (preventing race conditions and duplicate claims).
   - Row Level Security (RLS) policies protecting tickets and rooms.
   - Atomic RPC functions: `rpc_call_next_number` and `rpc_record_winning_claim`.
   - Realtime publication: adds tables to `supabase_realtime`.

### Step 4: Configure Local Environment Variables
Create or verify `.env.local` in the project root:
```env
NEXT_PUBLIC_SUPABASE_URL=https://zqnzakkmnwcygmeuwkgs.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_NLSuRmc53NSj8i0byzBL2w_KuYQvfQO
PORT=3000
NODE_ENV=development
```

### Step 5: Run the Website Locally
Start the Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 6: Connect the GitHub Repository to Vercel
1. Push your changes to your GitHub repository:
   ```bash
   git push origin main
   ```
2. Go to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import your repository: `shaiksameer-builds/housie`.
4. Framework Preset: **Next.js** (detected automatically).

### Step 7: Configure Production Environment Variables on Vercel
In the Vercel project deployment settings, add the following Environment Variables:

| Variable Name | Value | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://zqnzakkmnwcygmeuwkgs.supabase.co` | Supabase API URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_NLSuRmc53NSj8i0byzBL2w_KuYQvfQO` | Client-safe publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | *(Optional, from Supabase Dashboard > Settings > API)* | Privileged server RPCs |

### Step 8: Deploy and Test the Live Website
1. Click **Deploy** in Vercel.
2. Once deployed, open your live URL (e.g. `https://housie.vercel.app`).
3. **Multi-device Testing**:
   - Create a room on your desktop/laptop as Host.
   - Copy the invitation link or 6-letter room code.
   - Open the link on an iPhone or Android phone.
   - Enter player names (e.g. *"Pooja 🌟"* and *"Vicky"*).
   - Start the round, call numbers, dab your 3×9 tickets, and claim prizes in real time!

---

## 🧪 Testing

Run all unit & game logic tests with Vitest:
```bash
npm test
```
*Current test suite: 19/19 passing tests covering 3×9 ticket generation, column uniqueness, 1–90 ranges, Four Corners, Early 5, Full House, and claim verification.*

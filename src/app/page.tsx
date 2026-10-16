'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Play,
  Users,
  Trophy,
  ShieldCheck,
  CheckCircle2,
  Dice5,
  Volume2,
  Copy,
  ChevronRight,
  Flame,
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  const [displayName, setDisplayName] = useState('');
  const [createRoomName, setCreateRoomName] = useState('');
  const [joinRoomCode, setJoinRoomCode] = useState('');

  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Load saved display name and check query params for room code
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('housie_player_name');
      if (saved) {
        setDisplayName(saved);
      }

      // Check URL query parameters (e.g. ?room=ABCDEF or ?code=ABCDEF)
      const params = new URLSearchParams(window.location.search);
      const codeFromQuery = params.get('room') || params.get('code') || params.get('join');
      if (codeFromQuery) {
        setJoinRoomCode(codeFromQuery.toUpperCase().trim());
      }
    }
  }, []);

  const saveName = (name: string) => {
    setDisplayName(name);
    if (typeof window !== 'undefined') {
      localStorage.setItem('housie_player_name', name.trim());
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanName = displayName.trim();
    if (!cleanName) {
      setErrorMessage('Please enter your display name (e.g. your name, nickname, or emoji).');
      return;
    }
    if (cleanName.length < 2 || cleanName.length > 20) {
      setErrorMessage('Display name must be between 2 and 20 characters.');
      return;
    }

    const roomName = createRoomName.trim() || `${cleanName}'s Game Night`;

    try {
      setIsCreating(true);
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: roomName }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create room.');
      }

      // Cache player name for automatic room entry
      sessionStorage.setItem(`housie_name_${data.roomCode}`, cleanName);
      router.push(`/room/${data.roomCode}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong creating the room.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanName = displayName.trim();
    if (!cleanName) {
      setErrorMessage('Please enter your display name.');
      return;
    }
    if (cleanName.length < 2 || cleanName.length > 20) {
      setErrorMessage('Display name must be between 2 and 20 characters.');
      return;
    }

    const code = joinRoomCode.trim().toUpperCase();
    if (code.length !== 6) {
      setErrorMessage('Room code must be exactly 6 characters.');
      return;
    }

    sessionStorage.setItem(`housie_name_${code}`, cleanName);
    router.push(`/room/${code}`);
  };

  return (
    <main className="min-h-screen bg-festive-950 text-slate-100 flex flex-col justify-between selection:bg-festive-gold selection:text-festive-950">
      {/* Top Navbar */}
      <header className="border-b border-festive-800/80 bg-festive-900/80 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-festive-gold to-amber-300 flex items-center justify-center font-black text-festive-950 text-xl shadow-lg shadow-festive-gold/25 ring-2 ring-festive-gold/30">
            🎲
          </div>
          <div>
            <h1 className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-400 bg-clip-text text-transparent">
              Housie Night
            </h1>
            <p className="text-[11px] text-purple-300/80 font-medium hidden sm:block">
              Online Multiplayer Tambola Game
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-festive-gold bg-festive-gold/10 border border-festive-gold/30 px-3 py-1.5 rounded-full shadow-sm">
            <span className="w-2 h-2 rounded-full bg-festive-gold animate-pulse" />
            <span>Zero Sign-Up Required</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 flex-1 flex flex-col justify-center">
        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-950/90 border border-rose-700/80 text-rose-200 text-sm flex items-center justify-between max-w-2xl mx-auto w-full shadow-xl animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage('')}
              className="text-rose-400 hover:text-white ml-4 font-bold text-base px-2 py-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-festive-850 border border-festive-700/80 text-amber-300 text-xs font-bold mb-4 shadow-md">
            <Sparkles className="w-3.5 h-3.5 text-festive-gold" />
            <span>Authentic 3 × 9 Indian Tambola with Real-Time Multiplayer</span>
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white mb-4 leading-tight">
            Play Housie Together,{' '}
            <span className="bg-gradient-to-r from-festive-gold via-amber-300 to-yellow-200 bg-clip-text text-transparent">
              Anywhere.
            </span>
          </h2>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Gather your family and friends for a thrilling game night! Authentic 15-number tickets, synchronized 1–90 caller, audio nicknames, and instant server-verified prizes.
          </p>
        </div>

        {/* Shared Display Name Card */}
        <div className="max-w-md mx-auto w-full mb-8 bg-festive-900/90 border border-festive-800 rounded-2xl p-5 shadow-xl relative overflow-hidden backdrop-blur-sm">
          <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-2">
            Your Player Display Name
          </label>
          <div className="relative">
            <input
              type="text"
              value={displayName}
              onChange={(e) => saveName(e.target.value)}
              placeholder="e.g. Pooja 🌟, Vicky, Dadi 👵"
              maxLength={20}
              className="w-full bg-festive-950 border border-festive-700 rounded-xl px-4 py-3 text-base text-white placeholder-slate-500 focus:outline-none focus:border-festive-gold focus:ring-1 focus:ring-festive-gold transition-all"
            />
          </div>
          <p className="text-[11px] text-purple-300/70 mt-1.5">
            Choose any nickname or emoji. Saved locally on your device for fast access.
          </p>
        </div>

        {/* Action Cards: Create Room & Join Room */}
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto w-full mb-16">
          {/* Create Room Card */}
          <div className="bg-festive-900/90 border border-festive-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between hover:border-festive-700/80 transition-all group">
            <div className="absolute top-0 right-0 w-44 h-44 bg-festive-gold/10 rounded-full blur-3xl pointer-events-none group-hover:bg-festive-gold/15 transition-all" />
            <div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-festive-gold to-amber-400 text-festive-950 flex items-center justify-center mb-5 shadow-lg shadow-festive-gold/20">
                <Play className="w-6 h-6 fill-festive-950 translate-x-0.5" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2">Create a Game Room</h3>
              <p className="text-purple-200/80 text-sm mb-6 leading-relaxed">
                Be the host! Open a private lobby, configure winning prizes, and control number calling (manual or auto-caller with voice).
              </p>

              <form onSubmit={handleCreateRoom} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Room Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={createRoomName}
                    onChange={(e) => setCreateRoomName(e.target.value)}
                    placeholder="e.g. Family Sunday Housie"
                    maxLength={40}
                    className="w-full bg-festive-950 border border-festive-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-festive-gold transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full mt-2 bg-gradient-to-r from-festive-gold via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-festive-950 font-black py-4 px-5 rounded-2xl shadow-xl shadow-festive-gold/20 text-base flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-[0.98]"
                >
                  {isCreating ? (
                    <span>Creating Room...</span>
                  ) : (
                    <>
                      <span>Create Room</span>
                      <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Join Room Card */}
          <div className="bg-festive-900/90 border border-festive-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between hover:border-festive-700/80 transition-all group">
            <div className="absolute top-0 right-0 w-44 h-44 bg-purple-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-500/15 transition-all" />
            <div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-400 text-white flex items-center justify-center mb-5 shadow-lg shadow-purple-500/20">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2">Join with Room Code</h3>
              <p className="text-purple-200/80 text-sm mb-6 leading-relaxed">
                Got a 6-letter room code or link from a friend? Enter the code below and jump straight into the game room.
              </p>

              <form onSubmit={handleJoinRoom} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    6-Letter Room Code
                  </label>
                  <input
                    type="text"
                    value={joinRoomCode}
                    onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase().trim())}
                    placeholder="e.g. HN87AB"
                    maxLength={6}
                    className="w-full bg-festive-950 border border-festive-700/80 rounded-xl px-4 py-3 text-base text-white placeholder-slate-500 tracking-widest font-mono uppercase focus:outline-none focus:border-purple-400 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isJoining}
                  className="w-full mt-2 bg-festive-800 hover:bg-festive-700 border border-festive-600/80 text-white font-bold py-4 px-5 rounded-2xl shadow-xl text-base flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-[0.98]"
                >
                  {isJoining ? (
                    <span>Entering Room...</span>
                  ) : (
                    <>
                      <span>Join Room</span>
                      <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* How to Play Section */}
        <div className="bg-festive-900/60 border border-festive-800 rounded-3xl p-6 sm:p-10 max-w-4xl mx-auto w-full shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-3 mb-6">
            <Dice5 className="w-7 h-7 text-festive-gold" />
            <div>
              <h3 className="text-2xl font-black text-white">How to Play Housie Night</h3>
              <p className="text-xs text-purple-300/80">Rules, tickets, and winning categories</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 text-sm">
            <div className="bg-festive-950/70 p-4 rounded-2xl border border-festive-800/80 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-amber-300 mb-2 flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-festive-gold flex-shrink-0" />
                  <span>Authentic 3 × 9 Ticket</span>
                </h4>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Every player gets a genuine Indian Tambola ticket: 3 rows, 9 columns, with exactly 15 numbers (5 numbers and 4 blanks per row) arranged in ascending column order.
                </p>
              </div>
            </div>

            <div className="bg-festive-950/70 p-4 rounded-2xl border border-festive-800/80 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-amber-300 mb-2 flex items-center gap-2 text-sm">
                  <Volume2 className="w-4 h-4 text-festive-gold flex-shrink-0" />
                  <span>Real-Time Calling</span>
                </h4>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Numbers from 1 to 90 are drawn randomly without repetition. The board highlights called numbers and speaks traditional nicknames aloud!
                </p>
              </div>
            </div>

            <div className="bg-festive-950/70 p-4 rounded-2xl border border-festive-800/80 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-amber-300 mb-2 flex items-center gap-2 text-sm">
                  <Trophy className="w-4 h-4 text-festive-gold flex-shrink-0" />
                  <span>6 Winning Categories</span>
                </h4>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Compete for Early Five (first 5 called), Top Line, Middle Line, Bottom Line, Four Corners, and the coveted Full House (all 15 numbers).
                </p>
              </div>
            </div>

            <div className="bg-festive-950/70 p-4 rounded-2xl border border-festive-800/80 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-amber-300 mb-2 flex items-center gap-2 text-sm">
                  <ShieldCheck className="w-4 h-4 text-festive-gold flex-shrink-0" />
                  <span>Authoritative Verification</span>
                </h4>
                <p className="text-slate-300 text-xs leading-relaxed">
                  When you claim a prize, the server immediately validates your ticket against actual called numbers. No bogus claims or false disputes!
                </p>
              </div>
            </div>

            <div className="bg-festive-950/70 p-4 rounded-2xl border border-festive-800/80 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-amber-300 mb-2 flex items-center gap-2 text-sm">
                  <Copy className="w-4 h-4 text-festive-gold flex-shrink-0" />
                  <span>Instant Link Sharing</span>
                </h4>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Share a direct invitation link or 6-letter room code via WhatsApp, Telegram, or text message. Friends join with one tap on phone, tablet, or desktop.
                </p>
              </div>
            </div>

            <div className="bg-festive-950/70 p-4 rounded-2xl border border-festive-800/80 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-amber-300 mb-2 flex items-center gap-2 text-sm">
                  <Flame className="w-4 h-4 text-festive-gold flex-shrink-0" />
                  <span>Auto Reconnection</span>
                </h4>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Accidentally refreshed your page or switched tabs on your phone? Your session token securely restores your ticket and game progress automatically!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-festive-800/60 bg-festive-950/90 py-6 text-center text-xs text-purple-300/60">
        <p>
          Housie Night &copy; {new Date().getFullYear()} &mdash; Real-Time Multiplayer Tambola Game &bull; Built with Next.js, Node.js &amp; Socket.IO
        </p>
      </footer>
    </main>
  );
}

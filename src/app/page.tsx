'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Play, Trophy, Sparkles, ShieldCheck, Dice5, CheckCircle2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  const [createName, setCreateName] = useState('');
  const [createHostName, setCreateHostName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('');

  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!createName.trim()) {
      setErrorMessage('Please provide a room name.');
      return;
    }
    if (!createHostName.trim()) {
      setErrorMessage('Please provide your host display name.');
      return;
    }

    try {
      setIsCreating(true);
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: createName.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create room');
      }

      // Store player name in sessionStorage for automatic join
      sessionStorage.setItem(`housie_name_${data.roomCode}`, createHostName.trim());
      router.push(`/room/${data.roomCode}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) {
      setErrorMessage('Room code must be exactly 6 characters.');
      return;
    }
    if (!joinName.trim()) {
      setErrorMessage('Please enter your display name.');
      return;
    }

    sessionStorage.setItem(`housie_name_${code}`, joinName.trim());
    router.push(`/room/${code}`);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-emerald-500/20">
            H
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-emerald-400 bg-clip-text text-transparent">
              Housie Live
            </h1>
            <p className="text-xs text-slate-400">Real-time multiplayer game night</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          No Signup Required
        </div>
      </header>

      {/* Main Body */}
      <div className="max-w-6xl mx-auto w-full px-4 py-12 flex-1 flex flex-col justify-center">
        {errorMessage && (
          <div className="mb-8 p-4 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-sm flex items-center justify-between max-w-2xl mx-auto w-full">
            <span>{errorMessage}</span>
            <button
              onClick={() => setErrorMessage('')}
              className="text-rose-400 hover:text-white ml-4 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-emerald-400 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Synchronized 1–100 Number Calling
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
            Play Housie Together,{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              In Real Time.
            </span>
          </h2>
          <p className="text-slate-400 text-base md:text-lg">
            Create a private room in seconds. Invite friends with a link. Everyone gets a unique{' '}
            <span className="text-emerald-300 font-medium">6 × 5 custom ticket</span> with automatic
            server-side verification.
          </p>
        </div>

        {/* Action Cards: Create & Join */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full mb-16">
          {/* Create Room Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5">
                <Play className="w-6 h-6 fill-emerald-400/20" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Create a Private Room</h3>
              <p className="text-slate-400 text-sm mb-6">
                Host a game, configure winning categories, and control the caller (manual or automatic).
              </p>

              <form onSubmit={handleCreateRoom} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Room Name
                  </label>
                  <input
                    type="text"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="e.g. Friday Game Night"
                    maxLength={50}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Your Host Display Name
                  </label>
                  <input
                    type="text"
                    value={createHostName}
                    onChange={(e) => setCreateHostName(e.target.value)}
                    placeholder="e.g. Sameer"
                    maxLength={20}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full mt-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50"
                >
                  {isCreating ? 'Creating Room...' : 'Create & Host Room'}
                </button>
              </form>
            </div>
          </div>

          {/* Join Room Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-5">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Join Existing Room</h3>
              <p className="text-slate-400 text-sm mb-6">
                Have a 6-letter room code from your friends? Enter it below along with your name.
              </p>

              <form onSubmit={handleJoinRoom} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    6-Character Room Code
                  </label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="e.g. AB12CD"
                    maxLength={6}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 tracking-widest font-mono uppercase focus:outline-none focus:border-teal-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Your Display Name
                  </label>
                  <input
                    type="text"
                    value={joinName}
                    onChange={(e) => setJoinName(e.target.value)}
                    placeholder="e.g. Priya"
                    maxLength={20}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isJoining}
                  className="w-full mt-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all disabled:opacity-50"
                >
                  Join Room
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Game Rules / Custom Ticket Explanation */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-8 max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-3 mb-6">
            <Dice5 className="w-6 h-6 text-emerald-400" />
            <h3 className="text-xl font-bold text-white">How This Custom Housie Works</h3>
          </div>

          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/60">
              <h4 className="font-bold text-emerald-400 mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> 6 × 5 Custom Ticket
              </h4>
              <p className="text-slate-400">
                Unlike traditional 3×9 Tambola, every ticket has exactly 6 rows and 5 columns (30 unique numbers from 1–100) randomly distributed.
              </p>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/60">
              <h4 className="font-bold text-emerald-400 mb-2 flex items-center gap-2">
                <Trophy className="w-4 h-4" /> 8 Winning Categories
              </h4>
              <p className="text-slate-400">
                Early Five (first 5 numbers called on ticket), 6 individual rows (Row 1 to Row 6), and the grand Full House (all 30 numbers).
              </p>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/60">
              <h4 className="font-bold text-emerald-400 mb-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Server-Verified
              </h4>
              <p className="text-slate-400">
                All winning claims are validated authoritatively on the server. Simultaneous claims are resolved safely and transparently.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        Housie Live &copy; {new Date().getFullYear()} &mdash; Real-Time Multiplayer Tambola
      </footer>
    </main>
  );
}

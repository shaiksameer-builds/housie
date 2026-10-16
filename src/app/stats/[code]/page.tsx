'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trophy, Users, Hash, Calendar, Award } from 'lucide-react';
import { WINNING_CATEGORY_LABELS, WinningCategory } from '@/lib/game/types';

interface RoomStatsData {
  roomCode: string;
  roomName: string;
  totalRounds: number;
  totalPlayers: number;
  totalClaims: number;
  totalNumbersCalled: number;
  createdAt: string;
  lastActivity: string;
  players: Array<{
    id: string;
    displayName: string;
    isHost: boolean;
    isConnected: boolean;
  }>;
  roundHistory: Array<{
    roundId: string;
    roundNumber: number;
    status: string;
    totalNumbersCalled: number;
    claims: Array<{
      category: string;
      playerName: string;
      playerId: string;
      calledNumberIndex: number;
      claimedAt: string;
    }>;
    startedAt: string | null;
    completedAt: string | null;
    duration: number | null;
  }>;
}

export default function RoomStatsPage() {
  const params = useParams();
  const roomCode = (params.code as string)?.toUpperCase();

  const [stats, setStats] = useState<RoomStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!roomCode) return;
    fetch(`/api/rooms/${roomCode}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load room statistics');
        return res.json();
      })
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [roomCode]);

  if (loading) {
    return (
      <main className="min-h-screen bg-festive-950 text-slate-100 flex items-center justify-center p-4">
        <div className="text-purple-300 text-sm font-semibold animate-pulse">Loading statistics...</div>
      </main>
    );
  }

  if (error || !stats) {
    return (
      <main className="min-h-screen bg-festive-950 text-slate-100 flex items-center justify-center p-4">
        <div className="bg-festive-900 border border-festive-800 rounded-3xl p-8 max-w-md w-full text-center shadow-xl">
          <p className="text-rose-400 font-bold mb-4">{error || 'Stats unavailable'}</p>
          <Link
            href="/"
            className="inline-block bg-festive-800 hover:bg-festive-700 text-white font-bold py-2.5 px-5 rounded-xl text-sm"
          >
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  // Calculate player win leaderboard
  const playerWins = new Map<string, { name: string; wins: number; fullHouseWins: number }>();
  stats.roundHistory.forEach((r) => {
    r.claims.forEach((c) => {
      const entry = playerWins.get(c.playerId) || {
        name: c.playerName,
        wins: 0,
        fullHouseWins: 0,
      };
      entry.wins += 1;
      if (c.category === 'full_house') entry.fullHouseWins += 1;
      playerWins.set(c.playerId, entry);
    });
  });

  const leaderboard = Array.from(playerWins.values()).sort((a, b) => b.wins - a.wins);

  return (
    <main className="min-h-screen bg-festive-950 text-slate-100 pb-16 selection:bg-festive-gold selection:text-festive-950">
      {/* Navbar */}
      <header className="border-b border-festive-800/80 bg-festive-900/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/room/${roomCode}`}
            className="w-9 h-9 rounded-xl bg-festive-850 hover:bg-festive-800 border border-festive-700/80 flex items-center justify-center text-purple-200 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-extrabold text-lg text-white">Room Leaderboard &amp; Stats</h1>
            <p className="text-xs text-purple-200/70">
              {stats.roomName} &bull; <span className="font-mono text-amber-300 font-bold">{roomCode}</span>
            </p>
          </div>
        </div>

        <Link
          href={`/room/${roomCode}`}
          className="bg-gradient-to-r from-festive-gold to-amber-400 hover:from-amber-400 text-festive-950 font-black py-2.5 px-4 rounded-xl text-xs shadow-lg transition-all"
        >
          Return to Game
        </Link>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-festive-900/90 border border-festive-800 rounded-3xl p-5 shadow-xl">
            <span className="text-xs text-purple-200/70 block mb-1 flex items-center gap-1.5 font-semibold">
              <Trophy className="w-4 h-4 text-festive-gold" /> Total Rounds
            </span>
            <span className="text-2xl font-black text-white">{stats.totalRounds}</span>
          </div>

          <div className="bg-festive-900/90 border border-festive-800 rounded-3xl p-5 shadow-xl">
            <span className="text-xs text-purple-200/70 block mb-1 flex items-center gap-1.5 font-semibold">
              <Users className="w-4 h-4 text-festive-gold" /> Players
            </span>
            <span className="text-2xl font-black text-white">{stats.totalPlayers}</span>
          </div>

          <div className="bg-festive-900/90 border border-festive-800 rounded-3xl p-5 shadow-xl">
            <span className="text-xs text-purple-200/70 block mb-1 flex items-center gap-1.5 font-semibold">
              <Award className="w-4 h-4 text-festive-gold" /> Total Claims Won
            </span>
            <span className="text-2xl font-black text-white">{stats.totalClaims}</span>
          </div>

          <div className="bg-festive-900/90 border border-festive-800 rounded-3xl p-5 shadow-xl">
            <span className="text-xs text-purple-200/70 block mb-1 flex items-center gap-1.5 font-semibold">
              <Hash className="w-4 h-4 text-festive-gold" /> Numbers Called
            </span>
            <span className="text-2xl font-black text-white">{stats.totalNumbersCalled}</span>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-festive-900/90 border border-festive-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-festive-gold" />
            <h3 className="font-extrabold text-white text-lg">Player Leaderboard</h3>
          </div>

          {leaderboard.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-festive-800 text-xs text-purple-300 uppercase tracking-wider">
                    <th className="pb-3 px-4">Rank</th>
                    <th className="pb-3 px-4">Player</th>
                    <th className="pb-3 px-4 text-right">Total Wins</th>
                    <th className="pb-3 px-4 text-right">Full Houses</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-festive-800/60">
                  {leaderboard.map((player, idx) => (
                    <tr key={player.name} className="hover:bg-festive-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-400">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                      </td>
                      <td className="py-3 px-4 font-bold text-white">{player.name}</td>
                      <td className="py-3 px-4 text-right font-extrabold text-amber-300">{player.wins}</td>
                      <td className="py-3 px-4 text-right font-bold text-festive-gold">
                        {player.fullHouseWins}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-purple-300/50 py-4 text-center">No category claims recorded yet.</p>
          )}
        </div>

        {/* Round History */}
        <div className="bg-festive-900/90 border border-festive-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-festive-gold" />
            <h3 className="font-extrabold text-white text-lg">Round History</h3>
          </div>

          <div className="space-y-4">
            {stats.roundHistory.map((round) => (
              <div
                key={round.roundId}
                className="p-4 rounded-2xl bg-festive-950 border border-festive-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-white">Round {round.roundNumber}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        round.status === 'completed'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {round.status}
                    </span>
                  </div>
                  <p className="text-xs text-purple-200/70">
                    {round.totalNumbersCalled} numbers called
                    {round.duration ? ` • Duration: ${Math.floor(round.duration / 60)}m ${round.duration % 60}s` : ''}
                  </p>
                </div>

                {/* Claims in this round */}
                <div className="flex flex-wrap gap-2">
                  {round.claims.map((claim) => (
                    <span
                      key={claim.category}
                      className="text-xs bg-festive-900 border border-festive-800 px-3 py-1.5 rounded-xl text-slate-200 font-medium"
                    >
                      <strong className="text-amber-300">
                        {WINNING_CATEGORY_LABELS[claim.category as WinningCategory] || claim.category}:
                      </strong>{' '}
                      {claim.playerName}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

'use client';

import React from 'react';
import { Trophy, Clock, Hash, RotateCcw } from 'lucide-react';
import { WINNING_CATEGORY_LABELS, type CategoryClaim, type PlayerInfo, WinningCategory } from '@/lib/game/types';

interface ResultsModalProps {
  roundNumber: number;
  claims: CategoryClaim[];
  totalCalled: number;
  duration: number; // seconds
  isHost: boolean;
  onStartNextRound: () => void;
}

export function ResultsModal({
  roundNumber,
  claims,
  totalCalled,
  duration,
  isHost,
  onStartNextRound,
}: ResultsModalProps) {
  const formatSecs = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative overflow-hidden animate-in fade-in-50 zoom-in-95">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-3">
            <Trophy className="w-8 h-8 fill-amber-400/20" />
          </div>
          <h2 className="text-2xl font-black text-white">Round {roundNumber} Completed!</h2>
          <p className="text-slate-400 text-sm mt-1">Here is how the round finished</p>
        </div>

        {/* Round Summary Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
            <span className="text-xs text-slate-400 block mb-1 flex items-center justify-center gap-1">
              <Hash className="w-3.5 h-3.5" /> Numbers Called
            </span>
            <span className="text-xl font-bold text-white">{totalCalled} / 90</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
            <span className="text-xs text-slate-400 block mb-1 flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Duration
            </span>
            <span className="text-xl font-bold text-white">{formatSecs(duration)}</span>
          </div>
        </div>

        {/* Winners List */}
        <div className="mb-6">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Confirmed Category Winners
          </h4>
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {claims.length > 0 ? (
              claims.map((claim) => (
                <div
                  key={claim.category}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-sm"
                >
                  <span className="font-semibold text-white">
                    {WINNING_CATEGORY_LABELS[claim.category as WinningCategory] || claim.category}
                  </span>
                  <span className="font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-0.5 rounded-lg text-xs">
                    🏆 {claim.playerName}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">No categories were claimed this round.</p>
            )}
          </div>
        </div>

        {/* Action Button */}
        {isHost ? (
          <button
            type="button"
            onClick={onStartNextRound}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all"
          >
            <RotateCcw className="w-4 h-4" /> Start Next Round
          </button>
        ) : (
          <p className="text-center text-xs text-slate-400">Waiting for host to begin the next round...</p>
        )}
      </div>
    </div>
  );
}

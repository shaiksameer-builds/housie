'use client';

import React from 'react';
import { Trophy, Clock, Hash, RotateCcw } from 'lucide-react';
import { WINNING_CATEGORY_LABELS, type CategoryClaim, WinningCategory } from '@/lib/game/types';

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
    <div className="fixed inset-0 z-50 bg-festive-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-festive-900 border border-festive-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden animate-pop">
        <div className="absolute top-0 right-0 w-44 h-44 bg-festive-gold/15 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-festive-gold to-amber-300 text-festive-950 flex items-center justify-center mx-auto mb-3 shadow-xl shadow-festive-gold/25 ring-2 ring-festive-gold/30">
            <Trophy className="w-8 h-8 fill-festive-950" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">Round {roundNumber} Completed!</h2>
          <p className="text-purple-200/70 text-xs sm:text-sm mt-1">
            Congratulations to all the round winners!
          </p>
        </div>

        {/* Round Summary Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-festive-950/80 p-3.5 rounded-2xl border border-festive-800 text-center">
            <span className="text-[11px] text-purple-300/70 block mb-1 flex items-center justify-center gap-1 font-semibold">
              <Hash className="w-3.5 h-3.5 text-festive-gold" /> Numbers Called
            </span>
            <span className="text-xl font-black text-white">{totalCalled} / 90</span>
          </div>
          <div className="bg-festive-950/80 p-3.5 rounded-2xl border border-festive-800 text-center">
            <span className="text-[11px] text-purple-300/70 block mb-1 flex items-center justify-center gap-1 font-semibold">
              <Clock className="w-3.5 h-3.5 text-festive-gold" /> Round Duration
            </span>
            <span className="text-xl font-black text-white">{formatSecs(duration)}</span>
          </div>
        </div>

        {/* Winners List */}
        <div className="mb-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-3">
            Confirmed Category Winners
          </h4>
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {claims.length > 0 ? (
              claims.map((claim) => (
                <div
                  key={claim.category}
                  className="flex items-center justify-between p-3 rounded-2xl bg-festive-950 border border-festive-800/80 text-sm shadow-sm"
                >
                  <span className="font-bold text-white">
                    {WINNING_CATEGORY_LABELS[claim.category as WinningCategory] || claim.category}
                  </span>
                  <span className="font-extrabold text-amber-300 bg-festive-gold/15 border border-festive-gold/40 px-3 py-1 rounded-xl text-xs flex items-center gap-1">
                    🏆 {claim.playerName}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-purple-300/50 text-center py-4">
                No categories were claimed in this round.
              </p>
            )}
          </div>
        </div>

        {/* Action Button */}
        {isHost ? (
          <button
            type="button"
            onClick={onStartNextRound}
            className="w-full bg-gradient-to-r from-festive-gold via-amber-400 to-yellow-400 hover:from-amber-400 text-festive-950 font-black py-4 px-5 rounded-2xl text-base flex items-center justify-center gap-2 shadow-xl shadow-festive-gold/25 transition-all active:scale-95"
          >
            <RotateCcw className="w-5 h-5 stroke-[2.5]" />
            <span>Start Next Round</span>
          </button>
        ) : (
          <p className="text-center text-xs text-purple-200/70">
            Waiting for the host to begin the next round...
          </p>
        )}
      </div>
    </div>
  );
}

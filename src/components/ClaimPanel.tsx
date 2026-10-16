'use client';

import React from 'react';
import { Trophy, CheckCircle, ShieldAlert } from 'lucide-react';
import { WinningCategory, WINNING_CATEGORY_LABELS, type CategoryClaim } from '@/lib/game/types';

interface ClaimPanelProps {
  enabledCategories: WinningCategory[];
  claims: CategoryClaim[];
  currentUserId: string;
  onClaim: (category: WinningCategory) => void;
  isClaiming: boolean;
}

export function ClaimPanel({
  enabledCategories,
  claims,
  currentUserId,
  onClaim,
  isClaiming,
}: ClaimPanelProps) {
  const claimMap = new Map<string, CategoryClaim>();
  claims.forEach((c) => claimMap.set(c.category, c));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-amber-400" />
        <h3 className="font-bold text-white text-base md:text-lg">Winning Categories</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {enabledCategories.map((category) => {
          const claim = claimMap.get(category);
          const isWon = Boolean(claim);
          const isMyWin = claim?.playerId === currentUserId;

          return (
            <div
              key={category}
              className={`rounded-xl p-3 border transition-all flex flex-col justify-between ${
                isWon
                  ? isMyWin
                    ? 'bg-emerald-950/60 border-emerald-500/80 shadow-md shadow-emerald-500/10'
                    : 'bg-slate-950/80 border-slate-800'
                  : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="mb-2">
                <span className="text-xs font-semibold text-slate-400 block mb-1">
                  {WINNING_CATEGORY_LABELS[category]}
                </span>
                {isWon ? (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{claim?.playerName} {isMyWin && '(You)'}</span>
                  </div>
                ) : (
                  <span className="text-xs text-amber-500/90 font-medium">Unclaimed</span>
                )}
              </div>

              {!isWon && (
                <button
                  type="button"
                  disabled={isClaiming}
                  onClick={() => onClaim(category)}
                  className="w-full mt-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold py-1.5 px-3 rounded-lg text-xs transition-colors disabled:opacity-50"
                >
                  Claim Win
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

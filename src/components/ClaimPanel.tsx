'use client';

import React from 'react';
import { Trophy, CheckCircle, Sparkles } from 'lucide-react';
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
    <div className="bg-festive-900/90 border border-festive-800 rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-festive-gold/20 text-festive-gold flex items-center justify-center">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-white text-base sm:text-lg">Winning Prizes</h3>
            <p className="text-[11px] text-purple-200/70">
              Tap &ldquo;Claim&rdquo; when your ticket achieves a category
            </p>
          </div>
        </div>

        <span className="text-xs bg-festive-850 text-amber-300 font-mono font-bold px-2.5 py-1 rounded-full border border-festive-700">
          {claims.length} / {enabledCategories.length} Won
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {enabledCategories.map((category) => {
          const claim = claimMap.get(category);
          const isWon = Boolean(claim);
          const isMyWin = claim?.playerId === currentUserId;

          return (
            <div
              key={category}
              className={`rounded-2xl p-3.5 border transition-all flex flex-col justify-between ${
                isWon
                  ? isMyWin
                    ? 'bg-emerald-950/80 border-emerald-400 shadow-lg shadow-emerald-500/10'
                    : 'bg-festive-950/80 border-festive-800/80'
                  : 'bg-festive-950/50 border-festive-800 hover:border-festive-700'
              }`}
            >
              <div className="mb-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-amber-200">
                    {WINNING_CATEGORY_LABELS[category] || category}
                  </span>
                  {category === WinningCategory.FULL_HOUSE && (
                    <span className="text-[10px] bg-festive-gold/20 text-amber-300 font-bold px-1.5 py-0.5 rounded">
                      Grand
                    </span>
                  )}
                </div>

                {isWon ? (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/60 p-1.5 rounded-lg border border-emerald-500/30">
                    <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">
                      {claim?.playerName} {isMyWin && '(You! 🎉)'}
                    </span>
                  </div>
                ) : (
                  <span className="text-[11px] text-purple-300/60 font-medium">Available</span>
                )}
              </div>

              {!isWon && (
                <button
                  type="button"
                  disabled={isClaiming}
                  onClick={() => onClaim(category)}
                  className="w-full mt-1.5 bg-gradient-to-r from-festive-gold via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-festive-950 font-black py-2 px-3 rounded-xl text-xs shadow-md shadow-festive-gold/15 transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 fill-festive-950" />
                  <span>Claim {WINNING_CATEGORY_LABELS[category]}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

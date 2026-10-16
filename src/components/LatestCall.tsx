'use client';

import React from 'react';
import { Sparkles, Hash, History, Volume2, VolumeX } from 'lucide-react';
import { MAX_NUMBER } from '@/lib/game/types';
import { TAMBOLA_NICKNAMES } from '@/lib/audio';

interface LatestCallProps {
  lastCalledNumber: number | null;
  totalCalled: number;
  calledNumbers: number[];
  voiceEnabled: boolean;
  soundEnabled: boolean;
  onToggleVoice: () => void;
  onToggleSound: () => void;
}

export function LatestCall({
  lastCalledNumber,
  totalCalled,
  calledNumbers,
  voiceEnabled,
  soundEnabled,
  onToggleVoice,
  onToggleSound,
}: LatestCallProps) {
  const max = MAX_NUMBER || 90;
  const remaining = Math.max(0, max - totalCalled);

  // Recent 6 numbers called (excluding the current one)
  const recentHistory = calledNumbers.slice(-7, -1).reverse();
  const nickname = lastCalledNumber ? TAMBOLA_NICKNAMES[lastCalledNumber] : null;

  return (
    <div className="bg-festive-900/90 border border-festive-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col justify-between text-center relative overflow-hidden backdrop-blur-md">
      <div className="absolute top-0 right-0 w-36 h-36 bg-festive-gold/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header & Audio Toggles */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-festive-gold" /> Current Call
        </span>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleVoice}
            title={voiceEnabled ? 'Mute voice caller' : 'Enable voice caller'}
            className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all ${
              voiceEnabled
                ? 'bg-festive-800 border-festive-gold/40 text-amber-300'
                : 'bg-festive-950/70 border-festive-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            {voiceEnabled ? <Volume2 className="w-3.5 h-3.5 text-festive-gold" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="text-[10px] hidden sm:inline">{voiceEnabled ? 'Voice On' : 'Voice Off'}</span>
          </button>
        </div>
      </div>

      {/* Prominent Number Display */}
      <div className="my-2 flex flex-col items-center">
        {lastCalledNumber !== null ? (
          <div className="relative group">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-festive-gold via-amber-400 to-yellow-300 text-festive-950 flex items-center justify-center font-black text-5xl sm:text-6xl shadow-2xl shadow-festive-gold/30 ring-4 ring-festive-gold/40 animate-pop">
              {lastCalledNumber}
            </div>
            {nickname && (
              <div className="mt-2 text-xs font-bold text-amber-200/90 max-w-[200px] leading-tight line-clamp-2">
                &ldquo;{nickname}&rdquo;
              </div>
            )}
          </div>
        ) : (
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-festive-950 border-2 border-dashed border-festive-800 text-purple-300/40 flex items-center justify-center font-bold text-3xl">
            --
          </div>
        )}
      </div>

      {/* Recent Call History Ribbon */}
      {recentHistory.length > 0 && (
        <div className="mt-4 pt-3 border-t border-festive-800/80">
          <div className="flex items-center justify-between text-[11px] text-purple-300/80 mb-1.5 px-1 font-semibold">
            <span className="flex items-center gap-1">
              <History className="w-3 h-3 text-festive-gold" /> Previous Calls
            </span>
            <span className="text-[10px] text-slate-400 font-mono">recent</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 overflow-x-auto py-1">
            {recentHistory.map((num, idx) => (
              <span
                key={`${num}-${idx}`}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-festive-950 border border-festive-700/80 text-amber-200 text-xs sm:text-sm font-bold flex items-center justify-center shadow-inner"
              >
                {num}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Counters Footer */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-festive-800/60 text-xs text-slate-300 font-mono">
        <div className="flex items-center gap-1">
          <Hash className="w-3.5 h-3.5 text-festive-gold" />
          <span>Called: <strong className="text-white font-bold">{totalCalled}</strong></span>
        </div>
        <span className="text-purple-400/40">•</span>
        <div>
          Left: <strong className="text-amber-400 font-bold">{remaining}</strong>
        </div>
      </div>
    </div>
  );
}

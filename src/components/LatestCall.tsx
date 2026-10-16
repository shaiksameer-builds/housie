'use client';

import React from 'react';
import { Sparkles, Hash } from 'lucide-react';
import { MAX_NUMBER } from '@/lib/game/types';

interface LatestCallProps {
  lastCalledNumber: number | null;
  totalCalled: number;
}

export function LatestCall({ lastCalledNumber, totalCalled }: LatestCallProps) {
  const max = MAX_NUMBER || 90;
  const remaining = Math.max(0, max - totalCalled);

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center justify-center text-center relative overflow-hidden">
      <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Latest Called Number
      </span>

      <div className="my-2">
        {lastCalledNumber !== null ? (
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-black text-5xl sm:text-6xl shadow-2xl shadow-emerald-500/30 ring-4 ring-emerald-400/30 animate-in zoom-in-75 duration-200">
            {lastCalledNumber}
          </div>
        ) : (
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-slate-950 border-2 border-dashed border-slate-800 text-slate-600 flex items-center justify-center font-bold text-3xl">
            --
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 mt-3 text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-1">
          <Hash className="w-3.5 h-3.5 text-slate-500" />
          <span>Called: <strong className="text-white">{totalCalled}</strong></span>
        </div>
        <span>•</span>
        <div>
          Remaining: <strong className="text-emerald-400">{remaining}</strong>
        </div>
      </div>
    </div>
  );
}

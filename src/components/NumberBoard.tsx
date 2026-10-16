'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, LayoutGrid } from 'lucide-react';
import { MAX_NUMBER } from '@/lib/game/types';

interface NumberBoardProps {
  calledNumbers: number[];
  lastCalledNumber: number | null;
}

export function NumberBoard({ calledNumbers, lastCalledNumber }: NumberBoardProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const calledSet = new Set(calledNumbers);

  const total = MAX_NUMBER || 90;
  const allNumbers = Array.from({ length: total }, (_, i) => i + 1);

  return (
    <div className="bg-festive-900/90 border border-festive-800 rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-festive-800 flex items-center justify-center text-festive-gold">
            <LayoutGrid className="w-4 h-4" />
          </div>
          <h3 className="font-extrabold text-white text-base sm:text-lg">1–90 Number Board</h3>
          <span className="text-xs font-mono bg-festive-850 text-amber-300 font-bold px-2.5 py-0.5 rounded-full border border-festive-700">
            {calledNumbers.length} / {total}
          </span>
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-xs text-purple-200/80 hover:text-white flex items-center gap-1 bg-festive-800 px-2.5 py-1 rounded-lg border border-festive-700 sm:hidden"
        >
          <span>{isCollapsed ? 'Show Board' : 'Hide Board'}</span>
          {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>

      <div className={`${isCollapsed ? 'hidden sm:grid' : 'grid'} grid-cols-10 gap-1 sm:gap-1.5 pt-1`}>
        {allNumbers.map((num) => {
          const isCalled = calledSet.has(num);
          const isLatest = lastCalledNumber === num;

          return (
            <div
              key={num}
              className={`h-7 sm:h-8 rounded-lg flex items-center justify-center font-bold text-[11px] sm:text-xs transition-all select-none ${
                isLatest
                  ? 'bg-gradient-to-tr from-festive-gold to-amber-300 text-festive-950 font-black ring-2 ring-yellow-200 scale-105 z-10 shadow-lg shadow-festive-gold/40 animate-pop'
                  : isCalled
                  ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-400/60 font-black shadow-sm'
                  : 'bg-festive-950/60 text-purple-300/40 border border-festive-850/60'
              }`}
            >
              {num}
            </div>
          );
        })}
      </div>
    </div>
  );
}

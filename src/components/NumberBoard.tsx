'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface NumberBoardProps {
  calledNumbers: number[];
  lastCalledNumber: number | null;
}

export function NumberBoard({ calledNumbers, lastCalledNumber }: NumberBoardProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const calledSet = new Set(calledNumbers);

  // 1 to 100 array
  const allNumbers = Array.from({ length: 100 }, (_, i) => i + 1);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-white text-base md:text-lg">Number Board</h3>
          <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
            {calledNumbers.length} / 100 Called
          </span>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 sm:hidden"
        >
          {isCollapsed ? 'Show' : 'Hide'}
          {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>

      <div className={`${isCollapsed ? 'hidden sm:grid' : 'grid'} grid-cols-10 gap-1 sm:gap-1.5`}>
        {allNumbers.map((num) => {
          const isCalled = calledSet.has(num);
          const isLatest = lastCalledNumber === num;

          return (
            <div
              key={num}
              className={`h-7 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-all ${
                isLatest
                  ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-300 scale-105 z-10 shadow-lg shadow-emerald-500/30'
                  : isCalled
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-950/50 text-slate-600 border border-slate-800/40'
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

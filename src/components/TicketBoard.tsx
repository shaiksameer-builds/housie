'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface TicketBoardProps {
  ticket: number[][]; // 3x9 grid
  calledNumbers: number[];
  markedNumbers: Set<number>;
  onToggleMark: (num: number) => void;
}

export function TicketBoard({
  ticket,
  calledNumbers,
  markedNumbers,
  onToggleMark,
}: TicketBoardProps) {
  const calledSet = new Set(calledNumbers);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-white text-base md:text-lg">Your 3 × 9 Ticket</h3>
          <p className="text-xs text-slate-400">15 numbers across 3 rows and 9 columns. Tap to mark.</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-emerald-500/20 border border-emerald-500" />
            <span className="text-slate-400">Called</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-amber-500/20 border border-amber-500" />
            <span className="text-slate-400">Marked</span>
          </div>
        </div>
      </div>

      {/* 3 Rows x 9 Columns Grid */}
      <div className="space-y-2 overflow-x-auto pb-1">
        {ticket.map((row, rIdx) => {
          const nonZeros = row.filter((n) => n > 0);
          const isRowCompleted =
            nonZeros.length > 0 && nonZeros.every((num) => calledSet.has(num));

          return (
            <div key={rIdx} className="flex items-center gap-1.5 min-w-[500px]">
              <span className="text-[10px] font-mono text-slate-500 w-12 text-right">
                {rIdx === 0 ? 'Top' : rIdx === 1 ? 'Mid' : 'Btm'}
              </span>
              <div className="grid grid-cols-9 gap-1.5 flex-1">
                {row.map((num, cIdx) => {
                  const isEmpty = num === 0;
                  const isCalled = num > 0 && calledSet.has(num);
                  const isMarked = num > 0 && markedNumbers.has(num);

                  if (isEmpty) {
                    return (
                      <div
                        key={`empty-${rIdx}-${cIdx}`}
                        className="h-11 sm:h-12 rounded-xl bg-slate-950/40 border border-slate-900/60 flex items-center justify-center text-slate-700 select-none"
                      >
                        &bull;
                      </div>
                    );
                  }

                  return (
                    <button
                      key={`num-${rIdx}-${cIdx}-${num}`}
                      type="button"
                      onClick={() => onToggleMark(num)}
                      className={`h-11 sm:h-12 rounded-xl flex items-center justify-center font-bold text-sm sm:text-base transition-all relative select-none ${
                        isCalled && isMarked
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 ring-2 ring-emerald-300'
                          : isCalled
                          ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300'
                          : isMarked
                          ? 'bg-amber-950/60 border border-amber-500/60 text-amber-300'
                          : 'bg-slate-950 border border-slate-800 text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      {num}
                      {isMarked && (
                        <span className="absolute top-1 right-1">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {isRowCompleted && (
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-1.5 py-0.5 rounded">
                  ✓
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

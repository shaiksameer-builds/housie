'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface TicketBoardProps {
  ticket: number[][]; // 6x5 grid
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
          <h3 className="font-bold text-white text-base md:text-lg">Your 6 × 5 Ticket</h3>
          <p className="text-xs text-slate-400">30 unique numbers. Tap to mark/unmark.</p>
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

      {/* 6 Rows x 5 Columns Grid */}
      <div className="space-y-2">
        {ticket.map((row, rIdx) => {
          const isRowCompleted = row.every((num) => calledSet.has(num));
          return (
            <div key={rIdx} className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-500 w-8 text-right hidden sm:inline-block">
                R{rIdx + 1}
              </span>
              <div className="grid grid-cols-5 gap-2 flex-1">
                {row.map((num) => {
                  const isCalled = calledSet.has(num);
                  const isMarked = markedNumbers.has(num);

                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => onToggleMark(num)}
                      className={`h-11 sm:h-12 md:h-14 rounded-xl flex items-center justify-center font-bold text-base md:text-lg transition-all relative select-none ${
                        isCalled && isMarked
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 ring-2 ring-emerald-300'
                          : isCalled
                          ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300'
                          : isMarked
                          ? 'bg-amber-950/60 border border-amber-500/60 text-amber-300'
                          : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {num}
                      {isMarked && (
                        <span className="absolute top-1 right-1">
                          <Check className="w-3 h-3 stroke-[3]" />
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

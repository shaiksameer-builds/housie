'use client';

import React from 'react';
import { Check, Sparkles, CheckCircle2 } from 'lucide-react';
import { soundManager } from '@/lib/audio';

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

  const handleCellClick = (num: number) => {
    soundManager.playMarkDab();
    onToggleMark(num);
  };

  // Calculate ticket statistics
  const allTicketNumbers = ticket.flat().filter((n) => n > 0);
  const calledTicketNumbers = allTicketNumbers.filter((n) => calledSet.has(n));
  const markedTicketNumbers = allTicketNumbers.filter((n) => markedNumbers.has(n));

  return (
    <div className="bg-festive-900/90 border border-festive-800 rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-white text-base sm:text-lg">Your Tambola Ticket</h3>
            <span className="text-xs bg-festive-800 text-amber-300 font-bold px-2 py-0.5 rounded-md border border-festive-700">
              3 × 9 Grid
            </span>
          </div>
          <p className="text-xs text-purple-200/70 mt-0.5">
            15 unique numbers. Tap any cell to dab or un-dab.
          </p>
        </div>

        {/* Legend & Progress */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-[9px] text-emerald-300 font-bold">
              ●
            </span>
            <span className="text-slate-300 text-[11px]">Called ({calledTicketNumbers.length}/15)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-festive-gold/20 border border-festive-gold flex items-center justify-center text-[9px] text-amber-300 font-bold">
              ✓
            </span>
            <span className="text-slate-300 text-[11px]">Marked ({markedTicketNumbers.length})</span>
          </div>
        </div>
      </div>

      {/* Ticket Grid Box */}
      <div className="bg-festive-950/80 p-2 sm:p-3 rounded-2xl border-2 border-festive-700/80 shadow-inner">
        <div className="space-y-1.5 sm:space-y-2">
          {ticket.map((row, rIdx) => {
            const nonZeros = row.filter((n) => n > 0);
            const isRowCompleted =
              nonZeros.length > 0 && nonZeros.every((num) => calledSet.has(num));

            return (
              <div key={rIdx} className="flex items-center gap-1 sm:gap-2">
                {/* Row Label */}
                <div className="w-8 sm:w-10 text-right pr-1 flex-shrink-0">
                  <span
                    className={`text-[10px] sm:text-xs font-black uppercase tracking-wider ${
                      isRowCompleted ? 'text-emerald-400 font-bold' : 'text-purple-300/60'
                    }`}
                  >
                    {rIdx === 0 ? 'Top' : rIdx === 1 ? 'Mid' : 'Btm'}
                  </span>
                </div>

                {/* 9 Columns for this row */}
                <div className="grid grid-cols-9 gap-1 sm:gap-1.5 flex-1">
                  {row.map((num, cIdx) => {
                    const isEmpty = num === 0;
                    const isCalled = num > 0 && calledSet.has(num);
                    const isMarked = num > 0 && markedNumbers.has(num);

                    if (isEmpty) {
                      return (
                        <div
                          key={`empty-${rIdx}-${cIdx}`}
                          className="h-10 sm:h-12 rounded-xl bg-festive-900/40 border border-festive-900/60 flex items-center justify-center text-purple-900/50 select-none"
                        >
                          &bull;
                        </div>
                      );
                    }

                    return (
                      <button
                        key={`num-${rIdx}-${cIdx}-${num}`}
                        type="button"
                        onClick={() => handleCellClick(num)}
                        className={`h-10 sm:h-12 rounded-xl flex items-center justify-center font-black text-xs sm:text-base transition-all relative select-none active:scale-95 ${
                          isCalled && isMarked
                            ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-300 font-black'
                            : isCalled
                            ? 'bg-emerald-950/90 border-2 border-emerald-400 text-emerald-300 shadow-md shadow-emerald-950/40'
                            : isMarked
                            ? 'bg-festive-gold/20 border-2 border-festive-gold text-amber-200'
                            : 'bg-festive-900/80 border border-festive-700/80 text-white hover:border-festive-600'
                        }`}
                      >
                        <span>{num}</span>
                        {isMarked && (
                          <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 bg-festive-gold/30 rounded-full p-0.5">
                            <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3] text-amber-300" />
                          </span>
                        )}
                        {isCalled && !isMarked && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Row completion badge */}
                <div className="w-6 text-center flex-shrink-0">
                  {isRowCompleted && (
                    <span
                      title="Row Complete!"
                      className="text-xs font-bold text-emerald-400 bg-emerald-950 border border-emerald-500/80 px-1 py-0.5 rounded shadow-sm animate-pop"
                    >
                      ✓
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

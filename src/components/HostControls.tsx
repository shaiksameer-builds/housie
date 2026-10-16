'use client';

import React from 'react';
import { Play, Pause, FastForward, Square, RotateCcw } from 'lucide-react';
import { GameStatus } from '@/lib/game/types';

interface HostControlsProps {
  status: GameStatus;
  autoCall: boolean;
  autoCallInterval: number;
  onCallNumber: () => void;
  onToggleAutoCall: (enabled: boolean, interval?: number) => void;
  onPause: () => void;
  onResume: () => void;
  onEndRound: () => void;
  onStartNextRound: () => void;
  disabled: boolean;
}

export function HostControls({
  status,
  autoCall,
  autoCallInterval,
  onCallNumber,
  onToggleAutoCall,
  onPause,
  onResume,
  onEndRound,
  onStartNextRound,
  disabled,
}: HostControlsProps) {
  const isRunning = status === GameStatus.IN_PROGRESS;
  const isPaused = status === GameStatus.PAUSED;
  const isCompleted = status === GameStatus.COMPLETED;

  return (
    <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 md:p-6 shadow-xl relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <h3 className="font-bold text-white text-base md:text-lg">Host Caller Controls</h3>
        </div>
        <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 px-2.5 py-0.5 rounded-full font-semibold">
          Host Only
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Call Next Number (Manual) */}
        {isRunning && (
          <button
            type="button"
            disabled={disabled || autoCall}
            onClick={onCallNumber}
            className="flex-1 min-w-[140px] bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-emerald-500/20 text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            Call Next
          </button>
        )}

        {/* Auto-Call Toggle */}
        {isRunning && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onToggleAutoCall(!autoCall, autoCallInterval)}
            className={`flex-1 min-w-[140px] font-bold py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-all border ${
              autoCall
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <FastForward className="w-4 h-4" />
            {autoCall ? 'Stop Auto-Call' : 'Auto-Call (5s)'}
          </button>
        )}

        {/* Pause / Resume */}
        {isRunning && (
          <button
            type="button"
            disabled={disabled}
            onClick={onPause}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold py-2.5 px-3.5 rounded-xl text-sm flex items-center justify-center gap-1.5 transition-colors"
          >
            <Pause className="w-4 h-4" /> Pause
          </button>
        )}

        {isPaused && (
          <button
            type="button"
            disabled={disabled}
            onClick={onResume}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-colors"
          >
            <Play className="w-4 h-4 fill-slate-950" /> Resume
          </button>
        )}

        {/* End Round */}
        {(isRunning || isPaused) && (
          <button
            type="button"
            disabled={disabled}
            onClick={onEndRound}
            className="bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 font-bold py-2.5 px-3.5 rounded-xl text-sm flex items-center justify-center gap-1.5 transition-colors"
          >
            <Square className="w-4 h-4" /> End Round
          </button>
        )}

        {/* Start Next Round */}
        {isCompleted && (
          <button
            type="button"
            disabled={disabled}
            onClick={onStartNextRound}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
          >
            <RotateCcw className="w-4 h-4" /> Start Next Round
          </button>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { Play, Pause, FastForward, Square, RotateCcw, Clock, Shield } from 'lucide-react';
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

  const [intervalSec, setIntervalSec] = useState<number>(autoCallInterval || 5);

  const handleIntervalChange = (newSec: number) => {
    setIntervalSec(newSec);
    if (autoCall) {
      onToggleAutoCall(true, newSec);
    }
  };

  return (
    <div className="bg-festive-900/90 border border-festive-gold/40 rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-festive-gold animate-pulse" />
          <h3 className="font-extrabold text-white text-base sm:text-lg">Host Game Controls</h3>
        </div>
        <span className="text-xs bg-festive-gold/20 text-amber-300 border border-festive-gold/40 px-3 py-1 rounded-full font-bold flex items-center gap-1">
          <Shield className="w-3 h-3" /> Host Only
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Manual Call Next */}
        {isRunning && (
          <button
            type="button"
            disabled={disabled || autoCall}
            onClick={onCallNumber}
            className="flex-1 min-w-[150px] bg-gradient-to-r from-festive-gold to-amber-400 hover:from-amber-400 hover:to-yellow-300 text-festive-950 font-black py-3 px-5 rounded-2xl shadow-xl shadow-festive-gold/20 text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 active:scale-95"
          >
            <Play className="w-4 h-4 fill-festive-950" />
            <span>Call Next Number</span>
          </button>
        )}

        {/* Auto-Call Toggle */}
        {isRunning && (
          <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onToggleAutoCall(!autoCall, intervalSec)}
              className={`flex-1 font-black py-3 px-4 rounded-2xl text-sm flex items-center justify-center gap-2 transition-all border shadow-lg ${
                autoCall
                  ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-amber-500/20'
                  : 'bg-festive-800 hover:bg-festive-700 text-amber-200 border-festive-600/80'
              }`}
            >
              <FastForward className="w-4 h-4" />
              <span>{autoCall ? `Auto-Calling (${intervalSec}s)` : 'Start Auto-Call'}</span>
            </button>

            {/* Interval Selector */}
            <select
              value={intervalSec}
              onChange={(e) => handleIntervalChange(Number(e.target.value))}
              disabled={disabled}
              className="bg-festive-950 border border-festive-700 text-amber-300 text-xs font-bold py-3 px-2 rounded-2xl focus:outline-none"
            >
              <option value={3}>3s</option>
              <option value={5}>5s</option>
              <option value={8}>8s</option>
              <option value={10}>10s</option>
            </select>
          </div>
        )}

        {/* Pause / Resume */}
        {isRunning && (
          <button
            type="button"
            disabled={disabled}
            onClick={onPause}
            className="bg-festive-800 hover:bg-festive-700 text-slate-200 border border-festive-700 font-bold py-3 px-4 rounded-2xl text-sm flex items-center justify-center gap-1.5 transition-colors"
          >
            <Pause className="w-4 h-4" />
            <span>Pause</span>
          </button>
        )}

        {isPaused && (
          <button
            type="button"
            disabled={disabled}
            onClick={onResume}
            className="bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black py-3 px-5 rounded-2xl text-sm flex items-center justify-center gap-1.5 shadow-xl shadow-emerald-500/20 transition-all active:scale-95"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Resume Game</span>
          </button>
        )}

        {/* End Round */}
        {(isRunning || isPaused) && (
          <button
            type="button"
            disabled={disabled}
            onClick={onEndRound}
            className="bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 font-bold py-3 px-4 rounded-2xl text-sm flex items-center justify-center gap-1.5 transition-colors"
          >
            <Square className="w-4 h-4" />
            <span>End Round</span>
          </button>
        )}

        {/* Start Next Round */}
        {isCompleted && (
          <button
            type="button"
            disabled={disabled}
            onClick={onStartNextRound}
            className="w-full bg-gradient-to-r from-festive-gold to-amber-400 hover:from-amber-400 text-festive-950 font-black py-3.5 px-6 rounded-2xl text-base flex items-center justify-center gap-2 shadow-xl shadow-festive-gold/25 transition-all"
          >
            <RotateCcw className="w-5 h-5 stroke-[2.5]" />
            <span>Start Next Round</span>
          </button>
        )}
      </div>
    </div>
  );
}

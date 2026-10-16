'use client';

import React, { useState } from 'react';
import { Copy, Check, Users, Play, Settings } from 'lucide-react';
import { ALL_WINNING_CATEGORIES, WINNING_CATEGORY_LABELS, WinningCategory, type PlayerInfo } from '@/lib/game/types';

interface LobbyViewProps {
  roomCode: string;
  roomName: string;
  players: PlayerInfo[];
  isHost: boolean;
  onStartGame: (enabledCategories: WinningCategory[]) => void;
  disabled: boolean;
}

export function LobbyView({
  roomCode,
  roomName,
  players,
  isHost,
  onStartGame,
  disabled,
}: LobbyViewProps) {
  const [copied, setCopied] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<WinningCategory[]>(ALL_WINNING_CATEGORIES);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/room/${roomCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleCategory = (cat: WinningCategory) => {
    if (!isHost) return;
    if (selectedCategories.includes(cat)) {
      if (selectedCategories.length === 1) return; // Keep at least one
      setSelectedCategories(selectedCategories.filter((c) => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full space-y-6">
      {/* Header Info Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Waiting Lobby</span>
          <h2 className="text-2xl font-black text-white">{roomName}</h2>
          <p className="text-xs text-slate-400 mt-1">Waiting for the host to start the round</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 font-mono text-xl font-bold tracking-widest text-emerald-400">
            {roomCode}
          </div>
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold py-2.5 px-3 rounded-xl transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Share Link'}
          </button>
        </div>
      </div>

      {/* Winning Category Settings */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <Settings className="w-4 h-4 text-emerald-400" />
          <h3 className="font-bold text-white text-base">Enabled Winning Categories</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          {isHost
            ? 'Select which categories players can claim in this round:'
            : 'Categories active for this round (configured by host):'}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {ALL_WINNING_CATEGORIES.map((cat) => {
            const isSelected = selectedCategories.includes(cat);
            return (
              <button
                key={cat}
                type="button"
                disabled={!isHost}
                onClick={() => toggleCategory(cat)}
                className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                  isSelected
                    ? 'bg-emerald-950/60 border-emerald-500/70 text-emerald-300'
                    : 'bg-slate-950/50 border-slate-800/80 text-slate-500 hover:border-slate-700'
                } ${!isHost ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <div className="flex items-center justify-between">
                  <span>{WINNING_CATEGORY_LABELS[cat]}</span>
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Players In Lobby */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-white text-base">Connected Players ({players.length})</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {players.map((p) => (
            <div
              key={p.id}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-sm"
            >
              <span className="font-semibold text-white">{p.displayName}</span>
              {p.isHost && (
                <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold">
                  Host
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Host Start Game Button */}
      {isHost ? (
        <button
          type="button"
          disabled={disabled || players.length === 0}
          onClick={() => onStartGame(selectedCategories)}
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-4 px-6 rounded-2xl shadow-xl shadow-emerald-500/25 text-base flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          <Play className="w-5 h-5 fill-slate-950" /> Start Game Round 1
        </button>
      ) : (
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 text-sm">
          ⏳ Waiting for host to start the game...
        </div>
      )}
    </div>
  );
}

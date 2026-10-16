'use client';

import React, { useState } from 'react';
import { Copy, Check, Users, Play, Settings, Share2, Sparkles, Shield } from 'lucide-react';
import {
  ALL_WINNING_CATEGORIES,
  WINNING_CATEGORY_LABELS,
  WinningCategory,
  type PlayerInfo,
} from '@/lib/game/types';

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
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedCategories, setSelectedCategories] =
    useState<WinningCategory[]>(ALL_WINNING_CATEGORIES);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/room/${roomCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
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
      {/* Lobby Welcome Card */}
      <div className="bg-festive-900/90 border border-festive-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-48 h-48 bg-festive-gold/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-festive-800 px-3 py-1 rounded-full border border-festive-700 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-festive-gold" />
              <span>Waiting Lobby</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">{roomName}</h2>
            <p className="text-xs text-purple-200/70 mt-1">
              {isHost
                ? 'Invite players using the code or link below. When everyone is ready, start the round!'
                : 'Waiting for the host to start the round...'}
            </p>
          </div>

          {/* Room Code Badge */}
          <div className="flex flex-col items-start sm:items-end gap-2">
            <div className="bg-festive-950 border-2 border-festive-700 rounded-2xl px-5 py-2.5 flex items-center gap-3 shadow-inner">
              <span className="font-mono text-2xl font-black tracking-widest text-amber-300">
                {roomCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                title="Copy Room Code"
                className="p-1.5 rounded-lg bg-festive-800 hover:bg-festive-700 text-slate-300 hover:text-white transition-colors"
              >
                {copiedCode ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-festive-800/80">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-2 bg-festive-800 hover:bg-festive-700 text-amber-300 border border-festive-600/80 text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-md active:scale-95"
          >
            {copiedLink ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Share2 className="w-4 h-4 text-festive-gold" />
            )}
            <span>{copiedLink ? 'Link Copied to Clipboard!' : 'Copy Invitation Link'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyCode}
            className="flex items-center gap-2 bg-festive-950 hover:bg-festive-850 text-slate-300 border border-festive-800 text-xs font-bold py-2.5 px-4 rounded-xl transition-colors"
          >
            {copiedCode ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4 text-purple-400" />
            )}
            <span>{copiedCode ? 'Code Copied!' : 'Copy Code'}</span>
          </button>
        </div>
      </div>

      {/* Winning Category Settings */}
      <div className="bg-festive-900/90 border border-festive-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-festive-gold" />
            <h3 className="font-extrabold text-white text-base">Enabled Winning Categories</h3>
          </div>
          {isHost && (
            <span className="text-[11px] text-amber-300/80 font-semibold">
              Tap to toggle categories
            </span>
          )}
        </div>
        <p className="text-xs text-purple-200/70 mb-4">
          {isHost
            ? 'Choose which prizes will be available to claim in this round:'
            : 'Categories active for this round (set by host):'}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {ALL_WINNING_CATEGORIES.map((cat) => {
            const isSelected = selectedCategories.includes(cat);
            return (
              <button
                key={cat}
                type="button"
                disabled={!isHost}
                onClick={() => toggleCategory(cat)}
                className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all ${
                  isSelected
                    ? 'bg-festive-gold/15 border-festive-gold/70 text-amber-200 shadow-sm'
                    : 'bg-festive-950/60 border-festive-850 text-purple-400/50 hover:border-festive-700'
                } ${!isHost ? 'cursor-default' : 'cursor-pointer active:scale-95'}`}
              >
                <div className="flex items-center justify-between">
                  <span>{WINNING_CATEGORY_LABELS[cat]}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-festive-gold" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Connected Players in Lobby */}
      <div className="bg-festive-900/90 border border-festive-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-festive-gold" />
            <h3 className="font-extrabold text-white text-base">
              Connected Players ({players.length})
            </h3>
          </div>
          <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Ready in Lobby</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {players.map((p) => (
            <div
              key={p.id}
              className="p-3.5 rounded-2xl bg-festive-950 border border-festive-800 flex items-center justify-between text-sm shadow-sm"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-festive-800 flex items-center justify-center font-bold text-xs text-amber-300">
                  {p.displayName.slice(0, 1).toUpperCase()}
                </div>
                <span className="font-bold text-white truncate">{p.displayName}</span>
              </div>
              {p.isHost && (
                <span className="text-[10px] bg-festive-gold/20 text-amber-300 border border-festive-gold/40 px-2 py-0.5 rounded-md font-extrabold flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5" /> Host
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
          className="w-full bg-gradient-to-r from-festive-gold via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-festive-950 font-black py-4 px-6 rounded-2xl shadow-2xl shadow-festive-gold/25 text-lg flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 active:scale-[0.98]"
        >
          <Play className="w-5 h-5 fill-festive-950" />
          <span>Start Game Round 1</span>
        </button>
      ) : (
        <div className="p-4 rounded-2xl bg-festive-900/60 border border-festive-800 text-center text-purple-200/80 text-sm font-medium">
          ⏳ Waiting for host to start the game...
        </div>
      )}
    </div>
  );
}

'use client';

import React from 'react';
import { Users, Crown, Wifi, WifiOff } from 'lucide-react';
import { type PlayerInfo } from '@/lib/game/types';

interface PlayerListProps {
  players: PlayerInfo[];
  currentUserId: string;
}

export function PlayerList({ players, currentUserId }: PlayerListProps) {
  return (
    <div className="bg-festive-900/90 border border-festive-800 rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-300 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <h3 className="font-extrabold text-white text-base">Players</h3>
        </div>
        <span className="text-xs bg-festive-850 text-amber-300 font-bold px-2.5 py-0.5 rounded-full border border-festive-700 font-mono">
          {players.length} connected
        </span>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {players.map((player) => {
          const isMe = player.id === currentUserId;

          return (
            <div
              key={player.id}
              className={`flex items-center justify-between p-3 rounded-2xl border text-sm transition-all ${
                isMe
                  ? 'bg-festive-gold/15 border-festive-gold/50 text-amber-200'
                  : 'bg-festive-950/70 border-festive-800 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-festive-800 flex items-center justify-center font-bold text-xs text-amber-300 flex-shrink-0">
                  {player.displayName.slice(0, 1).toUpperCase()}
                </div>
                <span className="font-bold truncate">
                  {player.displayName} {isMe && <span className="text-festive-gold">(You)</span>}
                </span>
                {player.isHost && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black bg-festive-gold/20 text-amber-300 border border-festive-gold/40 px-1.5 py-0.5 rounded">
                    <Crown className="w-2.5 h-2.5 fill-festive-gold" /> Host
                  </span>
                )}
              </div>

              <div>
                {player.isConnected ? (
                  <span title="Connected">
                    <Wifi className="w-4 h-4 text-emerald-400" />
                  </span>
                ) : (
                  <span title="Disconnected / Reconnecting">
                    <WifiOff className="w-4 h-4 text-purple-400/40" />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

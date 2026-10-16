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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-white text-base md:text-lg">Players</h3>
        </div>
        <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700 font-mono">
          {players.length}
        </span>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {players.map((player) => {
          const isMe = player.id === currentUserId;

          return (
            <div
              key={player.id}
              className={`flex items-center justify-between p-2.5 rounded-xl border text-sm ${
                isMe
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  {player.displayName} {isMe && '(You)'}
                </span>
                {player.isHost && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded">
                    <Crown className="w-3 h-3 fill-amber-400" /> Host
                  </span>
                )}
              </div>

              <div>
                {player.isConnected ? (
                  <span title="Connected">
                    <Wifi className="w-4 h-4 text-emerald-400" />
                  </span>
                ) : (
                  <span title="Disconnected">
                    <WifiOff className="w-4 h-4 text-slate-600" />
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

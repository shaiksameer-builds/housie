'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import {
  GameStatus,
  WinningCategory,
  type GameState,
  type TicketData,
  type ServerToClientEvents,
  type ClientToServerEvents,
  type CategoryClaim,
  type RoundResult,
} from '@/lib/game/types';

import { TicketBoard } from '@/components/TicketBoard';
import { NumberBoard } from '@/components/NumberBoard';
import { ClaimPanel } from '@/components/ClaimPanel';
import { HostControls } from '@/components/HostControls';
import { PlayerList } from '@/components/PlayerList';
import { LatestCall } from '@/components/LatestCall';
import { ResultsModal } from '@/components/ResultsModal';
import { LobbyView } from '@/components/LobbyView';
import { ArrowLeft, Wifi, WifiOff, Volume2, VolumeX, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = (params.code as string)?.toUpperCase();

  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

  const [playerId, setPlayerId] = useState<string>('');
  const [sessionToken, setSessionToken] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [ticket, setTicket] = useState<number[][] | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [markedNumbers, setMarkedNumbers] = useState<Set<number>>(new Set());

  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isJoining, setIsJoining] = useState<boolean>(true);
  const [joinError, setJoinError] = useState<string>('');
  const [nameInput, setNameInput] = useState<string>('');

  const [notification, setNotification] = useState<string>('');
  const [completedRoundResult, setCompletedRoundResult] = useState<RoundResult | null>(null);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);

  // Initialize display name from sessionStorage if present
  useEffect(() => {
    const savedName = sessionStorage.getItem(`housie_name_${roomCode}`) || '';
    if (savedName) {
      setDisplayName(savedName);
      setNameInput(savedName);
    }
    const savedToken = localStorage.getItem(`housie_session_${roomCode}`) || '';
    if (savedToken) {
      setSessionToken(savedToken);
    }
  }, [roomCode]);

  // Connect socket once name or token is available
  useEffect(() => {
    if (!roomCode || (!displayName && !sessionToken)) return;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      // Join room
      socket.emit(
        'room:join',
        {
          roomCode,
          displayName,
          sessionToken: sessionToken || undefined,
        },
        (response) => {
          setIsJoining(false);
          if (response.success && response.playerId) {
            setPlayerId(response.playerId);
            if (response.sessionToken) {
              setSessionToken(response.sessionToken);
              localStorage.setItem(`housie_session_${roomCode}`, response.sessionToken);
            }
          } else {
            setJoinError(response.message || 'Failed to join room');
          }
        }
      );
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('game:state', (state) => {
      setGameState(state);
    });

    socket.on('game:ticket', (ticketData) => {
      setTicket(ticketData.numbers);
    });

    socket.on('game:event', (event) => {
      setNotification(event.message);
      setTimeout(() => setNotification(''), 4000);
    });

    socket.on('game:category-won', (claim) => {
      setNotification(`🏆 ${claim.playerName} won ${claim.category}!`);
      setTimeout(() => setNotification(''), 5000);
    });

    socket.on('game:round-completed', (result) => {
      setCompletedRoundResult(result);
    });

    return () => {
      socket.disconnect();
    };
  }, [roomCode, displayName]);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    setDisplayName(nameInput.trim());
    sessionStorage.setItem(`housie_name_${roomCode}`, nameInput.trim());
  };

  const handleToggleMark = (num: number) => {
    setMarkedNumbers((prev) => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
  };

  const handleStartGame = (enabledCategories: WinningCategory[]) => {
    socketRef.current?.emit('game:start', { enabledCategories }, (res) => {
      if (!res.success) alert(res.message || 'Failed to start round');
    });
  };

  const handleCallNumber = () => {
    socketRef.current?.emit('game:call-number', (res) => {
      if (!res.success && res.message) alert(res.message);
    });
  };

  const handleToggleAutoCall = (enabled: boolean, interval = 5) => {
    socketRef.current?.emit('game:toggle-auto-call', { enabled, interval }, (res) => {
      if (!res.success && res.message) alert(res.message);
    });
  };

  const handlePause = () => {
    socketRef.current?.emit('game:pause', (res) => {
      if (!res.success && res.message) alert(res.message);
    });
  };

  const handleResume = () => {
    socketRef.current?.emit('game:resume', (res) => {
      if (!res.success && res.message) alert(res.message);
    });
  };

  const handleClaim = (category: WinningCategory) => {
    setIsClaiming(true);
    socketRef.current?.emit('game:claim', { category }, (res) => {
      setIsClaiming(false);
      if (!res.success) {
        alert(res.message || 'Claim rejected');
      }
    });
  };

  const handleEndRound = () => {
    socketRef.current?.emit('game:end-round', (res) => {
      if (!res.success && res.message) alert(res.message);
    });
  };

  const handleStartNextRound = () => {
    setCompletedRoundResult(null);
    setMarkedNumbers(new Set());
    socketRef.current?.emit(
      'game:next-round',
      { enabledCategories: gameState?.enabledCategories || [] },
      (res) => {
        if (!res.success && res.message) alert(res.message);
      }
    );
  };

  // If user hasn't entered their name yet
  if (!displayName) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl">
          <h2 className="text-2xl font-black text-white mb-2">Join Room {roomCode}</h2>
          <p className="text-slate-400 text-sm mb-6">Enter your display name to start playing.</p>
          <form onSubmit={handleNameSubmit} className="space-y-4">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Your display name"
              maxLength={20}
              autoFocus
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all"
            >
              Enter Room
            </button>
          </form>
        </div>
      </main>
    );
  }

  // Join Error
  if (joinError) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-rose-900 rounded-2xl p-6 md:p-8 max-w-md w-full text-center shadow-2xl">
          <div className="text-rose-400 font-bold text-lg mb-2">Unable to Join Room</div>
          <p className="text-slate-400 text-sm mb-6">{joinError}</p>
          <Link
            href="/"
            className="inline-block bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 px-5 rounded-xl text-sm"
          >
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  const isHost = Boolean(gameState?.players.find((p) => p.id === playerId)?.isHost);
  const isInGame =
    gameState?.status === GameStatus.IN_PROGRESS ||
    gameState?.status === GameStatus.PAUSED ||
    gameState?.status === GameStatus.COMPLETED;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between pb-12">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40 px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm md:text-base text-white">{gameState?.roomName || 'Housie'}</h1>
              <span className="text-xs bg-slate-800 font-mono text-emerald-400 border border-slate-700 px-2 py-0.5 rounded-md font-semibold">
                {roomCode}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/stats/${roomCode}`}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            <BarChart3 className="w-3.5 h-3.5" /> Stats
          </Link>

          <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800">
            {isConnected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 hidden sm:inline">Connected</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span className="text-rose-400 hidden sm:inline">Disconnected</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Floating Notification */}
      {notification && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-950 border border-emerald-500/80 text-emerald-200 px-4 py-2.5 rounded-xl shadow-2xl text-xs md:text-sm font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
          <span>{notification}</span>
        </div>
      )}

      {/* Content Area */}
      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-6 flex-1">
        {/* LOBBY VIEW (Waiting State) */}
        {!isInGame && gameState && (
          <LobbyView
            roomCode={roomCode}
            roomName={gameState.roomName}
            players={gameState.players}
            isHost={isHost}
            onStartGame={handleStartGame}
            disabled={!isConnected}
          />
        )}

        {/* LIVE GAMEPLAY VIEW */}
        {isInGame && gameState && (
          <div className="space-y-6">
            {/* Host Controls Banner (if Host) */}
            {isHost && (
              <HostControls
                status={gameState.status}
                autoCall={gameState.autoCall}
                autoCallInterval={gameState.autoCallInterval}
                onCallNumber={handleCallNumber}
                onToggleAutoCall={handleToggleAutoCall}
                onPause={handlePause}
                onResume={handleResume}
                onEndRound={handleEndRound}
                onStartNextRound={handleStartNextRound}
                disabled={!isConnected}
              />
            )}

            {/* Top row: Latest Call + Number Board */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1">
                <LatestCall
                  lastCalledNumber={gameState.lastCalledNumber}
                  totalCalled={gameState.calledNumbers.length}
                />
              </div>
              <div className="lg:col-span-3">
                <NumberBoard
                  calledNumbers={gameState.calledNumbers}
                  lastCalledNumber={gameState.lastCalledNumber}
                />
              </div>
            </div>

            {/* Bottom row: Ticket + Sidebar (Claims & Players) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Ticket Grid */}
              <div className="lg:col-span-2 space-y-6">
                {ticket ? (
                  <TicketBoard
                    ticket={ticket}
                    calledNumbers={gameState.calledNumbers}
                    markedNumbers={markedNumbers}
                    onToggleMark={handleToggleMark}
                  />
                ) : (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
                    Loading your ticket...
                  </div>
                )}

                {/* Winning Claims Panel */}
                <ClaimPanel
                  enabledCategories={gameState.enabledCategories}
                  claims={gameState.claimedCategories}
                  currentUserId={playerId}
                  onClaim={handleClaim}
                  isClaiming={isClaiming}
                />
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <PlayerList players={gameState.players} currentUserId={playerId} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Completed Round Results Modal */}
      {completedRoundResult && (
        <ResultsModal
          roundNumber={completedRoundResult.roundNumber}
          claims={completedRoundResult.claims}
          totalCalled={completedRoundResult.totalNumbersCalled}
          duration={completedRoundResult.duration}
          isHost={isHost}
          onStartNextRound={handleStartNextRound}
        />
      )}
    </main>
  );
}

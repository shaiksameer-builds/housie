'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import {
  GameStatus,
  WinningCategory,
  type GameState,
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
import { soundManager } from '@/lib/audio';
import { triggerConfetti } from '@/lib/confetti';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  BarChart3,
  Copy,
  Check,
  Share2,
  Sparkles,
} from 'lucide-react';
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
  const [copiedLink, setCopiedLink] = useState(false);

  // Sound & Voice Caller toggles
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);

  // Initialize display name from storage
  useEffect(() => {
    if (!roomCode) return;
    const sessionName = sessionStorage.getItem(`housie_name_${roomCode}`) || '';
    const globalSavedName = localStorage.getItem('housie_player_name') || '';
    const initialName = sessionName || globalSavedName;

    if (initialName) {
      setDisplayName(initialName);
      setNameInput(initialName);
    }

    const savedToken = localStorage.getItem(`housie_session_${roomCode}`) || '';
    if (savedToken) {
      setSessionToken(savedToken);
    }

    setSoundEnabled(soundManager.isSoundEnabled());
    setVoiceEnabled(soundManager.isVoiceEnabled());
  }, [roomCode]);

  // Connect socket once name or token is available
  useEffect(() => {
    if (!roomCode || (!displayName && !sessionToken)) return;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
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

    socket.on('game:number-called', (data) => {
      soundManager.playCallChime();
      soundManager.speakNumber(data.number);
    });

    socket.on('game:event', (event) => {
      setNotification(event.message);
      setTimeout(() => setNotification(''), 4000);
    });

    socket.on('game:category-won', (claim) => {
      soundManager.playWinFanfare();
      triggerConfetti();
      setNotification(`🏆 ${claim.playerName} won ${claim.category}! 🎉`);
      setTimeout(() => setNotification(''), 5000);
    });

    socket.on('game:round-completed', (result) => {
      setCompletedRoundResult(result);
      triggerConfetti();
    });

    return () => {
      socket.disconnect();
    };
  }, [roomCode, displayName]);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = nameInput.trim();
    if (!clean) return;
    setDisplayName(clean);
    sessionStorage.setItem(`housie_name_${roomCode}`, clean);
    localStorage.setItem('housie_player_name', clean);
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.setSoundEnabled(next);
  };

  const handleToggleVoice = () => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    soundManager.setVoiceEnabled(next);
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
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

  // If user opened an invite link directly and hasn't chosen a name yet
  if (!displayName) {
    return (
      <main className="min-h-screen bg-festive-950 text-slate-100 flex items-center justify-center p-4">
        <div className="bg-festive-900 border border-festive-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-festive-gold/15 rounded-full blur-2xl pointer-events-none" />
          <div className="w-12 h-12 rounded-2xl bg-festive-gold/20 text-festive-gold flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Join Room {roomCode}</h2>
          <p className="text-purple-200/70 text-sm mb-6">
            Enter your display name (e.g. name, nickname, or emoji) to join the game!
          </p>
          <form onSubmit={handleNameSubmit} className="space-y-4">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="e.g. Pooja 🌟, Vicky, Dadi 👵"
              maxLength={20}
              autoFocus
              className="w-full bg-festive-950 border border-festive-700 rounded-xl px-4 py-3.5 text-base text-white placeholder-slate-500 focus:outline-none focus:border-festive-gold"
            />
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-festive-gold to-amber-400 hover:from-amber-400 text-festive-950 font-black py-4 px-4 rounded-xl shadow-xl shadow-festive-gold/20 text-base transition-all active:scale-95"
            >
              Enter Room &amp; Play
            </button>
          </form>
        </div>
      </main>
    );
  }

  // Join Error View
  if (joinError) {
    return (
      <main className="min-h-screen bg-festive-950 text-slate-100 flex items-center justify-center p-4">
        <div className="bg-festive-900 border border-rose-900/80 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl">
          <div className="text-rose-400 font-black text-xl mb-2">Unable to Join Room</div>
          <p className="text-purple-200/70 text-sm mb-6">{joinError}</p>
          <Link
            href="/"
            className="inline-block bg-festive-800 hover:bg-festive-700 text-white font-bold py-3 px-6 rounded-xl text-sm transition-colors"
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
    <main className="min-h-screen bg-festive-950 text-slate-100 flex flex-col justify-between pb-12 selection:bg-festive-gold selection:text-festive-950">
      {/* Top Navbar */}
      <header className="border-b border-festive-800/80 bg-festive-900/80 backdrop-blur-md sticky top-0 z-40 px-4 md:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            title="Leave Room"
            className="w-9 h-9 rounded-xl bg-festive-850 hover:bg-festive-800 border border-festive-700/80 flex items-center justify-center text-purple-200 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-sm md:text-base text-white truncate max-w-[140px] sm:max-w-xs">
                {gameState?.roomName || 'Housie Night'}
              </h1>
              <button
                type="button"
                onClick={handleCopyLink}
                title="Click to copy room code"
                className="text-xs bg-festive-850 text-amber-300 border border-festive-700 px-2.5 py-0.5 rounded-lg font-mono font-bold flex items-center gap-1 hover:border-festive-gold transition-colors"
              >
                <span>{roomCode}</span>
                {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-purple-400" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Share Link Button */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1 text-xs text-amber-200 bg-festive-850 hover:bg-festive-800 border border-festive-700 px-3 py-1.5 rounded-xl font-bold transition-colors"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-festive-gold" />}
            <span className="hidden sm:inline">{copiedLink ? 'Copied!' : 'Invite'}</span>
          </button>

          {/* Audio Toggles */}
          <button
            type="button"
            onClick={handleToggleVoice}
            title={voiceEnabled ? 'Mute voice calls' : 'Enable voice calls'}
            className={`p-2 rounded-xl border text-xs transition-colors ${
              voiceEnabled
                ? 'bg-festive-800 border-festive-gold/50 text-amber-300'
                : 'bg-festive-950 border-festive-800 text-slate-500'
            }`}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4 text-festive-gold" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Stats Link */}
          <Link
            href={`/stats/${roomCode}`}
            className="flex items-center gap-1 text-xs text-purple-200 hover:text-white bg-festive-850 hover:bg-festive-800 border border-festive-700 px-3 py-1.5 rounded-xl font-bold transition-colors"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Stats</span>
          </Link>

          {/* Connection Status Pill */}
          <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-festive-950 border border-festive-800">
            {isConnected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-[11px] hidden md:inline">Online</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span className="text-rose-400 text-[11px] hidden md:inline">Reconnecting</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Floating Announcement Banner */}
      {notification && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-amber-500 to-festive-gold text-festive-950 px-5 py-2.5 rounded-2xl shadow-2xl text-xs sm:text-sm font-black flex items-center gap-2 animate-pop border-2 border-yellow-200">
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

            {/* Top row: Latest Call + 1-90 Number Board */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1">
                <LatestCall
                  lastCalledNumber={gameState.lastCalledNumber}
                  totalCalled={gameState.calledNumbers.length}
                  calledNumbers={gameState.calledNumbers}
                  voiceEnabled={voiceEnabled}
                  soundEnabled={soundEnabled}
                  onToggleVoice={handleToggleVoice}
                  onToggleSound={handleToggleSound}
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
              {/* Ticket Grid + Winning Claims */}
              <div className="lg:col-span-2 space-y-6">
                {ticket ? (
                  <TicketBoard
                    ticket={ticket}
                    calledNumbers={gameState.calledNumbers}
                    markedNumbers={markedNumbers}
                    onToggleMark={handleToggleMark}
                  />
                ) : (
                  <div className="bg-festive-900 border border-festive-800 rounded-3xl p-8 text-center text-purple-200/60 font-medium">
                    Loading your 3×9 Tambola ticket...
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

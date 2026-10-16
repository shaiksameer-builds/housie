'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import {
  GameStatus,
  WinningCategory,
  type GameState,
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

  // Auto-call timer ref
  const autoCallTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load saved name and session token from storage on mount
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

  // Authoritative State Fetcher
  const fetchAuthoritativeState = useCallback(async (token?: string) => {
    if (!roomCode) return;
    const currentToken = token || sessionToken || localStorage.getItem(`housie_session_${roomCode}`) || '';

    try {
      const res = await fetch(`/api/rooms/${roomCode}/state`, {
        headers: currentToken ? { 'x-session-token': currentToken } : {},
      });

      if (!res.ok) {
        if (res.status === 404) {
          setJoinError('Room not found or no longer active.');
        }
        return;
      }

      const data = await res.json();
      if (data.success && data.state) {
        setGameState(data.state);
        if (data.ticket) {
          setTicket(data.ticket);
        }
        if (data.playerId) {
          setPlayerId(data.playerId);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch authoritative state:', err);
    }
  }, [roomCode, sessionToken]);

  // Join Room once name is available
  useEffect(() => {
    if (!roomCode || !displayName) return;

    let isSubscribed = true;

    async function initRoom() {
      setIsJoining(true);
      setJoinError('');

      try {
        const savedToken = localStorage.getItem(`housie_session_${roomCode}`) || undefined;

        const res = await fetch(`/api/rooms/${roomCode}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            displayName,
            sessionToken: savedToken,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          if (isSubscribed) {
            setJoinError(data.error || 'Failed to join room.');
            setIsJoining(false);
          }
          return;
        }

        if (isSubscribed) {
          setPlayerId(data.playerId);
          if (data.sessionToken) {
            setSessionToken(data.sessionToken);
            localStorage.setItem(`housie_session_${roomCode}`, data.sessionToken);
          }
          setIsJoining(false);
        }

        // Fetch complete state with session token
        await fetchAuthoritativeState(data.sessionToken);
      } catch (err: any) {
        if (isSubscribed) {
          setJoinError(err.message || 'Network error connecting to room.');
          setIsJoining(false);
        }
      }
    }

    initRoom();

    return () => {
      isSubscribed = false;
    };
  }, [roomCode, displayName, fetchAuthoritativeState]);

  // Setup Supabase Realtime Channel
  useEffect(() => {
    if (!roomCode || !displayName) return;

    const channelName = `room:${roomCode}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: false, self: false },
        presence: { key: playerId || displayName },
      },
    });

    channel
      .on('broadcast', { event: 'game:number-called' }, ({ payload }) => {
        if (payload?.number) {
          soundManager.playCallChime();
          soundManager.speakNumber(payload.number);
        }
        fetchAuthoritativeState();
      })
      .on('broadcast', { event: 'game:category-won' }, ({ payload }) => {
        soundManager.playWinFanfare();
        triggerConfetti();
        if (payload) {
          setNotification(`🏆 ${payload.playerName} won ${payload.category}! 🎉`);
          setTimeout(() => setNotification(''), 5000);
        }
        fetchAuthoritativeState();
      })
      .on('broadcast', { event: 'game:state-update' }, () => {
        fetchAuthoritativeState();
      })
      .on('broadcast', { event: 'game:player-joined' }, ({ payload }) => {
        if (payload?.displayName && payload.displayName !== displayName) {
          setNotification(`${payload.displayName} joined the room`);
          setTimeout(() => setNotification(''), 3000);
        }
        fetchAuthoritativeState();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          channel.track({
            playerId,
            displayName,
            online_at: new Date().toISOString(),
          });
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsConnected(false);
        }
      });

    // Periodic state refresh fallback (heartbeat)
    const interval = setInterval(() => {
      fetchAuthoritativeState();
    }, 4000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [roomCode, displayName, playerId, fetchAuthoritativeState]);

  // Handle Name Submit if user came via link without saved name
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

  // Host Actions
  const handleStartGame = async (enabledCategories: WinningCategory[]) => {
    try {
      const res = await fetch(`/api/rooms/${roomCode}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-token': sessionToken,
        },
        body: JSON.stringify({ enabledCategories }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to start game');
        return;
      }
      await fetchAuthoritativeState();
    } catch (err: any) {
      alert(err.message || 'Error starting game');
    }
  };

  const handleCallNumber = async () => {
    try {
      const res = await fetch(`/api/rooms/${roomCode}/call`, {
        method: 'POST',
        headers: {
          'x-session-token': sessionToken,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error) alert(data.error);
        return;
      }
      if (data.number) {
        soundManager.playCallChime();
        soundManager.speakNumber(data.number);
      }
      await fetchAuthoritativeState();
    } catch (err: any) {
      alert(err.message || 'Error calling number');
    }
  };

  // Host Auto-Call Toggle
  const handleToggleAutoCall = (enabled: boolean, interval = 5) => {
    if (autoCallTimerRef.current) {
      clearInterval(autoCallTimerRef.current);
      autoCallTimerRef.current = null;
    }

    if (enabled) {
      handleCallNumber(); // call first immediately
      autoCallTimerRef.current = setInterval(() => {
        handleCallNumber();
      }, interval * 1000);
    }

    setGameState((prev) => (prev ? { ...prev, autoCall: enabled, autoCallInterval: interval } : prev));
  };

  const handlePause = async () => {
    if (autoCallTimerRef.current) {
      clearInterval(autoCallTimerRef.current);
      autoCallTimerRef.current = null;
    }

    await fetch(`/api/rooms/${roomCode}/pause`, {
      method: 'POST',
      headers: { 'x-session-token': sessionToken },
    });
    await fetchAuthoritativeState();
  };

  const handleResume = async () => {
    await fetch(`/api/rooms/${roomCode}/resume`, {
      method: 'POST',
      headers: { 'x-session-token': sessionToken },
    });
    await fetchAuthoritativeState();
  };

  const handleClaim = async (category: WinningCategory) => {
    setIsClaiming(true);
    try {
      const res = await fetch(`/api/rooms/${roomCode}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-token': sessionToken,
        },
        body: JSON.stringify({ category }),
      });

      const data = await res.json();
      setIsClaiming(false);

      if (!res.ok || !data.success) {
        alert(data.error || 'Claim rejected. Required numbers have not been called yet.');
        return;
      }

      soundManager.playWinFanfare();
      triggerConfetti();
      setNotification(`🏆 You won ${category}! 🎉`);
      setTimeout(() => setNotification(''), 5000);
      await fetchAuthoritativeState();
    } catch (err: any) {
      setIsClaiming(false);
      alert(err.message || 'Error submitting claim');
    }
  };

  const handleEndRound = async () => {
    if (autoCallTimerRef.current) {
      clearInterval(autoCallTimerRef.current);
      autoCallTimerRef.current = null;
    }

    await fetch(`/api/rooms/${roomCode}/end`, {
      method: 'POST',
      headers: { 'x-session-token': sessionToken },
    });
    await fetchAuthoritativeState();
  };

  const handleStartNextRound = async () => {
    setCompletedRoundResult(null);
    setMarkedNumbers(new Set());
    await handleStartGame(gameState?.enabledCategories || []);
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
                <span className="text-emerald-400 text-[11px] hidden md:inline">Realtime</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-amber-400 text-[11px] hidden md:inline">Syncing</span>
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
            disabled={!isConnected && isJoining}
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
                disabled={!isConnected && isJoining}
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

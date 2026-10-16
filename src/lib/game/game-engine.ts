import {
  GameStatus,
  WinningCategory,
  GameState,
  PlayerInfo,
  CategoryClaim,
  TOTAL_NUMBERS,
  MIN_NUMBER,
  MAX_NUMBER,
} from './types';
import { generateTicket, gridToFlat, flatToGrid } from './ticket-generator';
import { checkWinningCategory, getCategoryWinIndex } from './winning-checker';

export interface RoundState {
  roundId: string;
  roundNumber: number;
  status: GameStatus;
  calledNumbers: number[];
  remainingNumbers: number[];
  enabledCategories: WinningCategory[];
  claims: Map<string, CategoryClaim>; // key = category
  tickets: Map<string, number[][]>; // key = playerId
  autoCall: boolean;
  autoCallInterval: number;
  autoCallTimer: ReturnType<typeof setInterval> | null;
  startedAt: Date | null;
}

export interface RoomState {
  roomId: string;
  roomCode: string;
  roomName: string;
  hostPlayerId: string;
  players: Map<string, PlayerInfo>;
  currentRound: RoundState | null;
  roundCount: number;
}

/**
 * Server-authoritative game engine for Housie.
 * Manages room state, number calling, and claim validation.
 */
export class GameEngine {
  private rooms: Map<string, RoomState> = new Map();

  createRoom(roomId: string, roomCode: string, roomName: string, hostPlayer: PlayerInfo): RoomState {
    const room: RoomState = {
      roomId,
      roomCode,
      roomName,
      hostPlayerId: hostPlayer.id,
      players: new Map([[hostPlayer.id, hostPlayer]]),
      currentRound: null,
      roundCount: 0,
    };
    this.rooms.set(roomId, room);
    return room;
  }

  getRoom(roomId: string): RoomState | undefined {
    return this.rooms.get(roomId);
  }

  removeRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room?.currentRound?.autoCallTimer) {
      clearInterval(room.currentRound.autoCallTimer);
    }
    this.rooms.delete(roomId);
  }

  addPlayer(roomId: string, player: PlayerInfo): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    room.players.set(player.id, player);
    return true;
  }

  removePlayer(roomId: string, playerId: string): { removed: boolean; newHostId?: string } {
    const room = this.rooms.get(roomId);
    if (!room) return { removed: false };

    room.players.delete(playerId);

    // If host left, assign new host
    if (room.hostPlayerId === playerId && room.players.size > 0) {
      const newHost = room.players.values().next().value!;
      room.hostPlayerId = newHost.id;
      newHost.isHost = true;
      return { removed: true, newHostId: newHost.id };
    }

    return { removed: true };
  }

  setPlayerConnected(roomId: string, playerId: string, connected: boolean): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const player = room.players.get(playerId);
    if (player) {
      player.isConnected = connected;
    }
  }

  isHost(roomId: string, playerId: string): boolean {
    const room = this.rooms.get(roomId);
    return room?.hostPlayerId === playerId;
  }

  /**
   * Starts a new round in the room.
   */
  startRound(
    roomId: string,
    roundId: string,
    enabledCategories: WinningCategory[],
    playerIds: string[]
  ): { success: boolean; tickets: Map<string, number[][]>; message?: string } {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, tickets: new Map(), message: 'Room not found' };

    if (room.currentRound && room.currentRound.status === GameStatus.IN_PROGRESS) {
      return { success: false, tickets: new Map(), message: 'A round is already in progress' };
    }

    room.roundCount++;

    // Generate remaining numbers pool (1–100 shuffled)
    const remainingNumbers = shuffleArray(
      Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + MIN_NUMBER)
    );

    // Generate tickets for all players
    const tickets = new Map<string, number[][]>();
    for (const playerId of playerIds) {
      tickets.set(playerId, generateTicket());
    }

    const round: RoundState = {
      roundId,
      roundNumber: room.roundCount,
      status: GameStatus.IN_PROGRESS,
      calledNumbers: [],
      remainingNumbers,
      enabledCategories,
      claims: new Map(),
      tickets,
      autoCall: false,
      autoCallInterval: 5,
      autoCallTimer: null,
      startedAt: new Date(),
    };

    room.currentRound = round;

    return { success: true, tickets };
  }

  /**
   * Calls the next number in the sequence.
   * Returns the called number, or null if no numbers remain.
   */
  callNumber(roomId: string): { number: number | null; message?: string } {
    const room = this.rooms.get(roomId);
    if (!room || !room.currentRound) {
      return { number: null, message: 'No active round' };
    }

    const round = room.currentRound;

    if (round.status !== GameStatus.IN_PROGRESS) {
      return { number: null, message: 'Round is not in progress' };
    }

    if (round.remainingNumbers.length === 0) {
      return { number: null, message: 'All numbers have been called' };
    }

    const number = round.remainingNumbers.pop()!;
    round.calledNumbers.push(number);

    return { number };
  }

  /**
   * Validates a winning claim for a player.
   */
  validateClaim(
    roomId: string,
    playerId: string,
    category: WinningCategory
  ): { valid: boolean; claim?: CategoryClaim; message: string } {
    const room = this.rooms.get(roomId);
    if (!room || !room.currentRound) {
      return { valid: false, message: 'No active round' };
    }

    const round = room.currentRound;

    if (round.status !== GameStatus.IN_PROGRESS) {
      return { valid: false, message: 'Round is not in progress' };
    }

    // Check if category is enabled
    if (!round.enabledCategories.includes(category)) {
      return { valid: false, message: 'This category is not enabled for this round' };
    }

    // Check if category already claimed
    if (round.claims.has(category)) {
      return { valid: false, message: 'This category has already been won' };
    }

    // Get player's ticket
    const ticket = round.tickets.get(playerId);
    if (!ticket) {
      return { valid: false, message: 'No ticket found for this player' };
    }

    // Validate the claim against called numbers
    const isWon = checkWinningCategory(ticket, round.calledNumbers, category);
    if (!isWon) {
      return { valid: false, message: 'Claim is not valid - required numbers have not been called' };
    }

    const winIndex = getCategoryWinIndex(ticket, round.calledNumbers, category);
    const player = room.players.get(playerId);

    const claim: CategoryClaim = {
      category,
      playerId,
      playerName: player?.displayName ?? 'Unknown',
      calledNumberIndex: winIndex,
      claimedAt: new Date().toISOString(),
    };

    round.claims.set(category, claim);

    return { valid: true, claim, message: 'Claim accepted!' };
  }

  /**
   * Toggles automatic number calling.
   */
  setAutoCall(
    roomId: string,
    enabled: boolean,
    interval: number = 5,
    onCall: (num: number) => void,
    onComplete: () => void
  ): boolean {
    const room = this.rooms.get(roomId);
    if (!room || !room.currentRound) return false;

    const round = room.currentRound;

    // Clear existing timer
    if (round.autoCallTimer) {
      clearInterval(round.autoCallTimer);
      round.autoCallTimer = null;
    }

    round.autoCall = enabled;
    round.autoCallInterval = interval;

    if (enabled && round.status === GameStatus.IN_PROGRESS) {
      round.autoCallTimer = setInterval(() => {
        if (round.status !== GameStatus.IN_PROGRESS) {
          if (round.autoCallTimer) {
            clearInterval(round.autoCallTimer);
            round.autoCallTimer = null;
          }
          return;
        }

        const result = this.callNumber(roomId);
        if (result.number !== null) {
          onCall(result.number);
        }

        if (round.remainingNumbers.length === 0) {
          if (round.autoCallTimer) {
            clearInterval(round.autoCallTimer);
            round.autoCallTimer = null;
          }
          round.autoCall = false;
          onComplete();
        }
      }, interval * 1000);
    }

    return true;
  }

  pauseRound(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room || !room.currentRound) return false;

    if (room.currentRound.status !== GameStatus.IN_PROGRESS) return false;

    room.currentRound.status = GameStatus.PAUSED;

    if (room.currentRound.autoCallTimer) {
      clearInterval(room.currentRound.autoCallTimer);
      room.currentRound.autoCallTimer = null;
    }

    return true;
  }

  resumeRound(
    roomId: string,
    onCall?: (num: number) => void,
    onComplete?: () => void
  ): boolean {
    const room = this.rooms.get(roomId);
    if (!room || !room.currentRound) return false;

    if (room.currentRound.status !== GameStatus.PAUSED) return false;

    room.currentRound.status = GameStatus.IN_PROGRESS;

    // Restart auto call if it was enabled
    if (room.currentRound.autoCall && onCall && onComplete) {
      this.setAutoCall(roomId, true, room.currentRound.autoCallInterval, onCall, onComplete);
    }

    return true;
  }

  endRound(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room || !room.currentRound) return false;

    const round = room.currentRound;

    if (round.autoCallTimer) {
      clearInterval(round.autoCallTimer);
      round.autoCallTimer = null;
    }

    round.status = GameStatus.COMPLETED;
    round.autoCall = false;

    return true;
  }

  /**
   * Gets the current game state for broadcasting.
   */
  getGameState(roomId: string): GameState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const round = room.currentRound;

    return {
      roomId: room.roomId,
      roomCode: room.roomCode,
      roomName: room.roomName,
      roundId: round?.roundId ?? null,
      roundNumber: round?.roundNumber ?? 0,
      status: round?.status ?? GameStatus.WAITING,
      calledNumbers: round?.calledNumbers ?? [],
      lastCalledNumber: round?.calledNumbers.length
        ? round.calledNumbers[round.calledNumbers.length - 1]
        : null,
      players: Array.from(room.players.values()),
      enabledCategories: round?.enabledCategories ?? [],
      claimedCategories: round ? Array.from(round.claims.values()) : [],
      autoCall: round?.autoCall ?? false,
      autoCallInterval: round?.autoCallInterval ?? 5,
      startedAt: round?.startedAt?.toISOString() ?? null,
    };
  }

  getPlayerTicket(roomId: string, playerId: string): number[][] | null {
    const room = this.rooms.get(roomId);
    if (!room || !room.currentRound) return null;
    return room.currentRound.tickets.get(playerId) ?? null;
  }
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Singleton instance
export const gameEngine = new GameEngine();

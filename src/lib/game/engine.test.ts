import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine } from './game-engine';
import { GameStatus, WinningCategory, PlayerInfo } from './types';

describe('GameEngine Integration 3x9', () => {
  let engine: GameEngine;
  const hostPlayer: PlayerInfo = {
    id: 'player-1',
    displayName: 'Alice',
    isHost: true,
    isConnected: true,
  };
  const guestPlayer: PlayerInfo = {
    id: 'player-2',
    displayName: 'Bob',
    isHost: false,
    isConnected: true,
  };

  beforeEach(() => {
    engine = new GameEngine();
  });

  it('creates room and registers host', () => {
    const room = engine.createRoom('room-1', 'TEST01', 'Game Room', hostPlayer);
    expect(room.roomId).toBe('room-1');
    expect(room.hostPlayerId).toBe('player-1');
    expect(engine.isHost('room-1', 'player-1')).toBe(true);
    expect(engine.isHost('room-1', 'player-2')).toBe(false);
  });

  it('starts a round and assigns 3x9 tickets to all participants', () => {
    engine.createRoom('room-1', 'TEST01', 'Game Room', hostPlayer);
    engine.addPlayer('room-1', guestPlayer);

    const result = engine.startRound('room-1', 'round-1', [WinningCategory.EARLY_FIVE, WinningCategory.TOP_LINE], [
      'player-1',
      'player-2',
    ]);

    expect(result.success).toBe(true);
    expect(result.tickets.size).toBe(2);
    expect(result.tickets.get('player-1')).toHaveLength(3);
    expect(result.tickets.get('player-1')![0]).toHaveLength(9);

    const state = engine.getGameState('room-1');
    expect(state?.status).toBe(GameStatus.IN_PROGRESS);
    expect(state?.calledNumbers).toHaveLength(0);
  });

  it('calls numbers without replacement between 1 and 90', () => {
    engine.createRoom('room-1', 'TEST01', 'Game Room', hostPlayer);
    engine.startRound('room-1', 'round-1', [WinningCategory.EARLY_FIVE], ['player-1']);

    const called = new Set<number>();
    for (let i = 0; i < 40; i++) {
      const res = engine.callNumber('room-1');
      expect(res.number).not.toBeNull();
      expect(res.number!).toBeGreaterThanOrEqual(1);
      expect(res.number!).toBeLessThanOrEqual(90);
      expect(called.has(res.number!)).toBe(false);
      called.add(res.number!);
    }

    const state = engine.getGameState('room-1');
    expect(state?.calledNumbers).toHaveLength(40);
  });

  it('rejects duplicate winning claims for the same category', () => {
    engine.createRoom('room-1', 'TEST01', 'Game Room', hostPlayer);
    engine.startRound('room-1', 'round-1', [WinningCategory.EARLY_FIVE], ['player-1']);

    const room = engine.getRoom('room-1')!;
    const ticket = room.currentRound!.tickets.get('player-1')!;

    // Call 5 numbers from ticket
    const numbersToCall = ticket.flat().filter((n) => n > 0).slice(0, 5);
    room.currentRound!.calledNumbers = [...numbersToCall];

    const firstClaim = engine.validateClaim('room-1', 'player-1', WinningCategory.EARLY_FIVE);
    expect(firstClaim.valid).toBe(true);

    const secondClaim = engine.validateClaim('room-1', 'player-1', WinningCategory.EARLY_FIVE);
    expect(secondClaim.valid).toBe(false);
    expect(secondClaim.message).toContain('already been won');
  });
});

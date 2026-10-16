import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine } from './game-engine';
import { GameStatus, WinningCategory, PlayerInfo } from './types';

describe('GameEngine Integration', () => {
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

  it('starts a round and assigns tickets to all participants', () => {
    engine.createRoom('room-1', 'TEST01', 'Game Room', hostPlayer);
    engine.addPlayer('room-1', guestPlayer);

    const result = engine.startRound('room-1', 'round-1', [WinningCategory.EARLY_FIVE, WinningCategory.ROW_1], [
      'player-1',
      'player-2',
    ]);

    expect(result.success).toBe(true);
    expect(result.tickets.size).toBe(2);
    expect(result.tickets.get('player-1')).toBeDefined();
    expect(result.tickets.get('player-2')).toBeDefined();

    const state = engine.getGameState('room-1');
    expect(state?.status).toBe(GameStatus.IN_PROGRESS);
    expect(state?.calledNumbers).toHaveLength(0);
  });

  it('calls numbers without replacement between 1 and 100', () => {
    engine.createRoom('room-1', 'TEST01', 'Game Room', hostPlayer);
    engine.startRound('room-1', 'round-1', [WinningCategory.EARLY_FIVE], ['player-1']);

    const called = new Set<number>();
    for (let i = 0; i < 50; i++) {
      const res = engine.callNumber('room-1');
      expect(res.number).not.toBeNull();
      expect(res.number!).toBeGreaterThanOrEqual(1);
      expect(res.number!).toBeLessThanOrEqual(100);
      expect(called.has(res.number!)).toBe(false);
      called.add(res.number!);
    }

    const state = engine.getGameState('room-1');
    expect(state?.calledNumbers).toHaveLength(50);
  });

  it('rejects duplicate winning claims for the same category', () => {
    engine.createRoom('room-1', 'TEST01', 'Game Room', hostPlayer);
    engine.startRound('room-1', 'round-1', [WinningCategory.EARLY_FIVE], ['player-1']);

    const room = engine.getRoom('room-1')!;
    const ticket = room.currentRound!.tickets.get('player-1')!;

    // Call 5 numbers from ticket
    const numbersToCall = ticket.flat().slice(0, 5);
    room.currentRound!.calledNumbers = [...numbersToCall];

    const firstClaim = engine.validateClaim('room-1', 'player-1', WinningCategory.EARLY_FIVE);
    expect(firstClaim.valid).toBe(true);

    // Second claim should be rejected
    const secondClaim = engine.validateClaim('room-1', 'player-1', WinningCategory.EARLY_FIVE);
    expect(secondClaim.valid).toBe(false);
    expect(secondClaim.message).toContain('already been won');
  });

  it('reconnection retains player ticket and identity', () => {
    engine.createRoom('room-1', 'TEST01', 'Game Room', hostPlayer);
    engine.startRound('room-1', 'round-1', [WinningCategory.FULL_HOUSE], ['player-1']);

    const ticketBefore = engine.getPlayerTicket('room-1', 'player-1');
    expect(ticketBefore).toBeDefined();

    // Disconnect
    engine.setPlayerConnected('room-1', 'player-1', false);
    let state = engine.getGameState('room-1');
    expect(state?.players.find((p) => p.id === 'player-1')?.isConnected).toBe(false);

    // Reconnect
    engine.setPlayerConnected('room-1', 'player-1', true);
    state = engine.getGameState('room-1');
    expect(state?.players.find((p) => p.id === 'player-1')?.isConnected).toBe(true);

    const ticketAfter = engine.getPlayerTicket('room-1', 'player-1');
    expect(ticketAfter).toEqual(ticketBefore);
  });
});

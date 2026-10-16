import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { GameEngine } from '../src/lib/game/game-engine';
import { generateTicket, gridToFlat, flatToGrid } from '../src/lib/game/ticket-generator';
import {
  GameStatus,
  WinningCategory,
  ALL_WINNING_CATEGORIES,
  WINNING_CATEGORY_LABELS,
  type GameState,
  type PlayerInfo,
  type CategoryClaim,
  type TicketData,
  type ServerToClientEvents,
  type ClientToServerEvents,
} from '../src/lib/game/types';
import { generateRoomCode } from '../src/lib/room-codes';
import crypto from 'crypto';

const prisma = new PrismaClient();
const gameEngine = new GameEngine();

const shouldServeNext = process.env.SERVE_NEXT === 'true';
const PORT = parseInt(
  shouldServeNext
    ? (process.env.PORT || '3000')
    : (process.env.SOCKET_PORT || '3001'),
  10
);
const dev = process.env.NODE_ENV !== 'production';

let nextApp: any = null;
let nextHandler: any = null;

if (shouldServeNext) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const next = require('next');
    nextApp = next({ dev });
    nextHandler = nextApp.getRequestHandler();
  } catch (err) {
    console.warn('Next.js handler could not be loaded:', err);
  }
}

const httpServer = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }
  if (nextHandler) {
    return nextHandler(req, res);
  }
  res.writeHead(404);
  res.end();
});

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 30000,
  pingInterval: 10000,
});

// Maps for socket-to-player tracking
const socketToPlayer = new Map<string, { playerId: string; roomId: string }>();
const playerToSocket = new Map<string, string>(); // playerId -> socketId

// Rate limiting
const rateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, maxPerMinute: number = 60): boolean {
  const now = Date.now();
  const limit = rateLimits.get(key);
  if (!limit || now > limit.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + 60000 });
    return true;
  }
  if (limit.count >= maxPerMinute) return false;
  limit.count++;
  return true;
}

function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function broadcastGameState(roomId: string) {
  const state = gameEngine.getGameState(roomId);
  if (state) {
    io.to(roomId).emit('game:state', state);
  }
}

function broadcastEvent(roomId: string, type: string, message: string) {
  io.to(roomId).emit('game:event', {
    type,
    message,
    timestamp: new Date().toISOString(),
  });
}

io.on('connection', (socket) => {
  // JOIN ROOM
  socket.on('room:join', async (data, callback) => {
    try {
      if (!checkRateLimit(socket.id, 10)) {
        callback({ success: false, message: 'Too many requests. Please slow down.' });
        return;
      }

      const { roomCode, displayName, sessionToken } = data;

      if (!roomCode || !displayName) {
        callback({ success: false, message: 'Room code and display name are required.' });
        return;
      }

      if (displayName.length < 2 || displayName.length > 20) {
        callback({ success: false, message: 'Display name must be 2-20 characters.' });
        return;
      }

      // Find the room in database
      const room = await prisma.room.findUnique({
        where: { roomCode: roomCode.toUpperCase() },
        include: { players: true, rounds: { orderBy: { roundNumber: 'desc' }, take: 1 } },
      });

      if (!room || !room.isActive) {
        callback({ success: false, message: 'Room not found or no longer active.' });
        return;
      }

      let player;
      let newSessionToken: string | undefined;

      // Try reconnection with session token
      if (sessionToken) {
        player = await prisma.player.findUnique({
          where: { sessionToken },
        });

        if (player && player.roomId === room.id) {
          // Reconnecting existing player
          await prisma.player.update({
            where: { id: player.id },
            data: { isConnected: true, lastSeenAt: new Date() },
          });
        } else {
          player = null;
        }
      }

      // New player joining
      if (!player) {
        const existing = await prisma.player.findUnique({
          where: { roomId_displayName: { roomId: room.id, displayName: displayName.trim() } },
        });

        if (existing) {
          callback({
            success: false,
            message: 'This name is already taken in this room. If you were disconnected, use your session token to reconnect.',
          });
          return;
        }

        const activePlayers = await prisma.player.count({
          where: { roomId: room.id },
        });

        if (activePlayers >= room.maxPlayers) {
          callback({ success: false, message: 'Room is full.' });
          return;
        }

        newSessionToken = generateSessionToken();
        const isFirstPlayer = activePlayers === 0;

        player = await prisma.player.create({
          data: {
            displayName: displayName.trim(),
            sessionToken: newSessionToken,
            roomId: room.id,
            isHost: isFirstPlayer || room.hostPlayerId === null,
            isConnected: true,
          },
        });

        if (isFirstPlayer || room.hostPlayerId === null) {
          await prisma.room.update({
            where: { id: room.id },
            data: { hostPlayerId: player.id },
          });
        }
      }

      // Update in-memory game state
      let roomState = gameEngine.getRoom(room.id);
      if (!roomState) {
        const hostPlayer = room.hostPlayerId
          ? await prisma.player.findUnique({ where: { id: room.hostPlayerId } })
          : player;

        const hostInfo: PlayerInfo = {
          id: hostPlayer?.id || player.id,
          displayName: hostPlayer?.displayName || player.displayName,
          isHost: true,
          isConnected: true,
        };

        roomState = gameEngine.createRoom(room.id, room.roomCode, room.name, hostInfo);

        const dbPlayers = await prisma.player.findMany({ where: { roomId: room.id } });
        for (const p of dbPlayers) {
          if (p.id !== hostInfo.id) {
            gameEngine.addPlayer(room.id, {
              id: p.id,
              displayName: p.displayName,
              isHost: p.isHost,
              isConnected: false,
            });
          }
        }

        // Restore active round if exists
        const activeRound = room.rounds[0];
        if (activeRound && activeRound.status !== 'completed') {
          const tickets = await prisma.ticket.findMany({
            where: { roundId: activeRound.id },
          });

          const claims = await prisma.winningClaim.findMany({
            where: { roundId: activeRound.id },
            include: { player: true },
          });

          const enabledCats = JSON.parse(activeRound.enabledCategories || '[]') as WinningCategory[];
          const calledNums = JSON.parse(activeRound.calledNumbers || '[]') as number[];

          gameEngine.startRound(
            room.id,
            activeRound.id,
            enabledCats,
            tickets.map((t) => t.playerId)
          );

          if (roomState.currentRound) {
            roomState.currentRound.calledNumbers = calledNums;
            const calledSet = new Set(calledNums);
            roomState.currentRound.remainingNumbers = roomState.currentRound.remainingNumbers.filter(
              (n) => !calledSet.has(n)
            );
            roomState.currentRound.status = activeRound.status as GameStatus;
            roomState.currentRound.roundNumber = activeRound.roundNumber;

            for (const t of tickets) {
              const nums = JSON.parse(t.numbers) as number[];
              roomState.currentRound.tickets.set(t.playerId, flatToGrid(nums));
            }

            for (const c of claims) {
              roomState.currentRound.claims.set(c.category as WinningCategory, {
                category: c.category as WinningCategory,
                playerId: c.playerId,
                playerName: c.player.displayName,
                calledNumberIndex: c.calledNumberIndex,
                claimedAt: c.claimedAt.toISOString(),
              });
            }
          }
        }
      }

      const playerInfo: PlayerInfo = {
        id: player.id,
        displayName: player.displayName,
        isHost: player.isHost,
        isConnected: true,
      };

      if (!roomState.players.has(player.id)) {
        gameEngine.addPlayer(room.id, playerInfo);
      } else {
        gameEngine.setPlayerConnected(room.id, player.id, true);
      }

      const prevMapping = socketToPlayer.get(socket.id);
      if (prevMapping) {
        playerToSocket.delete(prevMapping.playerId);
      }

      const oldSocketId = playerToSocket.get(player.id);
      if (oldSocketId && oldSocketId !== socket.id) {
        const oldSocket = io.sockets.sockets.get(oldSocketId);
        if (oldSocket) {
          oldSocket.leave(room.id);
          socketToPlayer.delete(oldSocketId);
        }
      }

      socketToPlayer.set(socket.id, { playerId: player.id, roomId: room.id });
      playerToSocket.set(player.id, socket.id);

      socket.join(room.id);

      if (roomState.currentRound) {
        const ticket = roomState.currentRound.tickets.get(player.id);
        if (ticket) {
          socket.emit('game:ticket', {
            id: `ticket-${player.id}-${roomState.currentRound.roundId}`,
            numbers: ticket,
            playerId: player.id,
            roundId: roomState.currentRound.roundId,
          });
        }
      }

      socket.to(room.id).emit('game:player-joined', playerInfo);
      broadcastEvent(room.id, 'player_joined', `${player.displayName} joined the room`);
      broadcastGameState(room.id);

      callback({
        success: true,
        playerId: player.id,
        sessionToken: newSessionToken || sessionToken,
      });
    } catch (error) {
      console.error('Error joining room:', error);
      callback({ success: false, message: 'Failed to join room. Please try again.' });
    }
  });

  // GET STATE
  socket.on('room:get-state', (callback) => {
    const mapping = socketToPlayer.get(socket.id);
    if (!mapping) {
      callback(null);
      return;
    }
    const state = gameEngine.getGameState(mapping.roomId);
    callback(state);
  });

  // START GAME
  socket.on('game:start', async (data, callback) => {
    try {
      const mapping = socketToPlayer.get(socket.id);
      if (!mapping) {
        callback({ success: false, message: 'Not in a room.' });
        return;
      }

      if (!gameEngine.isHost(mapping.roomId, mapping.playerId)) {
        callback({ success: false, message: 'Only the host can start the game.' });
        return;
      }

      const room = gameEngine.getRoom(mapping.roomId);
      if (!room) {
        callback({ success: false, message: 'Room not found.' });
        return;
      }

      if (room.currentRound && room.currentRound.status === GameStatus.IN_PROGRESS) {
        callback({ success: false, message: 'A round is already in progress.' });
        return;
      }

      const enabledCategories =
        data.enabledCategories && data.enabledCategories.length > 0
          ? data.enabledCategories
          : ALL_WINNING_CATEGORIES;

      const playerIds = Array.from(room.players.keys());

      if (playerIds.length < 1) {
        callback({ success: false, message: 'Need at least 1 player to start.' });
        return;
      }

      const lastRound = await prisma.gameRound.findFirst({
        where: { roomId: mapping.roomId },
        orderBy: { roundNumber: 'desc' },
      });

      const roundNumber = (lastRound?.roundNumber ?? 0) + 1;

      const dbRound = await prisma.gameRound.create({
        data: {
          roomId: mapping.roomId,
          roundNumber,
          status: 'in_progress',
          enabledCategories: JSON.stringify(enabledCategories),
          calledNumbers: JSON.stringify([]),
          startedAt: new Date(),
        },
      });

      const result = gameEngine.startRound(
        mapping.roomId,
        dbRound.id,
        enabledCategories,
        playerIds
      );

      if (!result.success) {
        callback({ success: false, message: result.message });
        return;
      }

      if (room.currentRound) {
        room.currentRound.roundNumber = roundNumber;
      }

      for (const [playerId, ticket] of result.tickets) {
        await prisma.ticket.create({
          data: {
            playerId,
            roundId: dbRound.id,
            numbers: JSON.stringify(gridToFlat(ticket)),
          },
        });

        const playerSocketId = playerToSocket.get(playerId);
        if (playerSocketId) {
          io.to(playerSocketId).emit('game:ticket', {
            id: `ticket-${playerId}-${dbRound.id}`,
            numbers: ticket,
            playerId,
            roundId: dbRound.id,
          });
        }
      }

      broadcastGameState(mapping.roomId);
      broadcastEvent(mapping.roomId, 'round_started', `Round ${roundNumber} has started!`);

      callback({ success: true });
    } catch (error) {
      console.error('Error starting game:', error);
      callback({ success: false, message: 'Failed to start game.' });
    }
  });

  // CALL NUMBER
  socket.on('game:call-number', async (callback) => {
    try {
      const mapping = socketToPlayer.get(socket.id);
      if (!mapping) {
        callback({ success: false, message: 'Not in a room.' });
        return;
      }

      if (!gameEngine.isHost(mapping.roomId, mapping.playerId)) {
        callback({ success: false, message: 'Only the host can call numbers.' });
        return;
      }

      if (!checkRateLimit(`call-${mapping.roomId}`, 30)) {
        callback({ success: false, message: 'Calling too fast.' });
        return;
      }

      const result = gameEngine.callNumber(mapping.roomId);

      if (result.number === null) {
        callback({ success: false, message: result.message || 'No numbers to call.' });
        return;
      }

      const room = gameEngine.getRoom(mapping.roomId);
      const calledNumbers = room?.currentRound?.calledNumbers ?? [];

      if (room?.currentRound) {
        await prisma.gameRound.update({
          where: { id: room.currentRound.roundId },
          data: { calledNumbers: JSON.stringify(calledNumbers) },
        });
      }

      io.to(mapping.roomId).emit('game:number-called', {
        number: result.number,
        calledNumbers,
      });

      broadcastGameState(mapping.roomId);

      callback({ success: true, number: result.number });
    } catch (error) {
      console.error('Error calling number:', error);
      callback({ success: false, message: 'Failed to call number.' });
    }
  });

  // TOGGLE AUTO CALL
  socket.on('game:toggle-auto-call', async (data, callback) => {
    try {
      const mapping = socketToPlayer.get(socket.id);
      if (!mapping) {
        callback({ success: false, message: 'Not in a room.' });
        return;
      }

      if (!gameEngine.isHost(mapping.roomId, mapping.playerId)) {
        callback({ success: false, message: 'Only the host can toggle auto-call.' });
        return;
      }

      const interval = data.interval ?? 5;

      const onCall = async (num: number) => {
        const room = gameEngine.getRoom(mapping.roomId);
        const calledNumbers = room?.currentRound?.calledNumbers ?? [];

        if (room?.currentRound) {
          await prisma.gameRound
            .update({
              where: { id: room.currentRound.roundId },
              data: { calledNumbers: JSON.stringify(calledNumbers) },
            })
            .catch(console.error);
        }

        io.to(mapping.roomId).emit('game:number-called', {
          number: num,
          calledNumbers,
        });

        broadcastGameState(mapping.roomId);
      };

      const onComplete = () => {
        broadcastGameState(mapping.roomId);
        broadcastEvent(mapping.roomId, 'all_called', 'All 90 numbers have been called!');
      };

      gameEngine.setAutoCall(mapping.roomId, data.enabled, interval, onCall, onComplete);

      const room = gameEngine.getRoom(mapping.roomId);
      if (room?.currentRound) {
        await prisma.gameRound.update({
          where: { id: room.currentRound.roundId },
          data: {
            autoCall: data.enabled,
            autoCallInterval: interval,
          },
        });
      }

      broadcastGameState(mapping.roomId);

      callback({ success: true });
    } catch (error) {
      console.error('Error toggling auto-call:', error);
      callback({ success: false, message: 'Failed to toggle auto-call.' });
    }
  });

  // PAUSE
  socket.on('game:pause', (callback) => {
    const mapping = socketToPlayer.get(socket.id);
    if (!mapping) {
      callback({ success: false, message: 'Not in a room.' });
      return;
    }

    if (!gameEngine.isHost(mapping.roomId, mapping.playerId)) {
      callback({ success: false, message: 'Only the host can pause.' });
      return;
    }

    const success = gameEngine.pauseRound(mapping.roomId);

    if (success) {
      const room = gameEngine.getRoom(mapping.roomId);
      if (room?.currentRound) {
        prisma.gameRound
          .update({
            where: { id: room.currentRound.roundId },
            data: { status: 'paused' },
          })
          .catch(console.error);
      }

      broadcastGameState(mapping.roomId);
      broadcastEvent(mapping.roomId, 'paused', 'Game paused by host');
    }

    callback({ success });
  });

  // RESUME
  socket.on('game:resume', (callback) => {
    const mapping = socketToPlayer.get(socket.id);
    if (!mapping) {
      callback({ success: false, message: 'Not in a room.' });
      return;
    }

    if (!gameEngine.isHost(mapping.roomId, mapping.playerId)) {
      callback({ success: false, message: 'Only the host can resume.' });
      return;
    }

    const onCall = async (num: number) => {
      const room = gameEngine.getRoom(mapping.roomId);
      const calledNumbers = room?.currentRound?.calledNumbers ?? [];
      if (room?.currentRound) {
        await prisma.gameRound
          .update({
            where: { id: room.currentRound.roundId },
            data: { calledNumbers: JSON.stringify(calledNumbers) },
          })
          .catch(console.error);
      }
      io.to(mapping.roomId).emit('game:number-called', { number: num, calledNumbers });
      broadcastGameState(mapping.roomId);
    };

    const onComplete = () => {
      broadcastGameState(mapping.roomId);
      broadcastEvent(mapping.roomId, 'all_called', 'All 90 numbers have been called!');
    };

    const success = gameEngine.resumeRound(mapping.roomId, onCall, onComplete);

    if (success) {
      const room = gameEngine.getRoom(mapping.roomId);
      if (room?.currentRound) {
        prisma.gameRound
          .update({
            where: { id: room.currentRound.roundId },
            data: { status: 'in_progress' },
          })
          .catch(console.error);
      }

      broadcastGameState(mapping.roomId);
      broadcastEvent(mapping.roomId, 'resumed', 'Game resumed by host');
    }

    callback({ success });
  });

  // CLAIM WIN
  socket.on('game:claim', async (data, callback) => {
    try {
      const mapping = socketToPlayer.get(socket.id);
      if (!mapping) {
        callback({ success: false, message: 'Not in a room.' });
        return;
      }

      if (!checkRateLimit(`claim-${mapping.playerId}`, 10)) {
        callback({ success: false, message: 'Too many claims. Please slow down.' });
        return;
      }

      const result = gameEngine.validateClaim(mapping.roomId, mapping.playerId, data.category);

      if (!result.valid || !result.claim) {
        callback({ success: false, message: result.message });
        return;
      }

      const room = gameEngine.getRoom(mapping.roomId);
      if (room?.currentRound) {
        await prisma.winningClaim.create({
          data: {
            playerId: mapping.playerId,
            roundId: room.currentRound.roundId,
            category: data.category,
            calledNumberIndex: result.claim.calledNumberIndex,
            isValid: true,
          },
        });
      }

      io.to(mapping.roomId).emit('game:category-won', result.claim);
      io.to(mapping.roomId).emit('game:claim-result', {
        success: true,
        claim: result.claim,
        message: `${result.claim.playerName} won ${WINNING_CATEGORY_LABELS[data.category]}!`,
      });

      broadcastEvent(
        mapping.roomId,
        'category_won',
        `🏆 ${result.claim.playerName} won ${WINNING_CATEGORY_LABELS[data.category]}!`
      );

      broadcastGameState(mapping.roomId);

      callback({ success: true, message: 'Claim accepted!' });
    } catch (error) {
      console.error('Error processing claim:', error);
      callback({ success: false, message: 'Failed to process claim.' });
    }
  });

  // END ROUND
  socket.on('game:end-round', async (callback) => {
    try {
      const mapping = socketToPlayer.get(socket.id);
      if (!mapping) {
        callback({ success: false, message: 'Not in a room.' });
        return;
      }

      if (!gameEngine.isHost(mapping.roomId, mapping.playerId)) {
        callback({ success: false, message: 'Only the host can end the round.' });
        return;
      }

      const room = gameEngine.getRoom(mapping.roomId);
      if (!room?.currentRound) {
        callback({ success: false, message: 'No active round.' });
        return;
      }

      gameEngine.endRound(mapping.roomId);

      await prisma.gameRound.update({
        where: { id: room.currentRound.roundId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          calledNumbers: JSON.stringify(room.currentRound.calledNumbers),
        },
      });

      const startedAt = room.currentRound.startedAt?.toISOString() ?? new Date().toISOString();
      const completedAt = new Date().toISOString();
      const duration = Math.floor(
        (new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000
      );

      io.to(mapping.roomId).emit('game:round-completed', {
        roundId: room.currentRound.roundId,
        roundNumber: room.currentRound.roundNumber,
        totalNumbersCalled: room.currentRound.calledNumbers.length,
        claims: Array.from(room.currentRound.claims.values()),
        players: Array.from(room.players.values()),
        startedAt,
        completedAt,
        duration,
      });

      broadcastEvent(mapping.roomId, 'round_ended', `Round ${room.currentRound.roundNumber} completed!`);
      broadcastGameState(mapping.roomId);

      callback({ success: true });
    } catch (error) {
      console.error('Error ending round:', error);
      callback({ success: false, message: 'Failed to end round.' });
    }
  });

  // NEXT ROUND
  socket.on('game:next-round', async (data, callback) => {
    try {
      const mapping = socketToPlayer.get(socket.id);
      if (!mapping) {
        callback({ success: false, message: 'Not in a room.' });
        return;
      }

      if (!gameEngine.isHost(mapping.roomId, mapping.playerId)) {
        callback({ success: false, message: 'Only the host can start the next round.' });
        return;
      }

      const room = gameEngine.getRoom(mapping.roomId);
      if (!room) {
        callback({ success: false, message: 'Room not found.' });
        return;
      }

      if (room.currentRound && room.currentRound.status !== GameStatus.COMPLETED) {
        callback({ success: false, message: 'End the current round first.' });
        return;
      }

      room.currentRound = null;

      // Start new round logic
      const enabledCategories =
        data.enabledCategories && data.enabledCategories.length > 0
          ? data.enabledCategories
          : ALL_WINNING_CATEGORIES;

      const playerIds = Array.from(room.players.keys());
      const lastRound = await prisma.gameRound.findFirst({
        where: { roomId: mapping.roomId },
        orderBy: { roundNumber: 'desc' },
      });

      const roundNumber = (lastRound?.roundNumber ?? 0) + 1;

      const dbRound = await prisma.gameRound.create({
        data: {
          roomId: mapping.roomId,
          roundNumber,
          status: 'in_progress',
          enabledCategories: JSON.stringify(enabledCategories),
          calledNumbers: JSON.stringify([]),
          startedAt: new Date(),
        },
      });

      const result = gameEngine.startRound(
        mapping.roomId,
        dbRound.id,
        enabledCategories,
        playerIds
      );

      if (!result.success) {
        callback({ success: false, message: result.message });
        return;
      }

      const activeRoom = gameEngine.getRoom(mapping.roomId);
      if (activeRoom?.currentRound) {
        activeRoom.currentRound.roundNumber = roundNumber;
      }

      for (const [playerId, ticket] of result.tickets) {
        await prisma.ticket.create({
          data: {
            playerId,
            roundId: dbRound.id,
            numbers: JSON.stringify(gridToFlat(ticket)),
          },
        });

        const playerSocketId = playerToSocket.get(playerId);
        if (playerSocketId) {
          io.to(playerSocketId).emit('game:ticket', {
            id: `ticket-${playerId}-${dbRound.id}`,
            numbers: ticket,
            playerId,
            roundId: dbRound.id,
          });
        }
      }

      broadcastGameState(mapping.roomId);
      broadcastEvent(mapping.roomId, 'round_started', `Round ${roundNumber} has started!`);

      callback({ success: true });
    } catch (error) {
      console.error('Error starting next round:', error);
      callback({ success: false, message: 'Failed to start next round.' });
    }
  });

  // DISCONNECT
  socket.on('disconnect', async () => {
    const mapping = socketToPlayer.get(socket.id);
    if (!mapping) return;

    gameEngine.setPlayerConnected(mapping.roomId, mapping.playerId, false);

    await prisma.player
      .update({
        where: { id: mapping.playerId },
        data: { isConnected: false, lastSeenAt: new Date() },
      })
      .catch(console.error);

    const room = gameEngine.getRoom(mapping.roomId);
    const player = room?.players.get(mapping.playerId);

    if (player) {
      io.to(mapping.roomId).emit('game:player-left', {
        playerId: mapping.playerId,
        displayName: player.displayName,
      });
      broadcastEvent(mapping.roomId, 'player_left', `${player.displayName} disconnected`);
    }

    broadcastGameState(mapping.roomId);

    socketToPlayer.delete(socket.id);
    playerToSocket.delete(mapping.playerId);
  });
});

async function startServer() {
  if (nextApp) {
    console.log('⏳ Preparing Next.js application...');
    await nextApp.prepare();
  }
  httpServer.listen(PORT, () => {
    console.log(`🎮 Housie Night server running on port ${PORT}${shouldServeNext ? ' (Fullstack Next.js + Socket.IO)' : ' (Socket.IO standalone)'}`);
  });
}

startServer();

process.on('SIGINT', async () => {
  io.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  io.close();
  await prisma.$disconnect();
  process.exit(0);
});

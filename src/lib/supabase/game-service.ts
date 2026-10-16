import crypto from 'crypto';
import { serverSupabase } from './server';
import prisma from '@/lib/db';
import { generateTicket, gridToFlat, flatToGrid } from '@/lib/game/ticket-generator';
import { checkWinningCategory, getCategoryWinIndex } from '@/lib/game/winning-checker';
import {
  GameStatus,
  WinningCategory,
  ALL_WINNING_CATEGORIES,
  WINNING_CATEGORY_LABELS,
  GameState,
  PlayerInfo,
  CategoryClaim,
  TOTAL_NUMBERS,
  MIN_NUMBER,
} from '@/lib/game/types';
import { generateRoomCode } from '@/lib/room-codes';

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Broadcasts an event to all clients connected to the Supabase Realtime room channel.
 */
export async function broadcastToRoom(roomCode: string, event: string, payload: any) {
  try {
    const channel = serverSupabase.channel(`room:${roomCode.toUpperCase()}`);
    await channel.subscribe();
    await channel.send({
      type: 'broadcast',
      event,
      payload,
    });
    // Cleanup channel after sending
    setTimeout(() => {
      serverSupabase.removeChannel(channel);
    }, 1000);
  } catch (err) {
    console.warn(`[Realtime Broadcast Failed for ${roomCode}]:`, err);
  }
}

/**
 * Creates a new game room and sets creator as the initial host.
 */
export async function createGameRoom(roomName: string, hostDisplayName?: string) {
  let roomCode = generateRoomCode();
  let attempts = 0;

  // Try Supabase first
  try {
    const { data: existing } = await serverSupabase
      .from('rooms')
      .select('id')
      .eq('room_code', roomCode)
      .maybeSingle();

    while (existing && attempts < 10) {
      roomCode = generateRoomCode();
      attempts++;
    }

    const { data: newRoom, error } = await serverSupabase
      .from('rooms')
      .insert({
        room_code: roomCode,
        name: roomName,
        status: 'waiting',
        is_active: true,
      })
      .select()
      .single();

    if (!error && newRoom) {
      return {
        success: true,
        roomId: newRoom.id,
        roomCode: newRoom.room_code,
        roomName: newRoom.name,
      };
    }
  } catch (supabaseErr) {
    console.warn('Supabase rooms table not ready, falling back to local storage:', supabaseErr);
  }

  // Fallback to Prisma
  let prismaAttempts = 0;
  while (prismaAttempts < 10) {
    const existing = await prisma.room.findUnique({ where: { roomCode } });
    if (!existing) break;
    roomCode = generateRoomCode();
    prismaAttempts++;
  }

  const room = await prisma.room.create({
    data: {
      roomCode,
      name: roomName,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  return {
    success: true,
    roomId: room.id,
    roomCode: room.roomCode,
    roomName: room.name,
  };
}

/**
 * Joins a room or reconnects an existing session.
 */
export async function joinGameRoom(
  roomCode: string,
  displayName: string,
  sessionToken?: string
) {
  const code = roomCode.toUpperCase().trim();
  const name = displayName.trim();

  // Try Supabase
  try {
    const { data: room } = await serverSupabase
      .from('rooms')
      .select('id, room_code, name, host_player_id, is_active')
      .eq('room_code', code)
      .eq('is_active', true)
      .maybeSingle();

    if (room) {
      let player = null;
      let newSessionToken = sessionToken;

      // Check session token for reconnection
      if (sessionToken) {
        const { data: existingPlayer } = await serverSupabase
          .from('players')
          .select('id, display_name, is_host, room_id')
          .eq('session_token', sessionToken)
          .eq('room_id', room.id)
          .maybeSingle();

        if (existingPlayer) {
          player = existingPlayer;
          await serverSupabase
            .from('players')
            .update({ is_connected: true, last_seen_at: new Date().toISOString() })
            .eq('id', player.id);
        }
      }

      // If new player
      if (!player) {
        // Check for duplicate name
        const { data: nameTaken } = await serverSupabase
          .from('players')
          .select('id')
          .eq('room_id', room.id)
          .eq('display_name', name)
          .maybeSingle();

        if (nameTaken) {
          return {
            success: false,
            message: 'This display name is already taken in this room. Please choose another.',
          };
        }

        // Count existing players to determine host
        const { count } = await serverSupabase
          .from('players')
          .select('*', { count: 'exact', head: true })
          .eq('room_id', room.id);

        const isHost = count === 0 || !room.host_player_id;
        newSessionToken = generateSessionToken();

        const { data: createdPlayer, error: createError } = await serverSupabase
          .from('players')
          .insert({
            room_id: room.id,
            display_name: name,
            session_token: newSessionToken,
            is_host: isHost,
            is_connected: true,
          })
          .select()
          .single();

        if (createError || !createdPlayer) {
          throw new Error(createError?.message || 'Failed to create player record');
        }

        player = createdPlayer;

        if (isHost) {
          await serverSupabase
            .from('rooms')
            .update({ host_player_id: player.id })
            .eq('id', room.id);
        }
      }

      await broadcastToRoom(code, 'game:player-joined', {
        id: player.id,
        displayName: player.display_name,
        isHost: player.is_host,
        isConnected: true,
      });

      return {
        success: true,
        playerId: player.id,
        sessionToken: newSessionToken,
        isHost: player.is_host,
        roomName: room.name,
      };
    }
  } catch (supabaseErr) {
    console.warn('Supabase room join check failed, using Prisma fallback:', supabaseErr);
  }

  // Fallback to Prisma
  const room = await prisma.room.findUnique({
    where: { roomCode: code },
    include: { players: true },
  });

  if (!room || !room.isActive) {
    return { success: false, message: 'Room not found or no longer active.' };
  }

  let player = null;
  let newSessionToken = sessionToken;

  if (sessionToken) {
    player = await prisma.player.findUnique({ where: { sessionToken } });
    if (player && player.roomId === room.id) {
      await prisma.player.update({
        where: { id: player.id },
        data: { isConnected: true, lastSeenAt: new Date() },
      });
    } else {
      player = null;
    }
  }

  if (!player) {
    const existing = await prisma.player.findUnique({
      where: { roomId_displayName: { roomId: room.id, displayName: name } },
    });

    if (existing) {
      return { success: false, message: 'This display name is already taken in this room.' };
    }

    const isHost = room.players.length === 0 || room.hostPlayerId === null;
    newSessionToken = generateSessionToken();

    player = await prisma.player.create({
      data: {
        displayName: name,
        sessionToken: newSessionToken,
        roomId: room.id,
        isHost,
        isConnected: true,
      },
    });

    if (isHost) {
      await prisma.room.update({
        where: { id: room.id },
        data: { hostPlayerId: player.id },
      });
    }
  }

  await broadcastToRoom(code, 'game:player-joined', {
    id: player.id,
    displayName: player.displayName,
    isHost: player.isHost,
    isConnected: true,
  });

  return {
    success: true,
    playerId: player.id,
    sessionToken: newSessionToken,
    isHost: player.isHost,
    roomName: room.name,
  };
}

/**
 * Gets the authoritative room and game state.
 */
export async function getAuthoritativeState(roomCode: string, sessionToken?: string) {
  const code = roomCode.toUpperCase().trim();

  // Try Supabase
  try {
    const { data: room } = await serverSupabase
      .from('rooms')
      .select('id, room_code, name, host_player_id, status')
      .eq('room_code', code)
      .eq('is_active', true)
      .maybeSingle();

    if (room) {
      const { data: players } = await serverSupabase
        .from('players')
        .select('id, display_name, is_host, is_connected, session_token')
        .eq('room_id', room.id);

      const { data: activeRound } = await serverSupabase
        .from('game_rounds')
        .select('*')
        .eq('room_id', room.id)
        .order('round_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      let playerTicket: number[][] | null = null;
      let callingPlayer: any = null;

      if (sessionToken && players) {
        callingPlayer = players.find((p) => p.session_token === sessionToken);
        if (callingPlayer && activeRound) {
          const { data: ticketRecord } = await serverSupabase
            .from('tickets')
            .select('numbers')
            .eq('round_id', activeRound.id)
            .eq('player_id', callingPlayer.id)
            .maybeSingle();

          if (ticketRecord && Array.isArray(ticketRecord.numbers)) {
            playerTicket = ticketRecord.numbers as number[][];
          }
        }
      }

      let claims: CategoryClaim[] = [];
      if (activeRound) {
        const { data: claimsData } = await serverSupabase
          .from('winning_claims')
          .select('category, player_id, called_number_index, claimed_at, players!inner(display_name)')
          .eq('round_id', activeRound.id);

        if (claimsData) {
          claims = claimsData.map((c: any) => ({
            category: c.category as WinningCategory,
            playerId: c.player_id,
            playerName: c.players?.display_name || 'Player',
            calledNumberIndex: c.called_number_index,
            claimedAt: c.claimed_at,
          }));
        }
      }

      const playerList: PlayerInfo[] = (players || []).map((p) => ({
        id: p.id,
        displayName: p.display_name,
        isHost: p.id === room.host_player_id || p.is_host,
        isConnected: p.is_connected,
      }));

      const calledNumbers = activeRound?.called_numbers || [];
      const lastCalled = calledNumbers.length > 0 ? calledNumbers[calledNumbers.length - 1] : null;

      const state: GameState = {
        roomId: room.id,
        roomCode: room.room_code,
        roomName: room.name,
        roundId: activeRound?.id || null,
        roundNumber: activeRound?.round_number || 0,
        status: (activeRound?.status || 'waiting') as GameStatus,
        calledNumbers,
        lastCalledNumber: lastCalled,
        players: playerList,
        enabledCategories: (activeRound?.enabled_categories || ALL_WINNING_CATEGORIES) as WinningCategory[],
        claimedCategories: claims,
        autoCall: activeRound?.auto_call || false,
        autoCallInterval: activeRound?.auto_call_interval || 5,
        startedAt: activeRound?.started_at || null,
      };

      return { state, ticket: playerTicket, playerId: callingPlayer?.id };
    }
  } catch (err) {
    console.warn('Supabase state query failed, using Prisma fallback:', err);
  }

  // Fallback to Prisma
  const room = await prisma.room.findUnique({
    where: { roomCode: code },
    include: {
      players: true,
      rounds: {
        orderBy: { roundNumber: 'desc' },
        take: 1,
        include: {
          claims: { include: { player: true } },
          tickets: true,
        },
      },
    },
  });

  if (!room || !room.isActive) return null;

  const activeRound = room.rounds[0];
  const callingPlayer = sessionToken
    ? room.players.find((p) => p.sessionToken === sessionToken)
    : null;

  let playerTicket: number[][] | null = null;
  if (callingPlayer && activeRound) {
    const ticketRec = activeRound.tickets.find((t) => t.playerId === callingPlayer.id);
    if (ticketRec) {
      try {
        const flat = JSON.parse(ticketRec.numbers);
        playerTicket = flatToGrid(flat);
      } catch {}
    }
  }

  let calledNumbers: number[] = [];
  if (activeRound?.calledNumbers) {
    try {
      calledNumbers = JSON.parse(activeRound.calledNumbers);
    } catch {}
  }

  let enabledCategories: WinningCategory[] = ALL_WINNING_CATEGORIES;
  if (activeRound?.enabledCategories) {
    try {
      enabledCategories = JSON.parse(activeRound.enabledCategories);
    } catch {}
  }

  const claims: CategoryClaim[] = (activeRound?.claims || []).map((c) => ({
    category: c.category as WinningCategory,
    playerId: c.playerId,
    playerName: c.player.displayName,
    calledNumberIndex: c.calledNumberIndex,
    claimedAt: c.claimedAt.toISOString(),
  }));

  const playerList: PlayerInfo[] = room.players.map((p) => ({
    id: p.id,
    displayName: p.displayName,
    isHost: p.id === room.hostPlayerId || p.isHost,
    isConnected: p.isConnected,
  }));

  const state: GameState = {
    roomId: room.id,
    roomCode: room.roomCode,
    roomName: room.name,
    roundId: activeRound?.id || null,
    roundNumber: activeRound?.roundNumber || 0,
    status: (activeRound?.status || 'waiting') as GameStatus,
    calledNumbers,
    lastCalledNumber: calledNumbers.length ? calledNumbers[calledNumbers.length - 1] : null,
    players: playerList,
    enabledCategories,
    claimedCategories: claims,
    autoCall: activeRound?.autoCall || false,
    autoCallInterval: activeRound?.autoCallInterval || 5,
    startedAt: activeRound?.startedAt?.toISOString() || null,
  };

  return { state, ticket: playerTicket, playerId: callingPlayer?.id };
}

/**
 * Starts a new game round and assigns 3x9 tickets to all players.
 */
export async function startNewRound(
  roomCode: string,
  sessionToken: string,
  enabledCategories: WinningCategory[]
) {
  const code = roomCode.toUpperCase().trim();

  // Try Supabase
  try {
    const { data: room } = await serverSupabase
      .from('rooms')
      .select('id, room_code, host_player_id')
      .eq('room_code', code)
      .maybeSingle();

    if (room) {
      // Validate caller is host
      const { data: hostPlayer } = await serverSupabase
        .from('players')
        .select('id')
        .eq('session_token', sessionToken)
        .eq('room_id', room.id)
        .maybeSingle();

      if (!hostPlayer || hostPlayer.id !== room.host_player_id) {
        return { success: false, message: 'Only the host can start the game.' };
      }

      // Check current round
      const { data: lastRound } = await serverSupabase
        .from('game_rounds')
        .select('round_number, status')
        .eq('room_id', room.id)
        .order('round_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastRound && lastRound.status === 'in_progress') {
        return { success: false, message: 'A round is already in progress.' };
      }

      const nextRoundNumber = (lastRound?.round_number || 0) + 1;

      // Pool of 90 numbers shuffled
      const remainingPool = shuffleArray(
        Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + MIN_NUMBER)
      );

      const { data: newRound, error: roundError } = await serverSupabase
        .from('game_rounds')
        .insert({
          room_id: room.id,
          round_number: nextRoundNumber,
          status: 'in_progress',
          called_numbers: [],
          remaining_numbers: remainingPool,
          enabled_categories: enabledCategories,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (roundError || !newRound) {
        throw new Error(roundError?.message || 'Failed to create game round');
      }

      // Fetch all players to assign tickets
      const { data: players } = await serverSupabase
        .from('players')
        .select('id')
        .eq('room_id', room.id);

      if (players) {
        for (const p of players) {
          const ticketGrid = generateTicket();
          await serverSupabase.from('tickets').insert({
            round_id: newRound.id,
            player_id: p.id,
            numbers: ticketGrid,
          });
        }
      }

      await broadcastToRoom(code, 'game:state-update', { roundNumber: nextRoundNumber });

      return { success: true, roundId: newRound.id, roundNumber: nextRoundNumber };
    }
  } catch (err) {
    console.warn('Supabase start round failed, using Prisma fallback:', err);
  }

  // Fallback to Prisma
  const room = await prisma.room.findUnique({
    where: { roomCode: code },
    include: { players: true, rounds: { orderBy: { roundNumber: 'desc' }, take: 1 } },
  });

  if (!room) return { success: false, message: 'Room not found' };

  const hostPlayer = room.players.find((p) => p.sessionToken === sessionToken);
  if (!hostPlayer || hostPlayer.id !== room.hostPlayerId) {
    return { success: false, message: 'Only the host can start the game.' };
  }

  const nextRoundNumber = (room.rounds[0]?.roundNumber ?? 0) + 1;

  const dbRound = await prisma.gameRound.create({
    data: {
      roomId: room.id,
      roundNumber: nextRoundNumber,
      status: 'in_progress',
      enabledCategories: JSON.stringify(enabledCategories),
      calledNumbers: JSON.stringify([]),
      startedAt: new Date(),
    },
  });

  for (const player of room.players) {
    const ticket = generateTicket();
    await prisma.ticket.create({
      data: {
        playerId: player.id,
        roundId: dbRound.id,
        numbers: JSON.stringify(gridToFlat(ticket)),
      },
    });
  }

  await broadcastToRoom(code, 'game:state-update', { roundNumber: nextRoundNumber });

  return { success: true, roundId: dbRound.id, roundNumber: nextRoundNumber };
}

/**
 * Calls the next number in the sequence atomically.
 */
export async function callNextNumber(roomCode: string, sessionToken: string) {
  const code = roomCode.toUpperCase().trim();

  // Try Supabase RPC first
  try {
    const { data: rpcRes, error: rpcErr } = await serverSupabase.rpc(
      'rpc_call_next_number',
      {
        p_room_code: code,
        p_session_token: sessionToken,
      }
    );

    if (!rpcErr && rpcRes && rpcRes.success) {
      await broadcastToRoom(code, 'game:number-called', {
        number: rpcRes.number,
        totalCalled: rpcRes.totalCalled,
      });

      return { success: true, number: rpcRes.number, totalCalled: rpcRes.totalCalled };
    }
  } catch (err) {
    console.warn('Supabase RPC call failed, trying direct logic:', err);
  }

  // Fallback direct logic
  const room = await prisma.room.findUnique({
    where: { roomCode: code },
    include: {
      players: true,
      rounds: { where: { status: 'in_progress' }, orderBy: { roundNumber: 'desc' }, take: 1 },
    },
  });

  if (!room) return { success: false, message: 'Room not found' };

  const hostPlayer = room.players.find((p) => p.sessionToken === sessionToken);
  if (!hostPlayer || hostPlayer.id !== room.hostPlayerId) {
    return { success: false, message: 'Only the host can call numbers.' };
  }

  const round = room.rounds[0];
  if (!round) return { success: false, message: 'No round in progress' };

  let calledNumbers: number[] = [];
  try {
    calledNumbers = JSON.parse(round.calledNumbers);
  } catch {}

  const calledSet = new Set(calledNumbers);
  const remaining = [];
  for (let n = MIN_NUMBER; n <= 90; n++) {
    if (!calledSet.has(n)) remaining.push(n);
  }

  if (remaining.length === 0) {
    await prisma.gameRound.update({
      where: { id: round.id },
      data: { status: 'completed', completedAt: new Date() },
    });
    return { success: false, message: 'All 90 numbers have been called.' };
  }

  const randomIndex = Math.floor(Math.random() * remaining.length);
  const nextNum = remaining[randomIndex];
  calledNumbers.push(nextNum);

  await prisma.gameRound.update({
    where: { id: round.id },
    data: { calledNumbers: JSON.stringify(calledNumbers) },
  });

  await broadcastToRoom(code, 'game:number-called', {
    number: nextNum,
    calledNumbers,
  });

  return { success: true, number: nextNum, totalCalled: calledNumbers.length };
}

/**
 * Validates and records a winning claim for a player.
 */
export async function claimWinningPrize(
  roomCode: string,
  sessionToken: string,
  category: WinningCategory
) {
  const code = roomCode.toUpperCase().trim();

  // Load state and player ticket
  const stateData = await getAuthoritativeState(code, sessionToken);
  if (!stateData || !stateData.state || !stateData.ticket || !stateData.playerId) {
    return { success: false, message: 'Unable to verify claim. Ticket or round not found.' };
  }

  const { state, ticket, playerId } = stateData;

  if (state.status !== GameStatus.IN_PROGRESS) {
    return { success: false, message: 'Game is not currently in progress.' };
  }

  // Check if category enabled
  if (!state.enabledCategories.includes(category)) {
    return { success: false, message: 'This category is not enabled for this round.' };
  }

  // Check if already won
  const alreadyWon = state.claimedCategories.some((c) => c.category === category);
  if (alreadyWon) {
    return { success: false, message: 'This category has already been claimed by another player.' };
  }

  // Authoritative validation
  const isValid = checkWinningCategory(ticket, state.calledNumbers, category);
  if (!isValid) {
    return { success: false, message: 'Claim rejected. Required numbers have not been called yet.' };
  }

  const winIndex = getCategoryWinIndex(ticket, state.calledNumbers, category);
  const player = state.players.find((p) => p.id === playerId);
  const playerName = player?.displayName || 'Player';

  // Try Supabase RPC
  try {
    if (state.roundId) {
      const { data: claimRes } = await serverSupabase.rpc('rpc_record_winning_claim', {
        p_round_id: state.roundId,
        p_player_id: playerId,
        p_category: category,
        p_call_index: winIndex,
      });

      if (claimRes && claimRes.success) {
        const claimObj: CategoryClaim = {
          category,
          playerId,
          playerName,
          calledNumberIndex: winIndex,
          claimedAt: new Date().toISOString(),
        };

        await broadcastToRoom(code, 'game:category-won', claimObj);

        return { success: true, claim: claimObj, message: 'Winning claim verified!' };
      }
    }
  } catch (err) {
    console.warn('Supabase claim RPC error, using Prisma fallback:', err);
  }

  // Fallback Prisma insert
  if (state.roundId) {
    try {
      await prisma.winningClaim.create({
        data: {
          roundId: state.roundId,
          playerId,
          category,
          calledNumberIndex: winIndex,
          isValid: true,
        },
      });

      const claimObj: CategoryClaim = {
        category,
        playerId,
        playerName,
        calledNumberIndex: winIndex,
        claimedAt: new Date().toISOString(),
      };

      await broadcastToRoom(code, 'game:category-won', claimObj);

      return { success: true, claim: claimObj, message: 'Winning claim verified!' };
    } catch (dbErr) {
      return { success: false, message: 'Category was already claimed by another player.' };
    }
  }

  return { success: false, message: 'Could not record claim.' };
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

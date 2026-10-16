import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase } from '@/lib/supabase/server';
import prisma from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const roomCode = params.code.toUpperCase();

    // Try Supabase first
    try {
      const { data: room } = await serverSupabase
        .from('rooms')
        .select('id, room_code, name, created_at, updated_at, is_active')
        .eq('room_code', roomCode)
        .eq('is_active', true)
        .maybeSingle();

      if (room) {
        const { data: players } = await serverSupabase
          .from('players')
          .select('id, display_name, is_host, is_connected')
          .eq('room_id', room.id);

        const { data: rounds } = await serverSupabase
          .from('game_rounds')
          .select('id, round_number, status, called_numbers, started_at, completed_at')
          .eq('room_id', room.id)
          .order('round_number', { ascending: false });

        const roundIds = (rounds || []).map((r) => r.id);
        let claims: any[] = [];

        if (roundIds.length > 0) {
          const { data: claimsData } = await serverSupabase
            .from('winning_claims')
            .select('round_id, category, player_id, called_number_index, claimed_at, players!inner(display_name)')
            .in('round_id', roundIds);

          if (claimsData) claims = claimsData;
        }

        const totalNumbersCalled = (rounds || []).reduce(
          (sum, r) => sum + (Array.isArray(r.called_numbers) ? r.called_numbers.length : 0),
          0
        );

        return NextResponse.json({
          roomCode: room.room_code,
          roomName: room.name,
          totalRounds: rounds?.length || 0,
          totalPlayers: players?.length || 0,
          totalClaims: claims.length,
          totalNumbersCalled,
          createdAt: room.created_at,
          lastActivity: room.updated_at,
          players: players || [],
          roundHistory: (rounds || []).map((r) => {
            const roundClaims = claims
              .filter((c) => c.round_id === r.id)
              .map((c) => ({
                category: c.category,
                playerName: c.players?.display_name || 'Player',
                playerId: c.player_id,
                calledNumberIndex: c.called_number_index,
                claimedAt: c.claimed_at,
              }));

            const start = r.started_at ? new Date(r.started_at).getTime() : 0;
            const end = r.completed_at ? new Date(r.completed_at).getTime() : 0;
            const duration = start && end ? Math.floor((end - start) / 1000) : null;

            return {
              roundId: r.id,
              roundNumber: r.round_number,
              status: r.status,
              totalNumbersCalled: Array.isArray(r.called_numbers) ? r.called_numbers.length : 0,
              claims: roundClaims,
              startedAt: r.started_at,
              completedAt: r.completed_at,
              duration,
            };
          }),
        });
      }
    } catch (supabaseErr) {
      console.warn('Supabase stats query fallback to Prisma:', supabaseErr);
    }

    // Fallback to Prisma
    const room = await prisma.room.findUnique({
      where: { roomCode },
      include: {
        players: {
          select: {
            id: true,
            displayName: true,
            isHost: true,
            isConnected: true,
          },
        },
        rounds: {
          orderBy: { roundNumber: 'desc' },
          include: {
            claims: {
              include: {
                player: {
                  select: { displayName: true },
                },
              },
            },
          },
        },
      },
    });

    if (!room || !room.isActive) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const totalClaims = await prisma.winningClaim.count({
      where: { round: { roomId: room.id } },
    });

    const totalNumbersCalled = room.rounds.reduce((sum, r) => {
      try {
        const arr = JSON.parse(r.calledNumbers || '[]');
        return sum + (Array.isArray(arr) ? arr.length : 0);
      } catch {
        return sum;
      }
    }, 0);

    return NextResponse.json({
      roomCode: room.roomCode,
      roomName: room.name,
      totalRounds: room.rounds.length,
      totalPlayers: room.players.length,
      totalClaims,
      totalNumbersCalled,
      createdAt: room.createdAt.toISOString(),
      lastActivity: room.updatedAt.toISOString(),
      players: room.players,
      roundHistory: room.rounds.map((r) => {
        let calledLen = 0;
        try {
          const arr = JSON.parse(r.calledNumbers || '[]');
          calledLen = Array.isArray(arr) ? arr.length : 0;
        } catch {}

        return {
          roundId: r.id,
          roundNumber: r.roundNumber,
          status: r.status,
          totalNumbersCalled: calledLen,
          claims: r.claims.map((c) => ({
            category: c.category,
            playerName: c.player.displayName,
            playerId: c.playerId,
            calledNumberIndex: c.calledNumberIndex,
            claimedAt: c.claimedAt.toISOString(),
          })),
          startedAt: r.startedAt?.toISOString() ?? null,
          completedAt: r.completedAt?.toISOString() ?? null,
          duration:
            r.startedAt && r.completedAt
              ? Math.floor((r.completedAt.getTime() - r.startedAt.getTime()) / 1000)
              : null,
        };
      }),
    });
  } catch (error) {
    console.error('Error fetching room stats:', error);
    return NextResponse.json({ error: 'Failed to fetch room stats' }, { status: 500 });
  }
}

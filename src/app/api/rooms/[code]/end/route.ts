import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase } from '@/lib/supabase/server';
import prisma from '@/lib/db';
import { broadcastToRoom } from '@/lib/supabase/game-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const roomCode = params.code.toUpperCase();
    const sessionToken = request.headers.get('x-session-token');

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    // Try Supabase
    try {
      const { data: room }: any = await serverSupabase
        .from('rooms')
        .select('id, host_player_id')
        .eq('room_code', roomCode)
        .maybeSingle();

      if (room) {
        const { data: player }: any = await serverSupabase
          .from('players')
          .select('id')
          .eq('session_token', sessionToken)
          .eq('room_id', room.id)
          .maybeSingle();

        if (!player || player.id !== room.host_player_id) {
          return NextResponse.json({ error: 'Only the host can end the round.' }, { status: 403 });
        }

        const { data: activeRound }: any = await serverSupabase
          .from('game_rounds')
          .select('id, round_number')
          .eq('room_id', room.id)
          .eq('status', 'in_progress')
          .maybeSingle();

        if (activeRound) {
          await serverSupabase
            .from('game_rounds')
            .update({ status: 'completed', completed_at: new Date().toISOString() })
            .eq('id', activeRound.id);

          await broadcastToRoom(roomCode, 'game:state-update', { status: 'completed' });
          return NextResponse.json({ success: true });
        }
      }
    } catch (e) {}

    // Fallback Prisma
    const room = await prisma.room.findUnique({
      where: { roomCode },
      include: {
        players: true,
        rounds: { where: { status: 'in_progress' }, orderBy: { roundNumber: 'desc' }, take: 1 },
      },
    });

    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

    const host = room.players.find((p) => p.sessionToken === sessionToken);
    if (!host || host.id !== room.hostPlayerId) {
      return NextResponse.json({ error: 'Only the host can end the round.' }, { status: 403 });
    }

    const round = room.rounds[0];
    if (round) {
      await prisma.gameRound.update({
        where: { id: round.id },
        data: { status: 'completed', completedAt: new Date() },
      });
      await broadcastToRoom(roomCode, 'game:state-update', { status: 'completed' });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to end round.' }, { status: 500 });
  }
}

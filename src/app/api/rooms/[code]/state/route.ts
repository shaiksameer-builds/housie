import { NextRequest, NextResponse } from 'next/server';
import { getAuthoritativeState } from '@/lib/supabase/game-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const roomCode = params.code.toUpperCase();
    const sessionToken = request.headers.get('x-session-token') || undefined;

    const data = await getAuthoritativeState(roomCode, sessionToken);

    if (!data) {
      return NextResponse.json({ error: 'Room not found or inactive.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      state: data.state,
      ticket: data.ticket,
      playerId: data.playerId,
    });
  } catch (err: any) {
    console.error('Error in get room state endpoint:', err);
    return NextResponse.json({ error: 'Failed to fetch room state.' }, { status: 500 });
  }
}

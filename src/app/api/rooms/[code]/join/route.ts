import { NextRequest, NextResponse } from 'next/server';
import { joinGameRoom } from '@/lib/supabase/game-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const roomCode = params.code.toUpperCase();
    const body = await request.json();
    const { displayName, sessionToken } = body;

    if (!displayName || typeof displayName !== 'string') {
      return NextResponse.json({ error: 'Display name is required.' }, { status: 400 });
    }

    const cleanName = displayName.trim();
    if (cleanName.length < 2 || cleanName.length > 25) {
      return NextResponse.json(
        { error: 'Display name must be between 2 and 25 characters.' },
        { status: 400 }
      );
    }

    const result = await joinGameRoom(roomCode, cleanName, sessionToken);

    if (!result.success) {
      return NextResponse.json({ error: result.message || 'Failed to join room.' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      playerId: result.playerId,
      sessionToken: result.sessionToken,
      isHost: result.isHost,
      roomName: result.roomName,
    });
  } catch (err: any) {
    console.error('Error in join room endpoint:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

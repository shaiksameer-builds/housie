import { NextRequest, NextResponse } from 'next/server';
import { startNewRound } from '@/lib/supabase/game-service';
import { ALL_WINNING_CATEGORIES, WinningCategory } from '@/lib/game/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const roomCode = params.code.toUpperCase();
    const sessionToken = request.headers.get('x-session-token');

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized. Session token required.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const enabledCategories: WinningCategory[] =
      Array.isArray(body.enabledCategories) && body.enabledCategories.length > 0
        ? body.enabledCategories
        : ALL_WINNING_CATEGORIES;

    const result = await startNewRound(roomCode, sessionToken, enabledCategories);

    if (!result.success) {
      return NextResponse.json({ error: result.message || 'Failed to start game.' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      roundId: result.roundId,
      roundNumber: result.roundNumber,
    });
  } catch (err: any) {
    console.error('Error starting game round:', err);
    return NextResponse.json({ error: 'Failed to start round.' }, { status: 500 });
  }
}

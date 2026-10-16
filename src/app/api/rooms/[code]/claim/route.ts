import { NextRequest, NextResponse } from 'next/server';
import { claimWinningPrize } from '@/lib/supabase/game-service';
import { WinningCategory } from '@/lib/game/types';

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

    const body = await request.json();
    const category = body.category as WinningCategory;

    if (!category || !Object.values(WinningCategory).includes(category)) {
      return NextResponse.json({ error: 'Invalid winning category.' }, { status: 400 });
    }

    const result = await claimWinningPrize(roomCode, sessionToken, category);

    if (!result.success) {
      return NextResponse.json({ error: result.message || 'Claim rejected.' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      claim: result.claim,
      message: result.message,
    });
  } catch (err: any) {
    console.error('Error processing claim:', err);
    return NextResponse.json({ error: 'Failed to process claim.' }, { status: 500 });
  }
}

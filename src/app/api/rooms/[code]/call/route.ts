import { NextRequest, NextResponse } from 'next/server';
import { callNextNumber } from '@/lib/supabase/game-service';

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

    const result = await callNextNumber(roomCode, sessionToken);

    if (!result.success) {
      return NextResponse.json({ error: result.message || 'Unable to call number.' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      number: result.number,
      totalCalled: result.totalCalled,
    });
  } catch (err: any) {
    console.error('Error in call number endpoint:', err);
    const detail = err?.message || err?.toString() || 'Failed to call number.';
    return NextResponse.json({ error: detail }, { status: 500 });
  }
}

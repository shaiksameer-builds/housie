import { NextRequest, NextResponse } from 'next/server';
import { CreateRoomSchema } from '@/lib/validation';
import { createGameRoom } from '@/lib/supabase/game-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateRoomSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Invalid input' },
        { status: 400 }
      );
    }

    const result = await createGameRoom(parsed.data.name);

    if (!result.success) {
      return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
    }

    return NextResponse.json({
      roomCode: result.roomCode,
      roomId: result.roomId,
      name: result.roomName,
      shareLink: `/room/${result.roomCode}`,
    });
  } catch (error: any) {
    console.error('Error creating room:', error);
    const detail = error?.message ? `: ${error.message}` : '';
    return NextResponse.json(
      { error: `Failed to create room${detail}` },
      { status: 500 }
    );
  }
}

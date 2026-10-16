import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { generateRoomCode } from '@/lib/room-codes';
import { CreateRoomSchema } from '@/lib/validation';
import crypto from 'crypto';

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

    // Generate unique room code
    let roomCode = generateRoomCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.room.findUnique({
        where: { roomCode },
      });
      if (!existing) break;
      roomCode = generateRoomCode();
      attempts++;
    }

    if (attempts >= 10) {
      return NextResponse.json(
        { error: 'Failed to generate unique room code. Please try again.' },
        { status: 500 }
      );
    }

    // Create the room
    const room = await prisma.room.create({
      data: {
        roomCode,
        name: parsed.data.name,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    return NextResponse.json({
      roomCode: room.roomCode,
      roomId: room.id,
      name: room.name,
      shareLink: `/room/${room.roomCode}`,
    });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    );
  }
}

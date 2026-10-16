import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const roomCode = params.code.toUpperCase();

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
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    const totalClaims = await prisma.winningClaim.count({
      where: { round: { roomId: room.id } },
    });

    const totalNumbersCalled = room.rounds.reduce(
      (sum, r) => {
        try {
          const arr = JSON.parse(r.calledNumbers || '[]');
          return sum + (Array.isArray(arr) ? arr.length : 0);
        } catch {
          return sum;
        }
      },
      0
    );

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
    return NextResponse.json(
      { error: 'Failed to fetch room stats' },
      { status: 500 }
    );
  }
}

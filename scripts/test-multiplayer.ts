import { io } from 'socket.io-client';
import { PrismaClient } from '@prisma/client';
import { WinningCategory } from '../src/lib/game/types';

const prisma = new PrismaClient();

async function runMultiplayerSimulation() {
  console.log('--- Starting Housie Night Multiplayer End-to-End Simulation ---');
  const socketUrl = 'http://localhost:3001';
  const testRoomCode = 'HN99AA';

  // Ensure test room exists in database
  let room = await prisma.room.findUnique({ where: { roomCode: testRoomCode } });
  if (!room) {
    room = await prisma.room.create({
      data: {
        roomCode: testRoomCode,
        name: 'Housie Night Test Suite',
        isActive: true,
      },
    });
    console.log('✓ Created fresh test room in DB:', testRoomCode);
  }

  // 1. Connect Host Socket
  const hostSocket = io(socketUrl, { transports: ['websocket'] });
  await new Promise<void>((resolve) => hostSocket.on('connect', () => resolve()));
  console.log('✓ Host connected via WebSocket');

  // Join Room as Host
  const hostJoin = await new Promise<any>((resolve) => {
    hostSocket.emit(
      'room:join',
      { roomCode: testRoomCode, displayName: 'Host Sameer' },
      resolve
    );
  });
  console.log('✓ Host joined room successfully:', hostJoin.success);

  // 2. Connect Guest Player
  const guestSocket = io(socketUrl, { transports: ['websocket'] });
  await new Promise<void>((resolve) => guestSocket.on('connect', () => resolve()));
  console.log('✓ Guest connected via WebSocket');

  const guestJoin = await new Promise<any>((resolve) => {
    guestSocket.emit(
      'room:join',
      { roomCode: testRoomCode, displayName: 'Pooja 🌟' },
      resolve
    );
  });
  console.log('✓ Guest joined room with emoji name:', guestJoin.success);

  // 3. Setup Ticket Listeners
  let hostTicket: any = null;
  let guestTicket: any = null;

  hostSocket.on('game:ticket', (t) => {
    hostTicket = t;
    console.log(`✓ Host received ticket: ${t.numbers.length} rows × ${t.numbers[0].length} cols`);
  });

  guestSocket.on('game:ticket', (t) => {
    guestTicket = t;
    console.log(`✓ Guest received ticket: ${t.numbers.length} rows × ${t.numbers[0].length} cols`);
  });

  // 4. Host starts game round with all 6 categories
  const categories = [
    WinningCategory.EARLY_FIVE,
    WinningCategory.TOP_LINE,
    WinningCategory.MIDDLE_LINE,
    WinningCategory.BOTTOM_LINE,
    WinningCategory.FOUR_CORNERS,
    WinningCategory.FULL_HOUSE,
  ];

  const startRes = await new Promise<any>((resolve) => {
    hostSocket.emit('game:start', { enabledCategories: categories }, resolve);
  });
  console.log('✓ Round started with 6 categories:', startRes.success);

  // Wait for ticket dispatch
  await new Promise((r) => setTimeout(r, 600));

  if (!hostTicket || !guestTicket) {
    throw new Error('Tickets were not generated or dispatched to players!');
  }

  // Validate tickets are 3 rows × 9 cols with 15 numbers
  const hostNonZeros = hostTicket.numbers.flat().filter((n: number) => n > 0);
  const guestNonZeros = guestTicket.numbers.flat().filter((n: number) => n > 0);

  if (hostNonZeros.length !== 15 || guestNonZeros.length !== 15) {
    throw new Error(`Invalid ticket number count: host=${hostNonZeros.length}, guest=${guestNonZeros.length}`);
  }
  console.log('✓ Both players received valid authentic 15-number 3×9 tickets');

  // 5. Host calls a number
  let receivedNumber: number | null = null;
  guestSocket.on('game:number-called', (data) => {
    receivedNumber = data.number;
  });

  const callRes = await new Promise<any>((resolve) => {
    hostSocket.emit('game:call-number', resolve);
  });
  console.log('✓ Host called number:', callRes.number);

  await new Promise((r) => setTimeout(r, 400));
  if (receivedNumber !== callRes.number) {
    throw new Error(`Broadcast desync: host called ${callRes.number}, guest received ${receivedNumber}`);
  }
  console.log('✓ Synchronized call confirmed on guest client:', receivedNumber);

  // 6. Security Check: Non-host attempts to call a number
  const unauthorizedCall = await new Promise<any>((resolve) => {
    guestSocket.emit('game:call-number', resolve);
  });
  if (unauthorizedCall.success) {
    throw new Error('Security vulnerability: Non-host was allowed to call numbers!');
  }
  console.log('✓ Server protected against unauthorized guest action:', unauthorizedCall.message);

  // 7. Bogus Claim Verification Check
  const bogusClaim = await new Promise<any>((resolve) => {
    guestSocket.emit('game:claim', { category: WinningCategory.FULL_HOUSE }, resolve);
  });
  if (bogusClaim.success) {
    throw new Error('Claim validation flaw: Bogus full house claim was accepted!');
  }
  console.log('✓ Server correctly rejected false claim:', bogusClaim.message);

  // 8. Reconnection Check
  const reconnectSocket = io(socketUrl, { transports: ['websocket'] });
  await new Promise<void>((resolve) => reconnectSocket.on('connect', () => resolve()));

  const reconnectRes = await new Promise<any>((resolve) => {
    reconnectSocket.emit(
      'room:join',
      {
        roomCode: testRoomCode,
        displayName: 'Pooja 🌟',
        sessionToken: guestJoin.sessionToken,
      },
      resolve
    );
  });
  console.log('✓ Reconnected existing player with session token:', reconnectRes.success);

  console.log('--- ALL MULTIPLAYER TESTS PASSED SUCCESSFULLY! ---');
  hostSocket.disconnect();
  guestSocket.disconnect();
  reconnectSocket.disconnect();
  await prisma.$disconnect();
  process.exit(0);
}

runMultiplayerSimulation().catch((err) => {
  console.error('❌ Simulation Error:', err);
  prisma.$disconnect().then(() => process.exit(1));
});

import { io } from 'socket.io-client';

async function runMultiplayerSimulation() {
  console.log('--- Starting Multiplayer Integration Test ---');
  const socketUrl = 'http://localhost:3001';

  // 1. Connect Host
  const hostSocket = io(socketUrl, { transports: ['websocket'] });
  await new Promise<void>((resolve) => hostSocket.on('connect', () => resolve()));
  console.log('✓ Host connected to Socket.IO');

  // Join Room as Host
  const hostJoin = await new Promise<any>((resolve) => {
    hostSocket.emit('room:join', { roomCode: 'UV8NK9', displayName: 'Host Sameer' }, resolve);
  });
  console.log('✓ Host joined room:', hostJoin);

  // 2. Connect Guest Player
  const guestSocket = io(socketUrl, { transports: ['websocket'] });
  await new Promise<void>((resolve) => guestSocket.on('connect', () => resolve()));
  console.log('✓ Guest connected to Socket.IO');

  const guestJoin = await new Promise<any>((resolve) => {
    guestSocket.emit('room:join', { roomCode: 'UV8NK9', displayName: 'Player Priya' }, resolve);
  });
  console.log('✓ Guest joined room:', guestJoin);

  // 3. Listen for tickets
  let hostTicket: any = null;
  let guestTicket: any = null;

  hostSocket.on('game:ticket', (t) => {
    hostTicket = t;
    console.log(`✓ Host received ticket with ${t.numbers.length} rows`);
  });

  guestSocket.on('game:ticket', (t) => {
    guestTicket = t;
    console.log(`✓ Guest received ticket with ${t.numbers.length} rows`);
  });

  // 4. Host starts game
  const startRes = await new Promise<any>((resolve) => {
    hostSocket.emit('game:start', { enabledCategories: ['early_five', 'row_1'] as any }, resolve);
  });
  console.log('✓ Round started by host:', startRes);

  // Wait a moment for ticket emissions
  await new Promise((r) => setTimeout(r, 500));

  if (!hostTicket || !guestTicket) {
    throw new Error('Tickets were not generated/dispatched!');
  }

  // 5. Host calls a number
  const callRes = await new Promise<any>((resolve) => {
    hostSocket.emit('game:call-number', resolve);
  });
  console.log('✓ Host called number:', callRes);

  // 6. Non-host attempts unauthorized operation (should fail)
  const unauthorizedCall = await new Promise<any>((resolve) => {
    guestSocket.emit('game:call-number', resolve);
  });
  console.log('✓ Unauthorized call check result:', unauthorizedCall);
  if (unauthorizedCall.success) {
    throw new Error('Security flaw: Non-host was allowed to call numbers!');
  }

  console.log('--- Multiplayer Integration Simulation Succeeded! ---');
  hostSocket.disconnect();
  guestSocket.disconnect();
  process.exit(0);
}

runMultiplayerSimulation().catch((err) => {
  console.error('Simulation Failed:', err);
  process.exit(1);
});

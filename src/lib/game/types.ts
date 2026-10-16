// Game Types and Enums for Housie

export enum GameStatus {
  WAITING = 'waiting',
  READY = 'ready',
  IN_PROGRESS = 'in_progress',
  PAUSED = 'paused',
  COMPLETED = 'completed',
}

export enum WinningCategory {
  EARLY_FIVE = 'early_five',
  ROW_1 = 'row_1',
  ROW_2 = 'row_2',
  ROW_3 = 'row_3',
  ROW_4 = 'row_4',
  ROW_5 = 'row_5',
  ROW_6 = 'row_6',
  FULL_HOUSE = 'full_house',
}

export const WINNING_CATEGORY_LABELS: Record<WinningCategory, string> = {
  [WinningCategory.EARLY_FIVE]: 'Early Five',
  [WinningCategory.ROW_1]: 'Top Row',
  [WinningCategory.ROW_2]: 'Second Row',
  [WinningCategory.ROW_3]: 'Third Row',
  [WinningCategory.ROW_4]: 'Fourth Row',
  [WinningCategory.ROW_5]: 'Fifth Row',
  [WinningCategory.ROW_6]: 'Bottom Row',
  [WinningCategory.FULL_HOUSE]: 'Full House',
};

export const ALL_WINNING_CATEGORIES = Object.values(WinningCategory);

export const TICKET_ROWS = 6;
export const TICKET_COLS = 5;
export const TICKET_TOTAL_NUMBERS = TICKET_ROWS * TICKET_COLS; // 30
export const MIN_NUMBER = 1;
export const MAX_NUMBER = 100;
export const TOTAL_NUMBERS = MAX_NUMBER - MIN_NUMBER + 1; // 100
export const EARLY_FIVE_COUNT = 5;

export interface TicketData {
  id: string;
  numbers: number[][]; // 6x5 grid
  playerId: string;
  roundId: string;
}

export interface PlayerInfo {
  id: string;
  displayName: string;
  isHost: boolean;
  isConnected: boolean;
}

export interface GameState {
  roomId: string;
  roomCode: string;
  roomName: string;
  roundId: string | null;
  roundNumber: number;
  status: GameStatus;
  calledNumbers: number[];
  lastCalledNumber: number | null;
  players: PlayerInfo[];
  enabledCategories: WinningCategory[];
  claimedCategories: CategoryClaim[];
  autoCall: boolean;
  autoCallInterval: number;
  startedAt: string | null;
}

export interface CategoryClaim {
  category: WinningCategory;
  playerId: string;
  playerName: string;
  calledNumberIndex: number;
  claimedAt: string;
}

export interface RoundResult {
  roundId: string;
  roundNumber: number;
  totalNumbersCalled: number;
  claims: CategoryClaim[];
  players: PlayerInfo[];
  startedAt: string;
  completedAt: string;
  duration: number; // seconds
}

export interface RoomStats {
  roomCode: string;
  roomName: string;
  totalRounds: number;
  totalPlayers: number;
  totalClaims: number;
  totalNumbersCalled: number;
  createdAt: string;
  lastActivity: string;
  roundHistory: RoundResult[];
}

export interface PlayerStats {
  playerId: string;
  displayName: string;
  roundsPlayed: number;
  totalWins: number;
  winsByCategory: Partial<Record<WinningCategory, number>>;
  fullHouseWins: number;
  recentWins: CategoryClaim[];
}

export interface LeaderboardEntry {
  playerId: string;
  displayName: string;
  totalWins: number;
  fullHouseWins: number;
  roundsPlayed: number;
}

// Socket.IO Event Types
export interface ServerToClientEvents {
  'game:state': (state: GameState) => void;
  'game:number-called': (data: { number: number; calledNumbers: number[] }) => void;
  'game:claim-result': (data: { success: boolean; claim?: CategoryClaim; message: string }) => void;
  'game:category-won': (claim: CategoryClaim) => void;
  'game:round-completed': (result: RoundResult) => void;
  'game:player-joined': (player: PlayerInfo) => void;
  'game:player-left': (data: { playerId: string; displayName: string }) => void;
  'game:error': (data: { message: string }) => void;
  'room:player-list': (players: PlayerInfo[]) => void;
  'room:host-changed': (data: { newHostId: string; newHostName: string }) => void;
  'game:ticket': (ticket: TicketData) => void;
  'game:event': (data: { type: string; message: string; timestamp: string }) => void;
}

export interface ClientToServerEvents {
  'room:join': (data: { roomCode: string; displayName: string; sessionToken?: string }, callback: (response: { success: boolean; playerId?: string; sessionToken?: string; message?: string }) => void) => void;
  'game:start': (data: { enabledCategories: WinningCategory[] }, callback: (response: { success: boolean; message?: string }) => void) => void;
  'game:call-number': (callback: (response: { success: boolean; number?: number; message?: string }) => void) => void;
  'game:toggle-auto-call': (data: { enabled: boolean; interval?: number }, callback: (response: { success: boolean; message?: string }) => void) => void;
  'game:pause': (callback: (response: { success: boolean; message?: string }) => void) => void;
  'game:resume': (callback: (response: { success: boolean; message?: string }) => void) => void;
  'game:claim': (data: { category: WinningCategory }, callback: (response: { success: boolean; message: string }) => void) => void;
  'game:end-round': (callback: (response: { success: boolean; message?: string }) => void) => void;
  'game:next-round': (data: { enabledCategories: WinningCategory[] }, callback: (response: { success: boolean; message?: string }) => void) => void;
  'room:get-state': (callback: (state: GameState | null) => void) => void;
}

import { describe, it, expect } from 'vitest';
import { generateTicket, validateTicket, flatToGrid, gridToFlat } from './ticket-generator';
import { checkWinningCategory, getCategoryWinIndex } from './winning-checker';
import { WinningCategory, TICKET_ROWS, TICKET_COLS, TICKET_TOTAL_NUMBERS } from './types';

describe('Ticket Generator', () => {
  it('should generate a ticket with exactly 6 rows and 5 columns', () => {
    const ticket = generateTicket();
    expect(ticket).toHaveLength(TICKET_ROWS);
    for (const row of ticket) {
      expect(row).toHaveLength(TICKET_COLS);
    }
  });

  it('should contain exactly 30 unique numbers between 1 and 100', () => {
    const ticket = generateTicket();
    const flat = ticket.flat();
    expect(flat).toHaveLength(TICKET_TOTAL_NUMBERS);

    const set = new Set(flat);
    expect(set.size).toBe(30);

    for (const num of flat) {
      expect(num).toBeGreaterThanOrEqual(1);
      expect(num).toBeLessThanOrEqual(100);
      expect(Number.isInteger(num)).toBe(true);
    }
  });

  it('validateTicket returns valid for properly formed tickets', () => {
    const ticket = generateTicket();
    const result = validateTicket(ticket);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('validateTicket rejects tickets with wrong dimensions or duplicates', () => {
    const badTicket = [
      [1, 2, 3, 4, 5],
      [6, 7, 8, 9, 10],
      [11, 12, 13, 14, 15],
      [16, 17, 18, 19, 20],
      [21, 22, 23, 24, 25],
      [26, 27, 28, 29, 29], // Duplicate 29
    ];
    const result = validateTicket(badTicket);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('duplicate'))).toBe(true);
  });

  it('flatToGrid and gridToFlat correctly convert shapes', () => {
    const ticket = generateTicket();
    const flat = gridToFlat(ticket);
    expect(flat).toHaveLength(30);
    const restored = flatToGrid(flat);
    expect(restored).toEqual(ticket);
  });
});

describe('Winning Logic & Claims', () => {
  const dummyTicket = [
    [1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15],
    [16, 17, 18, 19, 20],
    [21, 22, 23, 24, 25],
    [26, 27, 28, 29, 30],
  ];

  it('should accurately detect Early Five', () => {
    // None called
    expect(checkWinningCategory(dummyTicket, [99, 98, 97], WinningCategory.EARLY_FIVE)).toBe(false);

    // 4 called
    expect(checkWinningCategory(dummyTicket, [1, 2, 3, 4, 99], WinningCategory.EARLY_FIVE)).toBe(false);

    // 5 called
    expect(checkWinningCategory(dummyTicket, [1, 2, 3, 4, 5], WinningCategory.EARLY_FIVE)).toBe(true);
    expect(getCategoryWinIndex(dummyTicket, [99, 1, 98, 2, 3, 4, 5], WinningCategory.EARLY_FIVE)).toBe(6);
  });

  it('should accurately detect each of the 6 individual rows', () => {
    // Row 1 (Top Row)
    expect(checkWinningCategory(dummyTicket, [1, 2, 3, 4, 5], WinningCategory.ROW_1)).toBe(true);
    expect(checkWinningCategory(dummyTicket, [1, 2, 3, 4, 6], WinningCategory.ROW_1)).toBe(false);

    // Row 3
    expect(checkWinningCategory(dummyTicket, [11, 12, 13, 14, 15], WinningCategory.ROW_3)).toBe(true);

    // Row 6 (Bottom Row)
    expect(checkWinningCategory(dummyTicket, [26, 27, 28, 29, 30], WinningCategory.ROW_6)).toBe(true);
  });

  it('should require all 30 numbers for Full House', () => {
    const first29 = dummyTicket.flat().slice(0, 29);
    expect(checkWinningCategory(dummyTicket, first29, WinningCategory.FULL_HOUSE)).toBe(false);

    const all30 = dummyTicket.flat();
    expect(checkWinningCategory(dummyTicket, all30, WinningCategory.FULL_HOUSE)).toBe(true);
  });
});

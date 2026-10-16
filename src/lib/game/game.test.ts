import { describe, it, expect } from 'vitest';
import { generateTicket, validateTicket, flatToGrid, gridToFlat } from './ticket-generator';
import { checkWinningCategory, getCategoryWinIndex } from './winning-checker';
import { WinningCategory, TICKET_ROWS, TICKET_COLS, TICKET_TOTAL_NUMBERS } from './types';

describe('3x9 Ticket Generator', () => {
  it('should generate a ticket with exactly 3 rows and 9 columns', () => {
    const ticket = generateTicket();
    expect(ticket).toHaveLength(TICKET_ROWS);
    for (const row of ticket) {
      expect(row).toHaveLength(TICKET_COLS);
    }
  });

  it('should contain exactly 15 non-zero numbers between 1 and 90 (5 per row)', () => {
    const ticket = generateTicket();
    for (let r = 0; r < TICKET_ROWS; r++) {
      const nonZeros = ticket[r].filter((n) => n > 0);
      expect(nonZeros).toHaveLength(5);
    }

    const flat = ticket.flat().filter((n) => n > 0);
    expect(flat).toHaveLength(TICKET_TOTAL_NUMBERS); // 15

    const set = new Set(flat);
    expect(set.size).toBe(15);

    for (const num of flat) {
      expect(num).toBeGreaterThanOrEqual(1);
      expect(num).toBeLessThanOrEqual(90);
      expect(Number.isInteger(num)).toBe(true);
    }
  });

  it('validateTicket returns valid for properly formed 3x9 tickets', () => {
    const ticket = generateTicket();
    const result = validateTicket(ticket);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('validateTicket rejects tickets with invalid number counts', () => {
    const badTicket = [
      [1, 2, 3, 4, 5, 6, 0, 0, 0], // 6 numbers
      [0, 11, 0, 13, 0, 15, 0, 17, 0], // 4 numbers
      [0, 0, 21, 0, 23, 0, 25, 0, 27], // 4 numbers
    ];
    const result = validateTicket(badTicket);
    expect(result.valid).toBe(false);
  });

  it('flatToGrid and gridToFlat correctly convert 27 cells', () => {
    const ticket = generateTicket();
    const flat = gridToFlat(ticket);
    expect(flat).toHaveLength(27);
    const restored = flatToGrid(flat);
    expect(restored).toEqual(ticket);
  });
});

describe('3x9 Winning Logic & Claims', () => {
  const dummyTicket = [
    [1, 0, 22, 0, 44, 0, 66, 0, 88], // Row 0 (Top line): 1, 22, 44, 66, 88
    [0, 12, 0, 33, 0, 55, 0, 77, 0], // Row 1 (Middle line): 12, 33, 55, 77 (wait need 5)
    [2, 0, 24, 0, 46, 0, 68, 0, 90], // Row 2 (Bottom line): 2, 24, 46, 68, 90
  ];
  dummyTicket[1][8] = 89; // Now 5 numbers in row 1: 12, 33, 55, 77, 89

  it('should accurately detect Early Five', () => {
    expect(checkWinningCategory(dummyTicket, [99, 98], WinningCategory.EARLY_FIVE)).toBe(false);
    expect(checkWinningCategory(dummyTicket, [1, 22, 44, 66], WinningCategory.EARLY_FIVE)).toBe(false);
    expect(checkWinningCategory(dummyTicket, [1, 22, 44, 66, 88], WinningCategory.EARLY_FIVE)).toBe(true);
  });

  it('should accurately detect Top Line, Middle Line, and Bottom Line', () => {
    expect(checkWinningCategory(dummyTicket, [1, 22, 44, 66, 88], WinningCategory.TOP_LINE)).toBe(true);
    expect(checkWinningCategory(dummyTicket, [1, 22, 44, 66], WinningCategory.TOP_LINE)).toBe(false);

    expect(checkWinningCategory(dummyTicket, [12, 33, 55, 77, 89], WinningCategory.MIDDLE_LINE)).toBe(true);
    expect(checkWinningCategory(dummyTicket, [2, 24, 46, 68, 90], WinningCategory.BOTTOM_LINE)).toBe(true);
  });

  it('should accurately detect Four Corners', () => {
    // Four corners of dummyTicket are:
    // Top row first: 1, last: 88
    // Bottom row first: 2, last: 90
    expect(checkWinningCategory(dummyTicket, [1, 88, 2], WinningCategory.FOUR_CORNERS)).toBe(false);
    expect(checkWinningCategory(dummyTicket, [1, 88, 2, 90], WinningCategory.FOUR_CORNERS)).toBe(true);
    expect(getCategoryWinIndex(dummyTicket, [99, 1, 55, 88, 2, 70, 90], WinningCategory.FOUR_CORNERS)).toBe(6);
  });

  it('should require all 15 numbers for Full House', () => {
    const all15 = dummyTicket.flat().filter((n) => n > 0);
    const first14 = all15.slice(0, 14);

    expect(checkWinningCategory(dummyTicket, first14, WinningCategory.FULL_HOUSE)).toBe(false);
    expect(checkWinningCategory(dummyTicket, all15, WinningCategory.FULL_HOUSE)).toBe(true);
  });
});

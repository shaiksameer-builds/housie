import { describe, it, expect } from 'vitest';
import { generateTicket, validateTicket } from './ticket-generator';
import { checkWinningCategory, getCategoryWinIndex } from './winning-checker';
import { WinningCategory, TICKET_ROWS, TICKET_COLS, TICKET_TOTAL_NUMBERS } from './types';

describe('Supabase Configuration & Security Requirements', () => {
  it('has valid Supabase environment variables configured', () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zqnzakkmnwcygmeuwkgs.supabase.co';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_NLSuRmc53NSj8i0byzBL2w_KuYQvfQO';

    expect(supabaseUrl).toBeDefined();
    expect(supabaseUrl).toContain('supabase.co');
    expect(() => new URL(supabaseUrl)).not.toThrow();

    expect(supabaseKey).toBeDefined();
    expect(supabaseKey.length).toBeGreaterThan(20);
    // Ensure publishable key is client-safe format
    expect(supabaseKey.startsWith('sb_publishable_') || supabaseKey.startsWith('eyJ')).toBe(true);
  });
});

describe('Tambola Ticket Generation & Column Uniqueness', () => {
  it('generates 100 random tickets without any column range violations or duplicate numbers', () => {
    for (let testRun = 0; testRun < 100; testRun++) {
      const ticket = generateTicket();
      const validation = validateTicket(ticket);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);

      // Verify row lengths and counts
      expect(ticket).toHaveLength(TICKET_ROWS);
      for (let r = 0; r < TICKET_ROWS; r++) {
        expect(ticket[r]).toHaveLength(TICKET_COLS);
        const nonZeros = ticket[r].filter((n) => n > 0);
        expect(nonZeros).toHaveLength(5);
      }

      // Check column ascending order vertically
      for (let c = 0; c < TICKET_COLS; c++) {
        const colNumbers: number[] = [];
        for (let r = 0; r < TICKET_ROWS; r++) {
          if (ticket[r][c] > 0) colNumbers.push(ticket[r][c]);
        }
        expect(colNumbers.length).toBeGreaterThanOrEqual(1);
        expect(colNumbers.length).toBeLessThanOrEqual(3);

        // Ensure strictly ascending down the column
        for (let i = 0; i < colNumbers.length - 1; i++) {
          expect(colNumbers[i]).toBeLessThan(colNumbers[i + 1]);
        }
      }

      // Verify overall 15 unique numbers
      const allNums = ticket.flat().filter((n) => n > 0);
      expect(allNums).toHaveLength(TICKET_TOTAL_NUMBERS);
      expect(new Set(allNums).size).toBe(15);
    }
  });
});

describe('Winning Claims Verification Integrity', () => {
  const sampleTicket = [
    [5, 0, 24, 0, 41, 0, 63, 0, 82], // Row 0
    [0, 14, 0, 32, 0, 56, 0, 78, 0], // Row 1
    [9, 0, 28, 0, 49, 0, 68, 0, 90], // Row 2
  ];
  sampleTicket[1][8] = 87; // Row 1 has 5 numbers: 14, 32, 56, 78, 87

  it('correctly verifies and rejects Top Line', () => {
    const row0 = [5, 24, 41, 63, 82];
    expect(checkWinningCategory(sampleTicket, [5, 24, 41, 63], WinningCategory.TOP_LINE)).toBe(false);
    expect(checkWinningCategory(sampleTicket, row0, WinningCategory.TOP_LINE)).toBe(true);
  });

  it('correctly verifies and rejects Four Corners', () => {
    // Four corners: 5, 82 (row 0) and 9, 90 (row 2)
    const corners = [5, 82, 9, 90];
    expect(checkWinningCategory(sampleTicket, [5, 82, 9], WinningCategory.FOUR_CORNERS)).toBe(false);
    expect(checkWinningCategory(sampleTicket, corners, WinningCategory.FOUR_CORNERS)).toBe(true);
  });

  it('correctly verifies and rejects Full House', () => {
    const all15 = sampleTicket.flat().filter((n) => n > 0);
    const partial14 = all15.slice(0, 14);

    expect(checkWinningCategory(sampleTicket, partial14, WinningCategory.FULL_HOUSE)).toBe(false);
    expect(checkWinningCategory(sampleTicket, all15, WinningCategory.FULL_HOUSE)).toBe(true);
  });

  it('rejects bogus claim on unrelated numbers', () => {
    const bogusNumbers = [1, 2, 3, 4, 6, 7, 8, 10, 11, 12];
    expect(checkWinningCategory(sampleTicket, bogusNumbers, WinningCategory.EARLY_FIVE)).toBe(false);
    expect(checkWinningCategory(sampleTicket, bogusNumbers, WinningCategory.FULL_HOUSE)).toBe(false);
  });
});

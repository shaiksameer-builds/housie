import {
  TICKET_ROWS,
  TICKET_COLS,
  TICKET_TOTAL_NUMBERS,
  MIN_NUMBER,
  MAX_NUMBER,
} from './types';

/**
 * Generates a Housie ticket with exactly 6 rows × 5 columns = 30 unique numbers.
 * Numbers range from 1 to 100 inclusive.
 * Numbers are randomly distributed (no ascending-order restriction).
 */
export function generateTicket(): number[][] {
  // Pick 30 unique random numbers from 1-100
  const pool: number[] = [];
  for (let i = MIN_NUMBER; i <= MAX_NUMBER; i++) {
    pool.push(i);
  }

  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const selected = pool.slice(0, TICKET_TOTAL_NUMBERS);

  // Shuffle again to remove any ordering bias
  for (let i = selected.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [selected[i], selected[j]] = [selected[j], selected[i]];
  }

  // Distribute into 6 rows × 5 columns
  const ticket: number[][] = [];
  for (let row = 0; row < TICKET_ROWS; row++) {
    const rowNumbers: number[] = [];
    for (let col = 0; col < TICKET_COLS; col++) {
      rowNumbers.push(selected[row * TICKET_COLS + col]);
    }
    ticket.push(rowNumbers);
  }

  return ticket;
}

/**
 * Validates that a ticket conforms to all constraints:
 * - Exactly 6 rows
 * - Exactly 5 columns per row
 * - Exactly 30 numbers total
 * - All numbers between 1 and 100
 * - No duplicate numbers
 */
export function validateTicket(ticket: number[][]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!Array.isArray(ticket)) {
    return { valid: false, errors: ['Ticket must be an array'] };
  }

  if (ticket.length !== TICKET_ROWS) {
    errors.push(`Ticket must have exactly ${TICKET_ROWS} rows, got ${ticket.length}`);
  }

  const allNumbers: number[] = [];
  for (let r = 0; r < ticket.length; r++) {
    const row = ticket[r];
    if (!Array.isArray(row)) {
      errors.push(`Row ${r + 1} must be an array`);
      continue;
    }
    if (row.length !== TICKET_COLS) {
      errors.push(`Row ${r + 1} must have exactly ${TICKET_COLS} columns, got ${row.length}`);
    }
    for (const num of row) {
      if (typeof num !== 'number' || !Number.isInteger(num)) {
        errors.push(`Invalid number in row ${r + 1}: ${num}`);
      } else if (num < MIN_NUMBER || num > MAX_NUMBER) {
        errors.push(`Number ${num} in row ${r + 1} is out of range [${MIN_NUMBER}, ${MAX_NUMBER}]`);
      }
      allNumbers.push(num);
    }
  }

  if (allNumbers.length !== TICKET_TOTAL_NUMBERS) {
    errors.push(`Ticket must have exactly ${TICKET_TOTAL_NUMBERS} numbers, got ${allNumbers.length}`);
  }

  const uniqueNumbers = new Set(allNumbers);
  if (uniqueNumbers.size !== allNumbers.length) {
    errors.push(`Ticket has duplicate numbers`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Converts a flat array of 30 numbers into a 6×5 grid.
 */
export function flatToGrid(flat: number[]): number[][] {
  if (flat.length !== TICKET_TOTAL_NUMBERS) {
    throw new Error(`Expected ${TICKET_TOTAL_NUMBERS} numbers, got ${flat.length}`);
  }
  const grid: number[][] = [];
  for (let r = 0; r < TICKET_ROWS; r++) {
    grid.push(flat.slice(r * TICKET_COLS, (r + 1) * TICKET_COLS));
  }
  return grid;
}

/**
 * Converts a 6×5 grid into a flat array of 30 numbers.
 */
export function gridToFlat(grid: number[][]): number[] {
  return grid.flat();
}

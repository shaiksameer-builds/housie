import {
  TICKET_ROWS,
  TICKET_COLS,
  NUMBERS_PER_ROW,
  TICKET_TOTAL_NUMBERS,
  MIN_NUMBER,
  MAX_NUMBER,
} from './types';

/**
 * Column number ranges for standard 3x9 Housie/Tambola tickets:
 * Col 0: 1 - 9
 * Col 1: 10 - 19
 * Col 2: 20 - 29
 * Col 3: 30 - 39
 * Col 4: 40 - 49
 * Col 5: 50 - 59
 * Col 6: 60 - 69
 * Col 7: 70 - 79
 * Col 8: 80 - 90
 */
function getColumnRange(colIndex: number): [number, number] {
  if (colIndex === 0) return [1, 9];
  if (colIndex === 8) return [80, 90];
  const start = colIndex * 10;
  return [start, start + 9];
}

/**
 * Generates a standard authentic 3 rows × 9 columns Housie ticket.
 * - Exactly 3 rows and 9 columns.
 * - Exactly 5 numbers per row (total 15 numbers).
 * - Exactly 4 empty slots (0) per row.
 * - Each column has 1, 2, or 3 numbers arranged in ascending order vertically.
 * - Numbers range from 1 to 90.
 */
export function generateTicket(): number[][] {
  let attempts = 0;
  while (attempts < 200) {
    attempts++;
    const ticket: number[][] = [
      Array(TICKET_COLS).fill(0),
      Array(TICKET_COLS).fill(0),
      Array(TICKET_COLS).fill(0),
    ];

    // Decide which column has numbers for each row
    // Each row must have exactly 5 columns chosen
    // Every column must have at least 1 number across the 3 rows
    // Total numbers must be 15
    const rowCounts = [0, 0, 0];
    const colCounts = Array(TICKET_COLS).fill(0);

    // Step 1: Assign at least 1 number to each of the 9 columns
    const cols = Array.from({ length: 9 }, (_, i) => i);
    shuffle(cols);

    // Distribute 9 items across 3 rows (3 items each initially)
    for (let i = 0; i < 9; i++) {
      const r = i % 3;
      const c = cols[i];
      ticket[r][c] = -1; // placeholder
      rowCounts[r]++;
      colCounts[c]++;
    }

    // Step 2: Need 6 more items to make 15 (2 more per row: each row needs 5 total)
    let validLayout = true;
    for (let r = 0; r < 3; r++) {
      const availableCols = Array.from({ length: 9 }, (_, i) => i).filter(
        (c) => ticket[r][c] === 0 && colCounts[c] < 3
      );
      shuffle(availableCols);

      const needed = NUMBERS_PER_ROW - rowCounts[r];
      if (availableCols.length < needed) {
        validLayout = false;
        break;
      }

      for (let k = 0; k < needed; k++) {
        const c = availableCols[k];
        ticket[r][c] = -1;
        rowCounts[r]++;
        colCounts[c]++;
      }
    }

    if (!validLayout) continue;

    // Step 3: Fill actual numbers in each column according to range and ascending order
    for (let c = 0; c < 9; c++) {
      const [min, max] = getColumnRange(c);
      const rowsWithNumber = [0, 1, 2].filter((r) => ticket[r][c] === -1);
      const count = rowsWithNumber.length;

      // Pick `count` unique random numbers in [min, max]
      const pool: number[] = [];
      for (let n = min; n <= max; n++) pool.push(n);
      shuffle(pool);
      const picked = pool.slice(0, count).sort((a, b) => a - b);

      for (let idx = 0; idx < rowsWithNumber.length; idx++) {
        ticket[rowsWithNumber[idx]][c] = picked[idx];
      }
    }

    return ticket;
  }

  // Fallback simple 3x9 generator if layout iteration exceeded
  return generateSimpleTicket();
}

function generateSimpleTicket(): number[][] {
  while (true) {
    const layout = [Array(9).fill(false), Array(9).fill(false), Array(9).fill(false)];
    for (let r = 0; r < 3; r++) {
      const cols = Array.from({ length: 9 }, (_, i) => i);
      shuffle(cols);
      for (let i = 0; i < 5; i++) {
        layout[r][cols[i]] = true;
      }
    }
    // Check every column has at least 1 number (standard Tambola rule)
    const colCounts = Array(9).fill(0);
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 9; c++) {
        if (layout[r][c]) colCounts[c]++;
      }
    }
    if (colCounts.some((cnt) => cnt === 0)) continue;

    const ticket = [Array(9).fill(0), Array(9).fill(0), Array(9).fill(0)];
    for (let c = 0; c < 9; c++) {
      const [min, max] = getColumnRange(c);
      const rowsWithNum = [0, 1, 2].filter((r) => layout[r][c]);
      const pool: number[] = [];
      for (let n = min; n <= max; n++) pool.push(n);
      shuffle(pool);
      const picked = pool.slice(0, rowsWithNum.length).sort((a, b) => a - b);
      for (let i = 0; i < rowsWithNum.length; i++) {
        ticket[rowsWithNum[i]][c] = picked[i];
      }
    }
    return ticket;
  }
}

function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/**
 * Validates a 3x9 ticket:
 * - Exactly 3 rows and 9 columns
 * - Exactly 5 non-zero numbers per row (15 numbers total)
 * - All numbers between 1 and 90 (or 0 for blank)
 * - No duplicate non-zero numbers
 */
export function validateTicket(ticket: number[][]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!Array.isArray(ticket) || ticket.length !== TICKET_ROWS) {
    return { valid: false, errors: [`Ticket must have exactly ${TICKET_ROWS} rows`] };
  }

  const allNumbers: number[] = [];

  for (let r = 0; r < ticket.length; r++) {
    const row = ticket[r];
    if (!Array.isArray(row) || row.length !== TICKET_COLS) {
      errors.push(`Row ${r + 1} must have exactly ${TICKET_COLS} columns`);
      continue;
    }

    const nonZeros = row.filter((n) => n > 0);
    if (nonZeros.length !== NUMBERS_PER_ROW) {
      errors.push(`Row ${r + 1} must have exactly ${NUMBERS_PER_ROW} numbers, got ${nonZeros.length}`);
    }

    for (const n of nonZeros) {
      if (!Number.isInteger(n) || n < MIN_NUMBER || n > MAX_NUMBER) {
        errors.push(`Number ${n} in row ${r + 1} out of range [${MIN_NUMBER}, ${MAX_NUMBER}]`);
      }
      allNumbers.push(n);
    }
  }

  if (allNumbers.length !== TICKET_TOTAL_NUMBERS) {
    errors.push(`Expected total ${TICKET_TOTAL_NUMBERS} numbers, got ${allNumbers.length}`);
  }

  const unique = new Set(allNumbers);
  if (unique.size !== allNumbers.length) {
    errors.push('Ticket contains duplicate numbers');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Converts a flat array of 27 cells (3x9) into a 3×9 grid.
 */
export function flatToGrid(flat: number[]): number[][] {
  if (flat.length !== TICKET_ROWS * TICKET_COLS) {
    throw new Error(`Expected ${TICKET_ROWS * TICKET_COLS} cells, got ${flat.length}`);
  }
  const grid: number[][] = [];
  for (let r = 0; r < TICKET_ROWS; r++) {
    grid.push(flat.slice(r * TICKET_COLS, (r + 1) * TICKET_COLS));
  }
  return grid;
}

/**
 * Converts a 3×9 grid into a flat array of 27 cells.
 */
export function gridToFlat(grid: number[][]): number[] {
  return grid.flat();
}

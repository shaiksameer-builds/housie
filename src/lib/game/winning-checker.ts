import {
  WinningCategory,
  TICKET_ROWS,
  TICKET_COLS,
  EARLY_FIVE_COUNT,
} from './types';

/**
 * Checks if a specific winning category has been achieved on a ticket
 * given the set of called numbers.
 *
 * @param ticket - 6×5 grid of ticket numbers
 * @param calledNumbers - ordered array of called numbers
 * @param category - the winning category to check
 * @returns true if the category is won
 */
export function checkWinningCategory(
  ticket: number[][],
  calledNumbers: number[],
  category: WinningCategory
): boolean {
  const calledSet = new Set(calledNumbers);

  switch (category) {
    case WinningCategory.EARLY_FIVE:
      return checkEarlyFive(ticket, calledNumbers);
    case WinningCategory.ROW_1:
      return checkRow(ticket, 0, calledSet);
    case WinningCategory.ROW_2:
      return checkRow(ticket, 1, calledSet);
    case WinningCategory.ROW_3:
      return checkRow(ticket, 2, calledSet);
    case WinningCategory.ROW_4:
      return checkRow(ticket, 3, calledSet);
    case WinningCategory.ROW_5:
      return checkRow(ticket, 4, calledSet);
    case WinningCategory.ROW_6:
      return checkRow(ticket, 5, calledSet);
    case WinningCategory.FULL_HOUSE:
      return checkFullHouse(ticket, calledSet);
    default:
      return false;
  }
}

/**
 * Checks if all numbers in a specific row have been called.
 */
function checkRow(ticket: number[][], rowIndex: number, calledSet: Set<number>): boolean {
  if (rowIndex < 0 || rowIndex >= TICKET_ROWS) return false;
  const row = ticket[rowIndex];
  return row.every((num) => calledSet.has(num));
}

/**
 * Checks if at least EARLY_FIVE_COUNT numbers on the ticket have been called.
 * The "winning point" is when the 5th distinct ticket number is called.
 */
function checkEarlyFive(ticket: number[][], calledNumbers: number[]): boolean {
  const ticketNumbers = new Set(ticket.flat());
  let count = 0;
  for (const num of calledNumbers) {
    if (ticketNumbers.has(num)) {
      count++;
      if (count >= EARLY_FIVE_COUNT) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Checks if all 30 numbers on the ticket have been called.
 */
function checkFullHouse(ticket: number[][], calledSet: Set<number>): boolean {
  const allNumbers = ticket.flat();
  return allNumbers.every((num) => calledSet.has(num));
}

/**
 * Gets the call index at which a category was first achievable.
 * Returns -1 if the category hasn't been achieved yet.
 */
export function getCategoryWinIndex(
  ticket: number[][],
  calledNumbers: number[],
  category: WinningCategory
): number {
  const ticketNumbers = ticket.flat();
  const ticketSet = new Set(ticketNumbers);

  switch (category) {
    case WinningCategory.EARLY_FIVE: {
      let count = 0;
      for (let i = 0; i < calledNumbers.length; i++) {
        if (ticketSet.has(calledNumbers[i])) {
          count++;
          if (count >= EARLY_FIVE_COUNT) return i;
        }
      }
      return -1;
    }

    case WinningCategory.ROW_1:
    case WinningCategory.ROW_2:
    case WinningCategory.ROW_3:
    case WinningCategory.ROW_4:
    case WinningCategory.ROW_5:
    case WinningCategory.ROW_6: {
      const rowIdx = getRowIndex(category);
      if (rowIdx < 0) return -1;
      const rowNumbers = new Set(ticket[rowIdx]);
      const remaining = new Set(rowNumbers);
      for (let i = 0; i < calledNumbers.length; i++) {
        remaining.delete(calledNumbers[i]);
        if (remaining.size === 0) return i;
      }
      return -1;
    }

    case WinningCategory.FULL_HOUSE: {
      const remaining = new Set(ticketNumbers);
      for (let i = 0; i < calledNumbers.length; i++) {
        remaining.delete(calledNumbers[i]);
        if (remaining.size === 0) return i;
      }
      return -1;
    }

    default:
      return -1;
  }
}

function getRowIndex(category: WinningCategory): number {
  const map: Record<string, number> = {
    [WinningCategory.ROW_1]: 0,
    [WinningCategory.ROW_2]: 1,
    [WinningCategory.ROW_3]: 2,
    [WinningCategory.ROW_4]: 3,
    [WinningCategory.ROW_5]: 4,
    [WinningCategory.ROW_6]: 5,
  };
  return map[category] ?? -1;
}

/**
 * Returns all categories that are currently achievable for a ticket.
 */
export function getAchievedCategories(
  ticket: number[][],
  calledNumbers: number[],
  enabledCategories: WinningCategory[]
): WinningCategory[] {
  return enabledCategories.filter((cat) =>
    checkWinningCategory(ticket, calledNumbers, cat)
  );
}

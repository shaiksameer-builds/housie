import {
  WinningCategory,
  TICKET_ROWS,
  TICKET_COLS,
  EARLY_FIVE_COUNT,
} from './types';

/**
 * Checks if a specific winning category has been achieved on a 3x9 ticket
 * given the set of called numbers.
 *
 * @param ticket - 3×9 grid of ticket numbers (0 denotes blank space)
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
    case WinningCategory.TOP_LINE:
      return checkRow(ticket, 0, calledSet);
    case WinningCategory.MIDDLE_LINE:
      return checkRow(ticket, 1, calledSet);
    case WinningCategory.BOTTOM_LINE:
      return checkRow(ticket, 2, calledSet);
    case WinningCategory.FULL_HOUSE:
      return checkFullHouse(ticket, calledSet);
    default:
      return false;
  }
}

/**
 * Checks if all numbers (>0) in a specific row have been called.
 */
function checkRow(ticket: number[][], rowIndex: number, calledSet: Set<number>): boolean {
  if (rowIndex < 0 || rowIndex >= TICKET_ROWS) return false;
  const row = ticket[rowIndex].filter((num) => num > 0);
  return row.length > 0 && row.every((num) => calledSet.has(num));
}

/**
 * Checks if at least EARLY_FIVE_COUNT numbers on the ticket have been called.
 */
function checkEarlyFive(ticket: number[][], calledNumbers: number[]): boolean {
  const ticketNumbers = new Set(ticket.flat().filter((num) => num > 0));
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
 * Checks if all non-zero numbers on the ticket have been called.
 */
function checkFullHouse(ticket: number[][], calledSet: Set<number>): boolean {
  const allNumbers = ticket.flat().filter((num) => num > 0);
  return allNumbers.length > 0 && allNumbers.every((num) => calledSet.has(num));
}

/**
 * Gets the call index at which a category was first achievable.
 */
export function getCategoryWinIndex(
  ticket: number[][],
  calledNumbers: number[],
  category: WinningCategory
): number {
  const ticketNumbers = ticket.flat().filter((n) => n > 0);
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

    case WinningCategory.TOP_LINE:
    case WinningCategory.MIDDLE_LINE:
    case WinningCategory.BOTTOM_LINE: {
      const rowIdx = getRowIndex(category);
      if (rowIdx < 0) return -1;
      const rowNumbers = ticket[rowIdx].filter((n) => n > 0);
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
    [WinningCategory.TOP_LINE]: 0,
    [WinningCategory.MIDDLE_LINE]: 1,
    [WinningCategory.BOTTOM_LINE]: 2,
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

/**
 * Largest-Remainder Rounding Algorithm (Hare-Niemeyer / Hamilton Method)
 *
 * Deterministically rounds shares of a whole such that the resulting integer
 * percentages sum to exactly 100% (or the specified target sum).
 *
 * Guarantees:
 * 1. Output percentages sum exactly to targetTotal (default: 100).
 * 2. Completely deterministic: tie-breaking is resolved strictly by:
 *    - higher remainder descending
 *    - higher original bytes descending
 *    - language name ascending (alphabetical)
 * 3. Pure function: no side effects, no system clock access.
 */

export interface RoundingInput {
  language: string;
  bytes: number;
}

export interface RoundedItem<T extends RoundingInput> {
  item: T;
  percentage: number;
  rawPercentage: number;
}

/**
 * Distributes percentage shares across items using the largest-remainder method.
 *
 * @param items List of items with language name and byte counts
 * @param targetTotal Target total sum (default: 100)
 * @returns Array of items enriched with exact integer percentage and raw floating-point percentage
 */
export function distributePercentages<T extends RoundingInput>(
  items: T[],
  targetTotal = 100
): Array<T & { percentage: number; rawPercentage: number }> {
  if (items.length === 0) {
    return [];
  }

  const totalBytes = items.reduce((sum, item) => sum + Math.max(0, item.bytes), 0);

  // If total code bytes is 0, return all items with 0%
  if (totalBytes === 0) {
    return items.map((item) => ({
      ...item,
      percentage: 0,
      rawPercentage: 0,
    }));
  }

  // Calculate raw percentages, floor values, and remainders
  interface Candidate {
    index: number;
    item: T;
    rawPercentage: number;
    floor: number;
    remainder: number;
    assignedPercentage: number;
  }

  const candidates: Candidate[] = items.map((item, index) => {
    const validBytes = Math.max(0, item.bytes);
    const rawPercentage = (validBytes / totalBytes) * targetTotal;
    const floor = Math.floor(rawPercentage);
    const remainder = rawPercentage - floor;

    return {
      index,
      item,
      rawPercentage,
      floor,
      remainder,
      assignedPercentage: floor,
    };
  });

  const sumOfFloors = candidates.reduce((sum, c) => sum + c.floor, 0);
  const remainingUnits = targetTotal - sumOfFloors;

  if (remainingUnits > 0) {
    // Sort candidates to determine who receives the extra remainder units
    // Tie-break hierarchy:
    // 1. Largest remainder descending
    // 2. Largest original bytes descending
    // 3. Alphabetical language name ascending
    const sortedForDistribution = [...candidates].sort((a, b) => {
      // 1. Remainder diff (with floating-point tolerance check)
      const remainderDiff = b.remainder - a.remainder;
      if (Math.abs(remainderDiff) > 1e-9) {
        return remainderDiff;
      }

      // 2. Original bytes descending
      if (b.item.bytes !== a.item.bytes) {
        return b.item.bytes - a.item.bytes;
      }

      // 3. Alphabetical language name ascending (locale-independent)
      if (a.item.language < b.item.language) return -1;
      if (a.item.language > b.item.language) return 1;
      return 0;
    });

    // Distribute remaining units to top candidates
    for (let i = 0; i < remainingUnits && i < sortedForDistribution.length; i++) {
      sortedForDistribution[i].assignedPercentage += 1;
    }
  }

  // Return items with exact integer percentage and raw percentage
  return candidates.map((c) => ({
    ...c.item,
    percentage: c.assignedPercentage,
    rawPercentage: c.rawPercentage,
  }));
}

/**
 * Calculates the round-up amount for a transaction.
 * @param amount - Original transaction amount (e.g., 12.90)
 * @param unit - Rounding unit (1, 5, 10, 20, etc.)
 * @returns roundup amount to add to savings
 */
export function calculateRoundup(amount: number, unit: number): number {
  if (unit <= 0) return 0;
  const remainder = amount % unit;
  if (remainder === 0) return 0;
  return parseFloat((unit - remainder).toFixed(2));
}

/**
 * Returns the target rounded-up value.
 */
export function getTargetAmount(amount: number, unit: number): number {
  return parseFloat((amount + calculateRoundup(amount, unit)).toFixed(2));
}

import type { Transaction } from '@models/transaction.schema';

/**
 * Determines whether a transaction belongs to a statement period.
 * @param transaction - Transaction whose `createdAt` is checked.
 * @param periodStart - Inclusive start of the statement period.
 * @param periodEnd - Exclusive end of the statement period (the next period's start).
 * @returns True when the transaction's `createdAt` falls within the period.
 */
export function isInStatementPeriod(transaction: Transaction, periodStart: Date, periodEnd: Date): boolean {
  const createdAt = new Date(transaction.createdAt);

  return createdAt >= periodStart && createdAt <= periodEnd;
}

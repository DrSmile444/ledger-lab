import type { Account } from '@models/account.schema';
import type { Transaction } from '@models/transaction.schema';

/**
 * Computes the available balance: the posted balance adjusted by every pending
 * transaction on the account, since pending debits/credits affect what's truly
 * spendable before they settle.
 * @param account - Account whose posted balance anchors the computation.
 * @param transactions - Transactions to scan; only pending ones for this account affect the result.
 * @returns Available balance in the account's minor currency units.
 */
export function getAvailableBalanceMinorUnits(account: Account, transactions: Transaction[]): number {
  const pendingTotal = transactions
    .filter((transaction) => transaction.accountId === account.id && transaction.status === 'pending')
    .reduce((sum, transaction) => sum + transaction.amountMinorUnits, 0);

  return account.postedBalanceMinorUnits + pendingTotal;
}

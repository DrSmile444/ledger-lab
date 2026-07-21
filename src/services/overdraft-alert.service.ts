import type { Account } from '@models/account.schema';
import type { AlertEvaluation, AlertHistory, AlertTier } from '@models/overdraft-alert.schema';
import type { Transaction } from '@models/transaction.schema';

import { getAvailableBalanceMinorUnits } from './ledger.service';

const SUPPRESSION_WINDOW_HOURS = 24;

/**
 * Determines the alert tier for the current available balance: `overdraft`
 * when negative, `low-balance` when below threshold but non-negative,
 * otherwise no alert.
 * @param availableBalanceMinorUnits - Available balance to classify.
 * @param thresholdMinorUnits - Per-account low-balance threshold.
 * @returns The matching tier, or null if the balance is at or above threshold.
 */
function getCurrentTier(availableBalanceMinorUnits: number, thresholdMinorUnits: number): AlertTier | null {
  if (availableBalanceMinorUnits < 0) {
    return 'overdraft';
  }

  if (availableBalanceMinorUnits < thresholdMinorUnits) {
    return 'low-balance';
  }

  return null;
}

/**
 * Whether a repeat alert for the same tier should be suppressed: it's
 * suppressed only if the balance hasn't recovered since the last alert and
 * fewer than 24 hours have passed. A `lastAlertAt` at or after `now` is
 * invalid ordering (clock skew, a stale/replayed record) and must never
 * suppress — it's treated the same as "not recently alerted".
 * @param lastAlert - The account's last alert, or null if none has fired yet.
 * @param now - Current time, ISO 8601.
 * @returns True if the repeat alert should be suppressed.
 */
function isSuppressed(lastAlert: AlertHistory, now: string): boolean {
  if (!lastAlert || lastAlert.recoveredSinceLastAlert) {
    return false;
  }

  const hoursSinceLastAlert = (new Date(now).getTime() - new Date(lastAlert.lastAlertAt).getTime()) / (1000 * 60 * 60);

  return hoursSinceLastAlert >= 0 && hoursSinceLastAlert < SUPPRESSION_WINDOW_HOURS;
}

/**
 * Evaluates whether a balance alert should fire for an account right now.
 * Trigger and tiers: available balance (posted minus pending, own currency)
 * below zero is `overdraft`, below threshold but non-negative is
 * `low-balance`, otherwise no alert. A repeat alert for the same tier is
 * suppressed within a 24h window unless the balance recovered above
 * threshold and dropped again since the last alert.
 * @param account - Account to evaluate.
 * @param transactions - Transactions to consider for the available-balance calculation.
 * @param thresholdMinorUnits - Per-account low-balance threshold, in the account's currency.
 * @param now - Current time, ISO 8601.
 * @param lastAlert - The account's last alert, or null if none has fired yet.
 * @returns The alert evaluation for this account right now.
 */
export function evaluateBalanceAlert(
  account: Account,
  transactions: Transaction[],
  thresholdMinorUnits: number,
  now: string,
  lastAlert: AlertHistory,
): AlertEvaluation {
  const availableBalanceMinorUnits = getAvailableBalanceMinorUnits(account, transactions);
  const currentTier = getCurrentTier(availableBalanceMinorUnits, thresholdMinorUnits);

  if (!currentTier) {
    return { tier: null };
  }

  if (lastAlert?.tier === currentTier && isSuppressed(lastAlert, now)) {
    return { tier: null };
  }

  return { tier: currentTier };
}

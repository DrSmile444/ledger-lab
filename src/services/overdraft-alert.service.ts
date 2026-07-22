import type { Account } from '@models/account.schema';
import type { AlertTier, EvaluationResult, LastAlert } from '@models/overdraft-alert.schema';
import type { Transaction } from '@models/transaction.schema';

import { getAvailableBalanceMinorUnits } from './ledger.service';

const SUPPRESSION_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Classifies an available balance into an alert tier against a threshold.
 * @param availableBalanceMinorUnits - Available balance in the account's minor currency units.
 * @param thresholdMinorUnits - Low-balance threshold, in the same minor currency units.
 * @returns The alert tier, or null if the balance is at or above the threshold.
 */
function classifyTier(availableBalanceMinorUnits: number, thresholdMinorUnits: number): AlertTier | null {
  if (availableBalanceMinorUnits < 0) {
    return 'overdraft';
  }

  if (availableBalanceMinorUnits < thresholdMinorUnits) {
    return 'low-balance';
  }

  return null;
}

/**
 * Determines whether a same-tier alert should be suppressed under the 24-hour cooldown.
 * @param tier - Alert tier computed for the current evaluation.
 * @param now - Current evaluation time, ISO 8601.
 * @param lastAlert - The most recent alert fired for this account.
 * @returns True if the alert must be suppressed, false if it should fire.
 */
function isSuppressed(tier: AlertTier, now: string, lastAlert: LastAlert): boolean {
  if (lastAlert.tier !== tier) {
    return false;
  }

  const nowMs = new Date(now).getTime();
  const firedAtMs = new Date(lastAlert.firedAt).getTime();

  if (Number.isNaN(nowMs) || Number.isNaN(firedAtMs) || firedAtMs >= nowMs) {
    return false;
  }

  if (nowMs - firedAtMs >= SUPPRESSION_WINDOW_MS) {
    return false;
  }

  return !lastAlert.recoveredSinceLastAlert;
}

/**
 * Evaluates whether an account should receive a balance alert right now, based on its available
 * balance (posted balance adjusted by pending transactions) compared against a per-account threshold.
 * @param account - Account to evaluate; anchors the available-balance calculation.
 * @param transactions - Transactions to scan for pending amounts affecting the balance.
 * @param thresholdMinorUnits - Low-balance threshold, in the account's own currency's minor units.
 * @param now - Current evaluation time, ISO 8601.
 * @param lastAlert - The most recent alert fired for this account, if any.
 * @returns The alert tier to fire, or null if no alert should fire right now.
 */
export function evaluateBalanceAlert(
  account: Account,
  transactions: Transaction[],
  thresholdMinorUnits: number,
  now: string,
  lastAlert?: LastAlert,
): EvaluationResult {
  const availableBalanceMinorUnits = getAvailableBalanceMinorUnits(account, transactions);
  const tier = classifyTier(availableBalanceMinorUnits, thresholdMinorUnits);

  if (tier === null) {
    return null;
  }

  if (lastAlert && isSuppressed(tier, now, lastAlert)) {
    return null;
  }

  return tier;
}

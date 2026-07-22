## Requirements

### Requirement: Balance tier classification
The system SHALL classify an account's current available balance (posted balance adjusted by pending transactions, per the account's own currency) into exactly one of `overdraft`, `low-balance`, or no alert, by comparing it against a caller-supplied threshold.

#### Scenario: Negative available balance is an overdraft
- **WHEN** the account's available balance is less than zero
- **THEN** the evaluation result is the `overdraft` tier

#### Scenario: Available balance below threshold but non-negative is low-balance
- **WHEN** the account's available balance is greater than or equal to zero and strictly less than the threshold
- **THEN** the evaluation result is the `low-balance` tier

#### Scenario: Available balance at or above threshold yields no alert
- **WHEN** the account's available balance is greater than or equal to the threshold
- **THEN** the evaluation result is `null`, regardless of any prior alert history

#### Scenario: Pending transactions are factored into the trigger
- **WHEN** the account's posted balance alone would be at or above the threshold, but a pending debit brings the available balance below the threshold
- **THEN** the evaluation result reflects the tier computed from the available balance (including the pending debit), not from the posted balance alone

### Requirement: Same-tier suppression window
The system SHALL NOT repeat a same-tier alert more than once per 24 hours, unless the balance has recovered to or above the threshold and dropped again since the last alert of that tier.

#### Scenario: Same-tier alert within 24 hours without recovery is suppressed
- **WHEN** the last alert's tier matches the currently computed tier, was fired less than 24 hours before `now`, and `recoveredSinceLastAlert` is `false`
- **THEN** the evaluation result is `null`

#### Scenario: Same-tier alert 24 hours or more after the last one fires again
- **WHEN** the last alert's tier matches the currently computed tier and was fired 24 hours or more before `now`
- **THEN** the evaluation result is the currently computed tier

#### Scenario: Recovery since the last alert lifts suppression within the window
- **WHEN** the last alert's tier matches the currently computed tier, was fired less than 24 hours before `now`, and `recoveredSinceLastAlert` is `true`
- **THEN** the evaluation result is the currently computed tier

### Requirement: Tier changes are never suppressed
The system SHALL fire an alert whenever the currently computed tier differs from the last alert's tier, regardless of how recently the last alert fired.

#### Scenario: Escalation from low-balance to overdraft always fires
- **WHEN** the last alert's tier was `low-balance`, fired moments before `now`, and the currently computed tier is `overdraft`
- **THEN** the evaluation result is `overdraft`

#### Scenario: De-escalation from overdraft to low-balance always fires
- **WHEN** the last alert's tier was `overdraft`, fired moments before `now`, and the currently computed tier is `low-balance`
- **THEN** the evaluation result is `low-balance`

### Requirement: Invalid last-alert ordering does not suppress
The system SHALL treat a last-alert timestamp that is at or after the current evaluation time, or that fails to parse, as invalid and SHALL NOT let it suppress an otherwise-due alert.

#### Scenario: Last-alert timestamp equal to now fires anyway
- **WHEN** the last alert's tier matches the currently computed tier and its `firedAt` equals `now`
- **THEN** the evaluation result is the currently computed tier

#### Scenario: Last-alert timestamp after now fires anyway
- **WHEN** the last alert's tier matches the currently computed tier and its `firedAt` is after `now`
- **THEN** the evaluation result is the currently computed tier

#### Scenario: Unparseable last-alert timestamp fires anyway
- **WHEN** the last alert's tier matches the currently computed tier and its `firedAt` is not a valid date
- **THEN** the evaluation result is the currently computed tier

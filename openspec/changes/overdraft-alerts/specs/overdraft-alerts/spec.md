## ADDED Requirements

### Requirement: Balance alert trigger
The system SHALL evaluate an account's available balance (posted balance
minus pending debits, in the account's own currency) against a per-account
threshold and return an alert severity of `overdraft`, `low-balance`, or none.

#### Scenario: Available balance is negative
- **WHEN** the account's available balance is less than zero
- **THEN** the evaluation returns severity `overdraft`

#### Scenario: Available balance is below threshold but not negative
- **WHEN** the account's available balance is greater than or equal to zero and less than the threshold
- **THEN** the evaluation returns severity `low-balance`

#### Scenario: Available balance meets or exceeds threshold
- **WHEN** the account's available balance is greater than or equal to the threshold
- **THEN** the evaluation returns no alert severity

#### Scenario: Pending transactions affect the trigger
- **WHEN** the account's posted balance is above threshold but a pending debit brings the available balance below threshold
- **THEN** the evaluation returns severity `low-balance` or `overdraft` as appropriate

### Requirement: Repeat-alert suppression
The system SHALL suppress a repeat alert for the same severity on the same
account within a 24-hour cooldown window, unless the available balance has
recovered to or above the threshold and dropped again since the last alert.
A last-alert timestamp at or after the current evaluation time SHALL be
treated as invalid and MUST NOT suppress the alert.

#### Scenario: Same severity fires again within 24 hours
- **WHEN** the same severity would fire again for the same account less than 24 hours after the last alert of that severity, with no recovery in between
- **THEN** the evaluation returns no alert severity

#### Scenario: Same severity fires again after 24 hours
- **WHEN** the same severity would fire again for the same account 24 hours or more after the last alert of that severity
- **THEN** the evaluation returns that severity

#### Scenario: Balance recovers and drops again before 24 hours pass
- **WHEN** the available balance rises to or above the threshold after the last alert and then drops below it again, even within 24 hours
- **THEN** the evaluation returns the appropriate severity (suppression does not apply)

#### Scenario: No prior alert history
- **WHEN** no prior alert has been recorded for the account
- **THEN** suppression does not apply and the evaluation returns the appropriate severity

#### Scenario: Severity escalates from low-balance to overdraft
- **WHEN** the last alert was `low-balance` and the current evaluation's severity is `overdraft`, even within the 24h cooldown
- **THEN** suppression does not apply and the evaluation returns `overdraft`

#### Scenario: Last-alert timestamp is ahead of the current evaluation time
- **WHEN** the recorded last-alert timestamp is at or after the current evaluation time
- **THEN** suppression does not apply and the evaluation returns the appropriate severity

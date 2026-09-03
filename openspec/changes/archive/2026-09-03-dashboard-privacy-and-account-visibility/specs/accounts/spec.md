# Delta for Accounts

## ADDED Requirements

(None)

## MODIFIED Requirements

### Requirement: Create Account

The system MUST allow users to create new accounts (e.g., Cash, Bank, Credit Card) and configure their visibility preferences for the dashboard.
(Previously: The system MUST allow users to create new accounts (e.g., Cash, Bank, Credit Card).)

#### Scenario: User creates a new bank account

- GIVEN the user is on the accounts page
- WHEN the user provides a valid name, type, initial balance, and visibility preferences (`include_in_dashboard_sum`, `show_in_dashboard`)
- THEN the system creates the account
- AND the account is available for transactions
- AND the account inherits the specified visibility preferences

## REMOVED Requirements

(None)

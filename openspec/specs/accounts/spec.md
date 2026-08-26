# Accounts Specification

## Purpose
Gestión de los repositorios de fondos de los usuarios.

## Requirements

### Requirement: Create Account
The system MUST allow users to create new accounts (e.g., Cash, Bank, Credit Card).

#### Scenario: User creates a new bank account
- GIVEN the user is on the accounts page
- WHEN the user provides a valid name, type, and initial balance
- THEN the system creates the account
- AND the account is available for transactions

### Requirement: View Account Details
The system SHALL allow users to view details and transaction history for a specific account.

#### Scenario: User views an existing account
- GIVEN the user has an existing account with transactions
- WHEN the user selects the account
- THEN the system displays the account's current balance
- AND lists the recent transactions associated with it

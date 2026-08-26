# Transactions Specification

## Purpose
CRUD operations for incomes, expenses, and transfers between accounts.

## Requirements

### Requirement: Record Income or Expense
The system MUST allow users to register a new transaction (income or expense) linked to a specific account.

#### Scenario: User records an expense
- GIVEN the user is on the transactions page
- WHEN the user creates an expense transaction with valid amount, category, and account
- THEN the system deducts the amount from the specified account
- AND saves the transaction record

#### Scenario: User records an income
- GIVEN the user is on the transactions page
- WHEN the user creates an income transaction with valid amount, category, and account
- THEN the system adds the amount to the specified account
- AND saves the transaction record

### Requirement: Transfer Funds
The system SHALL allow users to transfer funds between two of their own accounts.

#### Scenario: Successful transfer between accounts
- GIVEN the user has Account A and Account B
- WHEN the user initiates a transfer from Account A to Account B
- THEN the system deducts the amount from Account A
- AND adds the amount to Account B
- AND creates a transfer transaction record

#### Scenario: Transfer with insufficient funds
- GIVEN the user has Account A with $50
- WHEN the user initiates a transfer of $100 from Account A to Account B
- THEN the system MAY warn the user or allow overdraft depending on account configuration
- AND successfully processes the transfer if overdraft is permitted

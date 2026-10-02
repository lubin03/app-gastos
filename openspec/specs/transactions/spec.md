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

### Requirement: Search and Filter Transactions by Name
The system MUST allow users to filter the displayed transactions by typing a search term matching the transaction description or name.

#### Scenario: User searches with partial lowercase text
- GIVEN the user is on the Transactions page with multiple transactions loaded
- WHEN the user inputs "sup" into the search filter
- THEN the system displays only transactions whose description contains "sup" (such as "Supermercado")
- AND updates the grouped list and date group totals accordingly

#### Scenario: User searches with accent-insensitive matching
- GIVEN a transaction exists with the description "Café Martínez"
- WHEN the user types "cafe" without an accent into the search filter
- THEN the system matches and displays "Café Martínez"

#### Scenario: Clearing the search input
- GIVEN the search filter contains active search text and the list is filtered
- WHEN the user clears the search filter or clicks the clear icon
- THEN the system immediately restores the full transaction list for the currently selected date and account filters

#### Scenario: No matching transactions found
- GIVEN the user inputs a search term that does not match any transaction's description
- WHEN the search filter is applied
- THEN the system displays a friendly empty state message indicating no transactions matched the search query

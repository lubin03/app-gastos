# Delta for Transactions

## ADDED Requirements

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

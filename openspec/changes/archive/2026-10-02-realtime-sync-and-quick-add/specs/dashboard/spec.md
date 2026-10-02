# Delta for Dashboard

## ADDED Requirements

### Requirement: Quick-Add Shortcut Action
The Dashboard MUST provide an accessible quick-action button that allows users to create a transaction directly from the home view.

The button MUST adapt responsively to viewport size:
- On mobile viewports / APK (width < 768px): The button MUST float centered above the bottom tab navigation bar.
- On desktop / wide web viewports (width >= 768px): The button MUST position at the side / bottom corner.

#### Scenario: User creates an expense from the Dashboard shortcut
- GIVEN the user is on the Dashboard
- WHEN the user clicks the quick-add shortcut button
- THEN the transaction modal MUST open with default type set to expense
- AND when the user submits a valid transaction, the modal closes
- AND the Dashboard bank balance, expense totals, and account cards MUST immediately update to reflect the new expense

#### Scenario: User cancels quick-add transaction modal
- GIVEN the user opened the quick-add transaction modal on the Dashboard
- WHEN the user dismisses or cancels the modal
- THEN the modal closes without modifying any balances or sending mutations

### Requirement: Real-Time Invalidation on Dashboard
The Dashboard MUST immediately refresh its displayed account balances, credit card summaries, and overall net worth whenever data mutations occur in any part of the application.

#### Scenario: Transaction created or edited in another view
- GIVEN the user has the Dashboard open or cached in memory
- WHEN a transaction is created, updated, or deleted from another page or modal
- THEN the Dashboard MUST re-fetch and update all balances without requiring a manual page refresh

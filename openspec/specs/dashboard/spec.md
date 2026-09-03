# Dashboard Specification

## Purpose
Visualización de métricas clave, balance general y distribución de gastos para proporcionar un resumen financiero rápido al usuario.

## Requirements

### Requirement: Display Total Balance
The system MUST calculate and display the user's current total balance across all accounts that are explicitly marked to be included in the dashboard sum (`include_in_dashboard_sum = TRUE`).

#### Scenario: User views dashboard with existing accounts
- GIVEN the user has logged in and has accounts with non-zero balances
- AND some accounts are marked to be included in the dashboard sum while others are not
- WHEN the user navigates to the Dashboard
- THEN the system calculates the sum using ONLY the accounts marked for inclusion
- AND displays the total balance correctly

#### Scenario: User views dashboard with zero accounts
- GIVEN the user has logged in but has no accounts
- WHEN the user navigates to the Dashboard
- THEN the system displays a total balance of $0.00
- AND suggests adding a new account

### Requirement: Privacy Mode
The system MUST allow users to toggle the visibility of financial values on the dashboard to protect sensitive information from shoulder surfers.

#### Scenario: User enables privacy mode
- GIVEN the user is viewing the dashboard
- WHEN the user clicks the visibility toggle icon (e.g., an eye icon)
- THEN all monetary values on the dashboard MUST be obfuscated (e.g., replaced with `****`)
- AND the preference MUST persist across sessions (e.g., saved in `localStorage`)

#### Scenario: User disables privacy mode
- GIVEN the user has privacy mode enabled
- WHEN the user clicks the visibility toggle icon
- THEN all monetary values on the dashboard MUST be restored to their actual numerical values

### Requirement: Display Expense Distribution
The system SHOULD display the distribution of expenses by category for the current month.

#### Scenario: Viewing expenses for current month
- GIVEN the user has recorded expenses in multiple categories this month
- WHEN the user navigates to the Dashboard
- THEN the system groups expenses by category
- AND displays a breakdown (e.g., chart or list) of expenses

#### Scenario: No expenses for current month
- GIVEN the user has no recorded expenses this month
- WHEN the user navigates to the Dashboard
- THEN the system displays an empty state for the expense distribution

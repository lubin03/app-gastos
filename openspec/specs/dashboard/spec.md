# Dashboard Specification

## Purpose
Visualización de métricas clave, balance general y distribución de gastos para proporcionar un resumen financiero rápido al usuario.

## Requirements

### Requirement: Display Total Balance
The system MUST calculate and display the user's current total balance across all accounts.

#### Scenario: User views dashboard with existing accounts
- GIVEN the user has logged in and has accounts with non-zero balances
- WHEN the user navigates to the Dashboard
- THEN the system calculates the sum of all account balances
- AND displays the total balance correctly

#### Scenario: User views dashboard with zero accounts
- GIVEN the user has logged in but has no accounts
- WHEN the user navigates to the Dashboard
- THEN the system displays a total balance of $0.00
- AND suggests adding a new account

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

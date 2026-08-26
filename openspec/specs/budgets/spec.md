# Budgets Specification

## Purpose
Definición de límites de gasto por categoría y seguimiento.

## Requirements

### Requirement: Set Budget Limit
The system MUST allow users to set monthly spending limits for specific categories.

#### Scenario: User sets a budget for groceries
- GIVEN the user is on the budgets page
- WHEN the user sets a $500 limit for the "Groceries" category
- THEN the system saves the budget configuration for the current month

### Requirement: Budget Tracking
The system SHOULD display the progress of spending against the defined budget limits.

#### Scenario: User spends within budget
- GIVEN the user has a $500 budget for "Groceries"
- WHEN the user records a $100 expense in "Groceries"
- THEN the budget tracking shows $100 spent and $400 remaining

#### Scenario: User exceeds budget
- GIVEN the user has a $500 budget for "Groceries" and has spent $450
- WHEN the user records a $100 expense in "Groceries"
- THEN the budget tracking shows $550 spent
- AND the system visually highlights the exceeded budget state

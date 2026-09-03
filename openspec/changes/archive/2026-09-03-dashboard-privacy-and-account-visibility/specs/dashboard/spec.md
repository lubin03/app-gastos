# Delta for Dashboard

## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Display Total Balance

The system MUST calculate and display the user's current total balance across all accounts that are explicitly marked to be included in the dashboard sum (`include_in_dashboard_sum = TRUE`).
(Previously: The system MUST calculate and display the user's current total balance across all accounts.)

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

## REMOVED Requirements

(None)

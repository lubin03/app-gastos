# Delta for Accounts

## ADDED Requirements

### Requirement: Pay Credit Card by Invoice

The system MUST allow users to pay a credit card balance by targeting a specific invoice ID (`invoice_id`).

#### Scenario: User pays a specific credit card invoice
- GIVEN the user has a credit card with an open invoice
- WHEN the user initiates a payment and provides the `invoice_id`
- THEN the system marks only the transactions associated with that `invoice_id` as paid (`paid = TRUE`)
- AND the system updates the status of the specific invoice to paid
- AND transactions associated with future or different invoices remain unchanged and unpaid

## MODIFIED Requirements

### Requirement: Create Account

The system MUST allow users to create new accounts (e.g., Cash, Bank, Credit Card). When creating or updating a Credit Card account, the system MUST validate that the closing day (`closing_day`) and due day (`due_day`) are valid days of a month (between 1 and 31).
(Previously: The system allowed creating accounts without range validation on closing_day or due_day)

#### Scenario: User creates a new bank account
- GIVEN the user is on the accounts page
- WHEN the user provides a valid name, type, and initial balance
- THEN the system creates the account
- AND the account is available for transactions

#### Scenario: User creates a credit card with invalid closing day
- GIVEN the user is creating or updating a credit card account
- WHEN the user provides a `closing_day` or `due_day` outside the 1-31 range (e.g., 35)
- THEN the system MUST reject the creation or update
- AND return an error indicating invalid day parameters

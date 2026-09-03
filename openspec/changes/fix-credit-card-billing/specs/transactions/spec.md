# Delta for Transactions

## ADDED Requirements

### Requirement: Transaction Billing Period Reassignment (Pago por Adelantado)

The system MUST assign credit card transactions to a billing period (invoice) based on the account's cut-off date (`closing_day`). The system MUST allow users to change the assigned invoice of a transaction.

#### Scenario: User moves a future transaction to the current invoice to pay in advance
- GIVEN the user has a credit card transaction naturally assigned to a future invoice
- WHEN the user explicitly moves the transaction to the current invoice period
- THEN the transaction is reassigned to the current `invoice_id`
- AND when the current invoice is paid, this transaction is also marked as paid (`paid = TRUE`)

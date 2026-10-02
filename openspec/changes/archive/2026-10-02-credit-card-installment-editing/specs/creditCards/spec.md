# Delta for Credit Cards

## ADDED Requirements

### Requirement: Toggle Transaction Paid Status

The system MUST allow users to toggle the `paid` status of individual credit card transactions from the credit card detail view.

#### Scenario: Mark a pending transaction as paid

- GIVEN a credit card transaction with `paid = FALSE` in an invoice
- WHEN the user taps the status icon on that transaction
- THEN the system sets `paid = TRUE` on that transaction
- AND recalculates the invoice status based on remaining unpaid transactions

#### Scenario: Mark a paid transaction as unpaid

- GIVEN a credit card transaction with `paid = TRUE` in an invoice
- WHEN the user taps the status icon on that transaction
- THEN the system sets `paid = FALSE` on that transaction
- AND recalculates the invoice status

#### Scenario: Invoice status auto-updates

- GIVEN an invoice with 5 expense transactions
- WHEN all 5 are marked as `paid = TRUE`
- THEN the invoice status MUST be set to `'paid'`
- AND when one is toggled back to `paid = FALSE`, the invoice status MUST change to `'partial'`

### Requirement: Invoice Pending Amount Display

The system MUST display the pending (unpaid) amount per invoice period in the accordion header.

#### Scenario: Invoice with mixed paid/unpaid transactions

- GIVEN an invoice with total_amount = $16,000,000 and paid_amount = $10,000,000
- WHEN the user views the credit card invoices
- THEN the accordion header shows "Pendiente: $6,000,000"

#### Scenario: Fully paid invoice

- GIVEN an invoice where paid_amount >= total_amount
- WHEN the user views the credit card invoices
- THEN no "Pendiente" amount is shown and a "Pagado" badge is displayed

### Requirement: Edit Credit Card Transaction

The system MUST allow users to edit the amount and description of individual credit card transactions from the credit card detail view.

#### Scenario: Edit a cuota amount

- GIVEN a credit card transaction showing $500,000
- WHEN the user taps edit, changes amount to $450,000, and saves
- THEN the transaction amount is updated to $450,000
- AND the invoice totals are recalculated

#### Scenario: Edit with "apply to remaining cuotas"

- GIVEN a transaction that is cuota 3/6 with `parent_transaction_id`
- WHEN the user edits the amount and checks "Aplicar a cuotas restantes"
- THEN the system updates all sibling transactions where `installment_current > 3 AND paid = FALSE` to the new amount

### Requirement: Installment Indicator

The system MUST display installment context on credit card transactions that are part of an installment group.

#### Scenario: Transaction is part of installment group

- GIVEN a transaction with `installment_total = 6` and `installment_current = 2`
- WHEN the user views it in the credit card invoice list
- THEN a badge "Cuota 2/6" is displayed next to the description

#### Scenario: Transaction is not an installment

- GIVEN a transaction with `installment_total = 1` or NULL
- WHEN the user views it in the credit card invoice list
- THEN no installment badge is shown

## MODIFIED Requirements

### Requirement: Billing Periods Accordion View

The system MUST display credit card transactions grouped by billing periods (invoices) in an expandable accordion layout, allowing users to see all periods at a glance. Each invoice header MUST show the total amount, pending amount, and a status badge (Abierto / Parcial / Pagado).
(Previously: Header only showed total amount and status badge without pending amount or partial status)

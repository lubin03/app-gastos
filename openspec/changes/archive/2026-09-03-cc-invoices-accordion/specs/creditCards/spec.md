# Delta for Credit Cards

## ADDED Requirements

### Requirement: Billing Periods Accordion View
The system MUST display credit card transactions grouped by billing periods (invoices) in an expandable accordion layout, allowing users to see all periods at a glance.

#### Scenario: User views credit card details
- GIVEN the user selects a credit card
- WHEN the details modal opens
- THEN the system displays a list of billing periods as accordions
- AND each accordion header shows the period's month, year, total amount, and payment status (e.g., Paid, Closed, Open)
- AND clicking a period expands it to reveal its transactions

## MODIFIED Requirements
(None)

## REMOVED Requirements
(None)

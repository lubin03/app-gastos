# Proposal: Credit Cards Invoices Accordion

## Intent
Improve the visibility and navigation of credit card billing periods (invoices) and their respective transactions by replacing the current dropdown selector with an expandable accordion list.

## Motivation
Currently, users must use a hidden `<IonSelect>` dropdown to switch between billing periods. This makes it impossible to view a quick summary of past periods, their totals, and their paid status at a glance.

## Scope
- Modify the `CreditCards.tsx` frontend page.
- Replace the `<IonSelect>` and flat transaction list with an `<IonAccordionGroup>`.
- Group the transactions locally by `invoice_id` upon fetching them.
- Keep the payment modal and transaction movement logic intact.

## Approach
1. Fetch all invoices for the selected card.
2. Fetch all transactions for the selected card (`?all=true`).
3. Group the transactions by `invoice_id` in the frontend state.
4. Render an `<IonAccordionGroup>`. Each `<IonAccordion>` represents an invoice.
5. The header of the accordion displays the month/year, total amount, and a visual badge indicating status (Paid, Open, Closed).
6. The content of the accordion displays the transactions belonging to that invoice.

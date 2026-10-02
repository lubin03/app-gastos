# Exploration: Credit Card Payment Reconciliation & Installment Editing

## Current State

### How payments work today

The `payCreditCard` endpoint (`accounts.ts:209-266`):
1. Takes an `invoice_id` (or finds the latest unpaid one)
2. Marks **ALL** unpaid expense transactions on that invoice as `paid = TRUE` — all or nothing
3. Sets the invoice `status = 'paid'`
4. Creates a single expense transaction on the funding account

**Critical flaw**: If the user pays their card bill with 2 separate bank transfers on the same day (e.g., $10M + $6M), the system can only handle ONE payment per invoice. After the first "Pagar Factura", everything gets marked paid and the invoice is closed. The second payment has no way to be associated. Conversely, if only the bank transfers were registered manually as regular transactions but "Pagar Factura" was never clicked, ALL credit card transactions remain as `paid = FALSE` even though the bill was actually paid.

### What the invoice summary shows

`getCreditCardInvoices` (`creditCards.ts:63-78`) computes:
- `total_amount`: SUM of all expenses in that invoice
- `paid_amount`: SUM of expenses where `paid = TRUE`
- `transaction_count`: total transactions

The frontend shows these in the accordion header per invoice period. **But there's no "pending to pay" (`total_amount - paid_amount`) prominently displayed**, and no way to reconcile individual transactions.

### How installments work

When creating a credit card transaction with `installments > 1`:
1. Backend splits `total / N` into N separate transaction rows
2. Each has `installment_current` (1..N), `installment_total` (N), `parent_transaction_id`
3. Each goes to consecutive monthly invoices

The fields exist in the DB schema but **`getCreditCardTransactions` does NOT return them** — the response maps only: `id, amount, date, description, category_name, type, paid, invoice_id, invoice_month, invoice_year, invoice_status`.

### UI gaps in CreditCards.tsx

The credit card detail modal (`CreditCards.tsx:302-329`):
- Shows each transaction with amount and a "Siguiente" (move to next period) button
- **No edit button** — cannot modify amount, description, or paid status
- **No individual paid/unpaid toggle** 
- **No installment badge** (no way to know a transaction is cuota 2/6)
- **No "pending to pay" total** per invoice period

## Affected Areas

- `backend/src/controllers/creditCards.ts` — Enhanced transaction response, new toggle-paid endpoint, new bulk-update endpoint
- `backend/src/routes/creditCards.ts` — New routes
- `frontend/src/pages/CreditCards.tsx` — Edit UI, paid toggle, installment badges, pending total display, reconciliation flow
- `backend/src/controllers/accounts.ts` — `payCreditCard` needs awareness of partial payments

## Approaches

### 1. **Reconciliation-first** — Toggle paid + show pending total
- Add per-invoice "Pendiente: $X" clearly in the accordion header
- Add a paid/unpaid toggle per transaction (tap the circle icon)
- When toggling to paid, optionally ask "associate with a payment?" (link to an existing debit transaction)
- Add edit button for amount/description
- Pros: Solves the real-world problem directly (user paid at bank, now reconciles in the app)
- Cons: Needs a new concept of "payment association" (linking CC transactions to debit transactions)
- Effort: **Medium**

### 2. **Simple toggle + edit only** — No payment association
- Same as #1 but without linking to payment transactions
- Just toggle paid/unpaid and edit amounts
- Pros: Much simpler to build
- Cons: Loses the traceability of "which payment covered which charges"
- Effort: **Low-Medium**

### 3. **Full payment reconciliation system** — Payment records linked to invoices
- Create a `payments` table tracking each payment against an invoice
- Multiple payments per invoice supported natively
- Auto-reconcile: when total payments >= invoice total, mark all as paid
- Pros: Most robust, handles any payment pattern
- Cons: New table, migration, significant refactor of payCreditCard
- Effort: **High**

## Recommendation

**Approach 1 (Reconciliation-first)** — It directly solves what happened: the user paid with two transfers, the app doesn't reflect it, and now they need to manually mark transactions as paid and ideally link them to the payments.

The implementation can be phased:
- **Phase 1**: Toggle paid/unpaid per transaction + show pending total + edit amount → immediate value
- **Phase 2**: Installment badges + bulk update remaining cuotas → nice-to-have
- **Phase 3**: Payment association → traceability

## Risks

- Toggling individual transactions as paid while the invoice status is still 'open' creates a mixed state. The invoice `status` field needs to auto-update: if ALL transactions are paid → 'paid', if SOME → 'partial', if NONE → 'open'.
- Editing amounts on installment transactions breaks the original total — acceptable (mirrors bank behavior) but should show a visual indicator.

## Ready for Proposal

Yes — The core need is clear: toggle paid status per transaction, show pending totals, and allow amount edits. Payment association is a natural extension.

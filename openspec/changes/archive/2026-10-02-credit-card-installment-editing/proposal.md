# Proposal: Credit Card Payment Reconciliation & Installment Editing

## Intent

Allow users to manually reconcile credit card payments by toggling individual transactions as paid/unpaid, editing cuota amounts, and seeing a clear "pending to pay" total per invoice period.

## Problem

Real-world scenario: the user paid their credit card bill with TWO separate bank transfers on the same day ($10M + $6M). The current system only handles a single "Pagar Factura" action that marks ALL transactions in an invoice as paid at once. After importing or manually entering those two payments, the credit card transactions still show as "pending" because the reconciliation wasn't done through the app's "Pagar Factura" flow.

The user needs to:
1. See how much is pending per invoice period
2. Mark individual transactions as paid (since they already paid at the bank)
3. Edit cuota amounts when the bank adjusts them
4. See installment context (cuota 2/6)

## Scope

### Phase 1 (This change)
- **Toggle paid/unpaid** per individual credit card transaction
- **Show "Pendiente: $X"** per invoice period in the accordion header
- **Edit transaction** amount and description from the credit card view
- **Show installment badge** ("2/6") when `installment_total > 1`
- **Auto-update invoice status**: all paid → 'paid', some → 'partial' (new status), none → 'open'
- **Bulk update remaining cuotas** — when editing an installment, option to apply to remaining

### Out of Scope (future phases)
- Payment association (linking CC transactions to specific debit payments)
- Partial invoice payment flow via "Pagar Factura"
- Restructuring installment count

## Approach

### Backend Changes

#### 1. Enhance `getCreditCardTransactions` response
Add `installment_current`, `installment_total`, `parent_transaction_id` to the returned fields. These columns already exist in the DB.

#### 2. New endpoint: `PATCH /api/credit-cards/transactions/:txId/toggle-paid`
- Toggles `paid` field on a single transaction
- Recalculates invoice status automatically:
  - All expenses paid → invoice status = `'paid'`
  - Some expenses paid → invoice status = `'partial'`
  - No expenses paid → invoice status = `'open'`
- Returns the updated transaction + updated invoice summary

#### 3. New endpoint: `PUT /api/credit-cards/installments/:parentId/bulk-update`
- Accepts `{ amount }` 
- Updates all sibling transactions where `parent_transaction_id = parentId AND paid = FALSE`
- Returns count of updated transactions

#### 4. Enhance invoice response
Add `unpaid_amount` field (= `total_amount - paid_amount`) for easy frontend display.

### Frontend Changes

#### 1. Invoice accordion header — show pending amount
```
Octubre 2026                    $16.500.000
Pendiente: $6.500.000           [Parcial]
```

#### 2. Per-transaction toggle
- Tap the circle icon (currently just decorative) to toggle paid/unpaid
- Filled green circle = paid, empty circle = pending
- Immediately calls `PATCH toggle-paid` and refreshes

#### 3. Edit button per transaction
- Small edit icon next to amount
- Opens bottom sheet with: Amount, Description, and if it's an installment → checkbox "Aplicar a cuotas restantes"

#### 4. Installment badge
- When `installment_total > 1`, show a chip like "Cuota 2/6" next to the description

### DB Migration

Add `'partial'` as a valid invoice status value. Currently the `status` column is `VARCHAR(20)` with values 'open', 'closed', 'paid'. No migration needed — just use 'partial' as a new value.

## Affected Files

| File | Change |
|------|--------|
| `backend/src/controllers/creditCards.ts` | Add installment fields to response, new `togglePaid` + `bulkUpdateInstallments` endpoints, auto-update invoice status |
| `backend/src/routes/creditCards.ts` | Register 2 new routes |
| `frontend/src/pages/CreditCards.tsx` | Toggle UI, edit form, installment badge, pending amount display |

## Rollback Plan

All changes are additive:
- New endpoints can be removed without breaking existing functionality
- The `'partial'` status is backwards-compatible (existing code treats anything not 'paid' as unpaid)
- No destructive DB migrations

## Risks

- Mixed paid/unpaid states within an invoice could confuse the "Pagar Factura" flow — mitigate by showing "Pendiente: $X" clearly and only paying the remaining unpaid amount
- Editing installment amounts breaks the original purchase total — acceptable and expected (mirrors real bank adjustments)

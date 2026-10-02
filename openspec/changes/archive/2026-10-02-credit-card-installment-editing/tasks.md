# Tasks: Credit Card Payment Reconciliation & Installment Editing

## Phase 1: Backend — Enhanced Response & Toggle Endpoint

- [x] 1.1 In `backend/src/controllers/creditCards.ts` → `getCreditCardTransactions`: add `installment_current`, `installment_total`, `parent_transaction_id` to the response mapping (fields already exist in query `SELECT t.*`)
- [x] 1.2 In `backend/src/controllers/creditCards.ts`: create `toggleTransactionPaid` handler — toggle `paid` on a single transaction by ID, then recalculate invoice status: all paid → 'paid', some → 'partial', none → 'open'
- [x] 1.3 In `backend/src/routes/creditCards.ts`: register `PATCH /:id/transactions/:txId/toggle-paid` → `toggleTransactionPaid`

## Phase 2: Backend — Bulk Update & Invoice Enhancement

- [x] 2.1 In `backend/src/controllers/creditCards.ts`: create `bulkUpdateInstallments` handler — accept `{ amount }`, update all siblings where `parent_transaction_id = parentId AND paid = FALSE`
- [x] 2.2 In `backend/src/routes/creditCards.ts`: register `PUT /installments/:parentId/bulk-update` → `bulkUpdateInstallments`
- [x] 2.3 In `getCreditCardInvoices` response: add computed `unpaid_amount` field (`total_amount - paid_amount`)

## Phase 3: Frontend — Toggle Paid & Pending Display

- [x] 3.1 In `frontend/src/pages/CreditCards.tsx`: update invoice accordion header to show "Pendiente: $X" when `unpaid_amount > 0` and add 'Parcial' badge
- [x] 3.2 In `frontend/src/pages/CreditCards.tsx`: make the circle icon (`checkmarkCircleOutline` / `ellipseOutline`) clickable — on tap, call `PATCH toggle-paid`, refresh invoices and transactions
- [x] 3.3 In `frontend/src/pages/CreditCards.tsx`: add installment badge chip ("Cuota 2/6") next to description when `installment_total > 1`

## Phase 4: Frontend — Edit Transaction Form

- [x] 4.1 In `frontend/src/pages/CreditCards.tsx`: add edit icon button per transaction (next to the "Siguiente" button)
- [x] 4.2 In `frontend/src/pages/CreditCards.tsx`: create bottom sheet (IonModal with breakpoints) containing AmountInput for amount, IonInput for description, and IonCheckbox "Aplicar a cuotas restantes" (visible only when `installment_total > 1`)
- [x] 4.3 Wire edit form submit: if checkbox unchecked → `PUT /api/transactions/:id`; if checked → also call `PUT /credit-cards/installments/:parentId/bulk-update`
- [x] 4.4 After save, refresh invoices + transactions + cards summary

## Phase 5: Verification

- [x] 5.1 Test: toggle a single transaction paid/unpaid, verify invoice status updates to 'partial'/'paid'/'open'
- [x] 5.2 Test: edit a cuota amount with "apply to remaining" checked, verify all unpaid siblings update
- [x] 5.3 Test: verify accordion header shows correct "Pendiente" amount after toggling transactions
- [x] 5.4 Test: verify installment badge "Cuota X/N" renders correctly for installment transactions and is absent for single transactions

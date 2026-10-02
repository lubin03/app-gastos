# Tasks: Real-Time Data Sync and Home Quick-Add Action

## Phase 1: Foundation / Invalidation Bus

- [x] 1.1 Create `frontend/src/services/dataSync.ts` implementing `notifyDataSync`, `useDataSync`, domain types (`SyncDomain`), and `BroadcastChannel` multi-tab bridge.
- [x] 1.2 Modify `frontend/src/services/api.ts` to automatically infer domain from URL and invoke `notifyDataSync()` upon successful `post`, `put`, and `delete` responses.
- [x] 1.3 Add manual `notifyDataSync(['transactions', 'accounts'])` call in `frontend/src/pages/Transactions.tsx` after successful XLSX file import.

## Phase 2: Dashboard Quick-Add & Responsive Layout

- [x] 2.1 Add CSS responsive classes `.dashboard-quick-add-fab` in `frontend/src/theme/variables.css` with mobile center alignment (`bottom: 78px; left: 50%`) and desktop corner alignment (`bottom: 32px; right: 32px`).
- [x] 2.2 Update `frontend/src/pages/Dashboard.tsx` to include `TransactionModal` state, quick-add FAB trigger, and immediate data reload on modal save.
- [x] 2.3 Connect `Dashboard.tsx` to `useDataSync(['transactions', 'accounts', 'creditCards'])` to refresh balance, account lists, and cards on external mutations.

## Phase 3: View Subscriptions & Integration

- [x] 3.1 Update `frontend/src/pages/Transactions.tsx` with `useDataSync(['transactions', 'accounts'])` to refresh transaction lists in real time.
- [x] 3.2 Update `frontend/src/pages/Accounts.tsx` with `useDataSync(['accounts', 'transactions'])` to refresh account balances in real time.
- [x] 3.3 Update `frontend/src/pages/CreditCards.tsx` with `useDataSync(['creditCards', 'accounts', 'transactions'])` to refresh card balances and invoices.
- [x] 3.4 Update `frontend/src/pages/Budgets.tsx` and `frontend/src/pages/Goals.tsx` with `useDataSync` to sync budget expenditures and goal contributions.

## Phase 4: Testing & Verification

- [x] 4.1 Create `frontend/src/services/dataSync.test.ts` to unit test event dispatching, domain filtering, and unsubscription cleanup.
- [x] 4.2 Run frontend tests via `pnpm test.unit` and type-check with `pnpm build` to ensure zero compilation or lint errors.

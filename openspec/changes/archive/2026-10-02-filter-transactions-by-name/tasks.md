# Tasks: Filter Transactions by Name

## Phase 1: Utilities & Backend Support

- [x] 1.1 Create `frontend/src/utils/text.ts` with `normalizeText()` for case- and accent-insensitive matching.
- [x] 1.2 Update `backend/src/controllers/transactions.ts` in `getTransactions` to support optional `req.query.search`.

## Phase 2: Frontend UI & Search Integration

- [x] 2.1 Add `searchText` state and an `<IonSearchbar>` in `frontend/src/pages/Transactions.tsx` with glassmorphic styling.
- [x] 2.2 Wire search input to filter transactions by normalized description before rendering `<TransactionList />`.
- [x] 2.3 Add empty-state UI feedback in `TransactionList.tsx` or `Transactions.tsx` when a search yields zero matches.

## Phase 3: Verification & Edge Cases

- [x] 3.1 Verify partial match functionality (e.g. typing "mer" matches "Supermercado").
- [x] 3.2 Verify accent insensitivity (e.g. typing "cafe" matches "Café").
- [x] 3.3 Verify combined filtering (search text active simultaneously with account and date filters).
- [x] 3.4 Verify clearing the search bar restores all transactions without reloading from network.

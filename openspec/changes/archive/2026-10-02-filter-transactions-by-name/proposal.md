# Proposal: Filter Transactions by Name

## Intent

Allow users to quickly find transactions and expenses by typing partial keywords (case-insensitive substring matching) into a search filter on the Transactions page, rather than having to manually scan through long lists or know exact titles.

## Scope

### In Scope
- Add a search input (`IonSearchbar`) in `frontend/src/pages/Transactions.tsx` adhering to the app design system.
- Implement case-insensitive, accent-tolerant substring filtering over transaction descriptions.
- Add optional `search` query parameter in `GET /transactions` backend endpoint (filtered post-decryption).
- Display a dedicated empty state when no transactions match the active search query.

### Out of Scope
- SQL-level `ILIKE` or full-text indexing in PostgreSQL, since descriptions are encrypted with AES-256-GCM at rest.
- Global search across other pages (e.g., Accounts, Categories).

## Capabilities

### New Capabilities
None

### Modified Capabilities
- `transactions`: Add requirement for filtering/searching transaction records by partial description/name.

## Approach

1. **Frontend**: Add an `<IonSearchbar>` with debounce in `Transactions.tsx`. Filter the loaded transactions client-side against `t.description` (normalizing case and accents) for zero-latency search feedback.
2. **Backend**: Accept an optional `search` query parameter in `GET /transactions` (`transactions.ts`). Filter decrypted rows in-memory before returning the response.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `frontend/src/pages/Transactions.tsx` | Modified | Add search input state, UI placement, and filtered list computation |
| `backend/src/controllers/transactions.ts` | Modified | Optional `search` query param filtering decrypted descriptions |
| `openspec/specs/transactions/spec.md` | Modified | Spec delta adding partial name search requirement |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Memory overhead on large transaction arrays | Low | Date range filter bounds dataset; client-side substring search is negligible for typical volumes |
| AES-256-GCM prevents database-level SQL filtering | Medium | In-memory filtering after decryption is fast and preserves end-to-end data privacy at rest |

## Rollback Plan

Revert changes to `Transactions.tsx` and `transactions.ts` via `git checkout`. No DB migrations or schema adjustments are required.

## Dependencies

- None (uses existing Ionic React components and Express controllers).

## Success Criteria

- [ ] User can enter any partial text (e.g. "uber", "mercad") and see matching expenses immediately.
- [ ] Matching is case-insensitive and handles uppercase/lowercase uniformly.
- [ ] Clearing the search bar immediately restores the complete list for the active date/account filters.
- [ ] Appropriate empty state appears when search query has no matches.

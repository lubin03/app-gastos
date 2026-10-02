# Proposal: Real-Time Data Sync and Home Quick-Add Action

## Intent

Financial data currently lives in fragmented per-page states, requiring manual page switching or route re-entry (`useIonViewWillEnter`) to see updated balances, transactions, and credit card movements. Furthermore, the Dashboard lacks an immediate quick-action button to log expenses without navigating to the Transactions tab. We will introduce a centralized reactive sync mechanism across all views and a responsive quick-add button on the Home view.

## Scope

### In Scope
- Reactive event-driven state invalidator and sync bus (`dataSync` event emitter & `useDataSync` hook) notifying subscribers on any mutation (`POST`, `PUT`, `DELETE`).
- Automatic mutation broadcast integration inside `frontend/src/services/api.ts` and explicit triggers for external handlers (e.g. bulk import).
- Subscription integration across all key views (`Dashboard`, `Transactions`, `Accounts`, `CreditCards`, `Budgets`, `Goals`, `Reports`, `Insights`) so balances and lists refresh immediately upon changes.
- Quick-add transaction FAB button on Dashboard:
  - Mobile/APK layout: Floating centered above the bottom footer/tab-bar.
  - Web/Desktop layout: Fixed to the side/bottom-right corner.
- In-place modal trigger for `TransactionModal` (and quick receipt magic) directly on the Home view.

### Out of Scope
- WebSocket or server-sent events (SSE) backend connection (data sync is client-side state coherence across mounted views/tabs).
- Redesigning the transaction creation schema or backend API endpoints.

## Capabilities

### New Capabilities
- `realtime-data-sync`: Client-side reactive event bus and hooks for instantaneous cross-page cache invalidation and state synchronization upon data mutations.

### Modified Capabilities
- `dashboard`: Add responsive quick-add transaction shortcut and immediate synchronization with active financial changes.

## Approach
1. Implement a lightweight broadcast/subscription utility (`frontend/src/services/dataSync.ts` + `useDataSync` hook) leveraging standard EventTarget and cross-tab `BroadcastChannel`.
2. Wrap `api.ts` mutating methods (`post`, `put`, `delete`) to automatically dispatch domain-specific invalidation events (`transactions`, `accounts`, `creditCards`, `budgets`, `goals`).
3. Connect views via `useDataSync` to trigger data refetches without requiring tab re-mounting.
4. Mount `TransactionModal` with a responsive Ionic FAB on `Dashboard.tsx`, with CSS media queries toggling center positioning on mobile viewports and corner positioning on desktop.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `frontend/src/services/dataSync.ts` | New | Event bus and subscription helpers |
| `frontend/src/services/api.ts` | Modified | Auto-broadcast mutation events |
| `frontend/src/pages/Dashboard.tsx` | Modified | Add quick-add FAB and dataSync listener |
| `frontend/src/theme/variables.css` | Modified | Responsive styling for home quick-add action |
| `frontend/src/pages/*` | Modified | Subscribe pages to dataSync invalidations |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Infinite re-fetch loops | Low | Only dispatch events on mutations (`POST`/`PUT`/`DELETE`), never on queries (`GET`) |
| Redundant API calls on simultaneous tabs | Low | Debounce event listener callbacks |

## Rollback Plan
Revert changes using `git checkout` on `frontend/src/` to restore previous per-page isolated fetching logic.

## Dependencies
- None.

## Success Criteria
- [ ] Mutating transactions, accounts, or cards refreshes all active screens in real time without manual reload.
- [ ] Dashboard displays a quick-add button centered above footer on mobile viewports and aligned to the side on web.
- [ ] Creating an expense from Home updates Dashboard balances and account totals immediately upon modal close.

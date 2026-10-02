# Design: Real-Time Data Sync and Home Quick-Add Action

## Technical Approach

We introduce a client-side reactive invalidation bus (`frontend/src/services/dataSync.ts`) using standard browser `EventTarget` and `BroadcastChannel`. Mutating operations executed through `api.ts` (`post`, `put`, `delete`) automatically infer the domain (`transactions`, `accounts`, `creditCards`, `budgets`, `goals`, `categories`) from the endpoint URL and broadcast an invalidation event. Active and mounted pages register listeners via a custom `useDataSync(domains, callback)` hook, triggering immediate refetches without requiring route switches.

On the `Dashboard`, we mount `TransactionModal` triggered by a responsive quick-add Floating Action Button (FAB). Using targeted CSS rules, the button floats centered above the bottom tab bar on mobile/APK viewports, and docks to the bottom-right side on desktop screens.

## Architecture Decisions

| Decision | Choice | Alternatives Considered | Rationale |
|----------|--------|--------------------------|-----------|
| State Sync Engine | Native `EventTarget` + `BroadcastChannel` | TanStack Query, Redux, Zustand | Zero runtime dependencies, integrates directly with existing `useState`/`api.get` architectures without invasive refactoring |
| Mutation Broadcast | Automatic interceptor in `api.ts` + explicit fallback | Manual event calls in every component | Eliminates developer oversight; any successful mutation guarantees real-time coherence |
| Shortcut Placement | In `Dashboard.tsx` with responsive CSS | Central tab inside `IonTabBar` | Keeps tab bar cleanly scrollable and scopes the shortcut strictly to Home as requested |

## Data Flow

```
[User Action in Modal / Page]
        │
        ▼
   api.post / put / delete
        │
        ├───→ [Backend Database] (200 OK)
        │
        ▼
   dataSync.notify(domains)
        ├───→ BroadcastChannel ('app-gastos-sync') ──→ Other Open Tabs
        │
        ▼
   useDataSync Listener(s)
        ├───→ Dashboard: fetchDashboardData() + fetchCreditCards()
        ├───→ Transactions: loadTransactions()
        ├───→ Accounts: loadData()
        └───→ CreditCards: fetchCards()
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `frontend/src/services/dataSync.ts` | Create | Event bus, domain type definitions, and `useDataSync` hook |
| `frontend/src/services/api.ts` | Modify | Intercept mutating calls and automatically broadcast domain sync events |
| `frontend/src/pages/Dashboard.tsx` | Modify | Add responsive quick-add FAB, integrate `TransactionModal`, and subscribe to `dataSync` |
| `frontend/src/pages/Transactions.tsx` | Modify | Subscribe to `dataSync`, dispatch on XLSX import |
| `frontend/src/pages/Accounts.tsx` | Modify | Subscribe to `dataSync` |
| `frontend/src/pages/CreditCards.tsx` | Modify | Subscribe to `dataSync` |
| `frontend/src/pages/Budgets.tsx` | Modify | Subscribe to `dataSync` |
| `frontend/src/pages/Goals.tsx` | Modify | Subscribe to `dataSync` |
| `frontend/src/theme/variables.css` | Modify | Responsive positioning rules for `.dashboard-quick-add-fab` |

## Interfaces / Contracts

```typescript
// frontend/src/services/dataSync.ts
export type SyncDomain = 
  | 'transactions' 
  | 'accounts' 
  | 'creditCards' 
  | 'budgets' 
  | 'goals' 
  | 'categories'
  | 'all';

export interface DataSyncEventDetail {
  domains: SyncDomain[];
  timestamp: number;
}

export function notifyDataSync(domains: SyncDomain | SyncDomain[]): void;
export function useDataSync(domains: SyncDomain | SyncDomain[], onSync: () => void): void;
```

## Responsive Button Layout

```css
/* frontend/src/theme/variables.css */
.dashboard-quick-add-fab {
  position: fixed;
  z-index: 998;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Mobile & APK */
@media (max-width: 767px) {
  .dashboard-quick-add-fab {
    bottom: 78px;
    left: 50%;
    transform: translateX(-50%);
    margin: 0;
  }
}

/* Desktop & Web */
@media (min-width: 768px) {
  .dashboard-quick-add-fab {
    bottom: 32px;
    right: 32px;
    left: auto;
    transform: none;
  }
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `dataSync.ts` dispatch & listener callbacks | Vitest test asserting listeners receive domain events |
| Integration | `api.ts` mutation trigger | Vitest test validating `post`/`put`/`delete` trigger `notifyDataSync` |
| E2E / Manual | Dashboard quick-add & cross-page sync | Create expense via Dashboard FAB, verify immediate update in Dashboard and Transactions |

## Migration / Rollout

No database or backend migration required. Pure frontend architectural enhancement.

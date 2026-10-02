# Design: Filter Transactions by Name

## Technical Approach

Implement real-time, zero-latency transaction search in the frontend (`Transactions.tsx`) using debounced state combined with accent- and case-insensitive string matching. Complement this with an optional `search` query parameter in the backend (`GET /transactions`) for API completeness.

## Architecture Decisions

### Decision: Client-Side Reactive Filtering vs Server SQL Search

| Option | Tradeoff | Decision |
|---|---|---|
| Client-Side Filtering | Requires dataset in memory, but yields 0ms typing response and works with encrypted DB fields. | **Chosen** |
| PostgreSQL `ILIKE` / FTS | Would require plain-text database columns or deterministic encryption, breaking existing randomized AES-256-GCM architecture. | Rejected |
| Server-Side Decrypt & Filter | Adds HTTP roundtrip latency on every keystroke. | Secondary (optional API param) |

**Rationale**: `description` is encrypted with AES-256-GCM using unique random IVs in PostgreSQL. Client-side filtering over the active date range's transactions preserves security at rest while giving an instantaneous UI response.

### Decision: Normalization Strategy for Fuzzy Matching

| Option | Tradeoff | Decision |
|---|---|---|
| `NFD` Unicode Stripping + Lowercase | Handles accents ("café" ↔ "cafe"), case, and partial substrings seamlessly. | **Chosen** |
| Strict `.includes()` | Misses uppercase/lowercase variations and accented letters. | Rejected |
| Heavy Fuzzy Library (Fuse.js) | Adds extra bundle weight for simple substring substring needs. | Rejected |

**Rationale**: A lightweight normalization helper (`str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()`) satisfies non-exact matching without third-party dependencies.

## Data Flow

```
[ User types in IonSearchbar ]
             │
             ▼
  searchText state updated
             │
             ▼
  normalizeText(description).includes(normalizeText(searchText))
             │
             ▼
  filteredTransactions passed to <TransactionList />
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `frontend/src/pages/Transactions.tsx` | Modify | Add `searchText` state, `<IonSearchbar>`, and filter logic before passing to `TransactionList` |
| `frontend/src/utils/text.ts` | Create | Export `normalizeText(str: string): string` for accent and case normalization |
| `backend/src/controllers/transactions.ts` | Modify | Add optional `search` parameter filtering in `getTransactions` post-decryption |

## Interfaces / Contracts

```typescript
// frontend/src/utils/text.ts
export function normalizeText(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `normalizeText` utility function | Vitest verifying case insensitivity, diacritics removal, and empty values |
| Component | `Transactions.tsx` list filtering | Verify rendered transactions reduce when `searchText` is provided |
| Manual | Search interaction in UI | Test "cafe" matching "Café", clear button restoring list, and empty state |

## Migration / Rollout

No database migration or data alteration required.

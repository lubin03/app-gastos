# Design: app-gastos-initial

## Technical Approach

We will build a full-stack application using React/Ionic for the frontend (web and Android support) and a Node.js + TypeScript backend. PostgreSQL will serve as the central relational database. To meet the strong privacy requirements, the backend will implement an application-level encryption layer before persisting PII data (descriptions, tags, user details) to the database. Fields needed for aggregation (amounts, dates, categories, account IDs) will be stored in plaintext to maintain database query performance.

## Architecture Decisions

| Decision | Choice | Alternatives considered | Rationale |
|----------|--------|-----------|-----------|
| **Frontend Framework** | React + Ionic | React Native, Flutter | Maximizes development speed for web and Android simultaneously using standard web tech, fulfilling project scope. |
| **Backend Stack** | Node.js + TypeScript | Python, Go, Java | Allows type sharing between frontend and backend. Strong async I/O. |
| **Database** | PostgreSQL | MySQL, MongoDB | Strong relational integrity, good JSON support, standard and reliable for financial data aggregations. |
| **Encryption Strategy** | Application-level (Node.js `crypto` AES-256-GCM) | DB-level (pgcrypto) | Maximizes privacy. Keeps DB completely blind to PII content. If DB is compromised, PII is safe as keys live in the application server environment. |

## Data Flow

```text
    [Frontend Client]
          │ (HTTPS - Plaintext JSON)
          ▼
    [Node.js Backend] ── (In-memory crypto layer)
          │ (Encrypted descriptions/tags/user info, Plaintext amounts/dates)
          ▼
    [PostgreSQL DB]
```

1. **Write**: Client sends transaction data. Backend intercepts, uses a `MASTER_KEY` (env variable) and a randomly generated IV to encrypt `description` and `tags` using `aes-256-gcm`. The `iv`, `auth_tag`, and `ciphertext` are saved to the DB.
2. **Read**: Backend queries DB (can use `SUM` on `amount`). Fetches records, decrypts the encrypted fields in memory, and returns plaintext JSON to the client.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `frontend/package.json` | Create | React and Ionic dependencies. |
| `backend/package.json` | Create | Node.js, Express/Fastify, pg, TypeScript. |
| `backend/src/utils/crypto.ts` | Create | Implements `encrypt` and `decrypt` using Node `crypto` (`aes-256-gcm`). |
| `backend/src/db/migrations/001_initial_schema.sql` | Create | Creates `users`, `accounts`, `transactions`, `budgets`. |

## Interfaces / Contracts

### Cryptographic Layer Pattern

```typescript
// backend/src/utils/crypto.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
// MASTER_KEY must be exactly 32 bytes (256 bits)
const MASTER_KEY = Buffer.from(process.env.MASTER_KEY || '', 'hex');

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, MASTER_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  // Format: iv:authTag:ciphertext
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decrypt(encryptedData: string): string {
  const [ivHex, authTagHex, ciphertext] = encryptedData.split(':');
  const decipher = crypto.createDecipheriv(
    ALGORITHM, 
    MASTER_KEY, 
    Buffer.from(ivHex, 'hex')
  );
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

### Database Schema (PostgreSQL)

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_encrypted TEXT NOT NULL,
    name_encrypted TEXT NOT NULL,
    password_hash TEXT, -- For email auth
    google_id TEXT UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    name_encrypted TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES accounts(id),
    amount DECIMAL(12, 2) NOT NULL,
    category TEXT NOT NULL, -- Plaintext for grouping
    date TIMESTAMP NOT NULL, -- Plaintext for filtering
    description_encrypted TEXT,
    tags_encrypted TEXT,
    type VARCHAR(20) CHECK (type IN ('income', 'expense', 'transfer')),
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Cryptographic functions (`encrypt`, `decrypt`), domain logic. | Jest or Vitest in backend. Verify encryption format and integrity. |
| Integration | API Endpoints (Transactions, Accounts, Auth) | Supertest with a test PostgreSQL instance. Verify that DB records contain encrypted strings, while API responses contain plaintext. |
| E2E | User flows (Login, Create Transaction, View Dashboard) | Cypress or Playwright interacting with the frontend, pointing to a test backend. |

## Migration / Rollout

No migration required as this is the initial setup.

## Open Questions

- [ ] Is there a requirement for key rotation initially, or can we defer it to a subsequent phase?
- [ ] Should categories be predefined globally or customizable per user? (If customizable, should they be encrypted too?)

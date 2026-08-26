# Tasks: app-gastos-initial

## Phase 1: Backend Foundation (Setup, DB, Crypto)
- [x] 1.1 Create `backend/package.json` with Node.js, Express, pg, and TypeScript dependencies.
- [x] 1.2 Create `backend/tsconfig.json` for backend TypeScript configuration.
- [x] 1.3 Create `backend/src/utils/crypto.ts` implementing `encrypt` and `decrypt` with `aes-256-gcm`.
- [x] 1.4 Create `backend/src/db/migrations/001_initial_schema.sql` defining `users`, `accounts`, `transactions`, and `budgets` tables.
- [x] 1.5 Create `backend/src/db/index.ts` to configure the PostgreSQL connection pool.

## Phase 2: Backend Core (Auth & API)
- [x] 2.1 Create `backend/src/models/user.ts` and `backend/src/controllers/auth.ts` for Email and Google Auth.
- [x] 2.2 Create `backend/src/middleware/auth.ts` to protect API routes using JWT.
- [x] 2.3 Create `backend/src/controllers/accounts.ts` implementing CRUD for accounts (encrypting name).
- [x] 2.4 Create `backend/src/controllers/transactions.ts` implementing CRUD for transactions (encrypting description and tags).
- [x] 2.5 Create `backend/src/controllers/budgets.ts` implementing CRUD for budgets.

## Phase 3: Frontend Foundation (Setup & Routing)
- [x] 3.1 Create `frontend/package.json` initializing React with Ionic framework.
- [x] 3.2 Create `frontend/src/App.tsx` setting up Ionic React Router.
- [x] 3.3 Create `frontend/src/services/api.ts` configuring Axios/Fetch with auth interceptors.
- [x] 3.4 Create `frontend/src/context/AuthContext.tsx` to manage user session state.

## Phase 4: Frontend Core (Auth & Dashboard)
- [x] 4.1 Create `frontend/src/pages/Login.tsx` with Email/Password and Google Auth forms.
- [x] 4.2 Create `frontend/src/pages/Register.tsx` for new user registration.
- [x] 4.3 Create `frontend/src/pages/Dashboard.tsx` displaying key metrics, balance, and charts.
- [x] 4.4 Create `frontend/src/components/TransactionList.tsx` to display decrypted transactions.

## Phase 5: Frontend Features (Transactions & Accounts)
- [x] 5.1 Create `frontend/src/pages/Accounts.tsx` to list and manage user accounts.
- [x] 5.2 Create `frontend/src/pages/Transactions.tsx` for full transaction management.
- [x] 5.3 Create `frontend/src/components/TransactionModal.tsx` form to add income, expenses, and transfers.
- [x] 5.4 Create `frontend/src/pages/Budgets.tsx` to manage plaintext categories and spending limits.

## Phase 6: Testing & Cleanup
- [ ] 6.1 Create `backend/tests/crypto.test.ts` to verify encryption/decryption integrity.
- [ ] 6.2 Create `backend/tests/api.test.ts` to verify DB plaintext aggregations vs encrypted fields.
- [ ] 6.3 Update `README.md` with setup instructions and environment variable templates.

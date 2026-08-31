# App Gastos (Expense Tracker)

A privacy-focused expense tracker built with React/Ionic (Frontend) and Node.js/Express (Backend).
It uses AES-256-GCM to encrypt sensitive data (account names, transaction descriptions, and tags) in the PostgreSQL database.

## Setup Instructions

### 1. Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)

### 2. Database Setup
Create a PostgreSQL database and user. For example:
```sql
CREATE DATABASE gastos_db;
CREATE USER gastos_user WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE gastos_db TO gastos_user;
```

### 3. Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
   **Required variables**:
   - `PORT`: 3000
   - `DATABASE_URL`: `postgres://gastos_user:password@localhost:5432/gastos_db`
   - `JWT_SECRET`: A strong random string for signing JWT tokens.
   - `MASTER_KEY`: A 64-character hex string (32 bytes) for AES-256-GCM encryption.

4. Run database migrations:
   ```bash
   node scripts/run-migrations.js
   ```
5. Start the backend development server:
   ```bash
   npm run dev
   ```

### 4. Frontend Setup
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file (if needed, e.g. for Google OAuth Client ID).
4. Start the Ionic development server:
   ```bash
   npm run dev
   ```

## Environment Variable Templates

### Backend `.env`
```env
PORT=3000
DATABASE_URL=postgres://user:password@localhost:5432/gastos_db
JWT_SECRET=your_jwt_secret_here
MASTER_KEY=0000000000000000000000000000000000000000000000000000000000000000
```

### Frontend `.env`
```env
VITE_API_URL=http://localhost:3000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

## Testing
- **Backend**: `cd backend && npm test`
- **Frontend**: `cd frontend && npm test`

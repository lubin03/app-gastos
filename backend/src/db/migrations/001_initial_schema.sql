CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_encrypted TEXT NOT NULL,
    name_encrypted TEXT NOT NULL,
    password_hash TEXT, -- For email auth
    google_id TEXT UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    name_encrypted TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
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

CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    category TEXT NOT NULL,
    limit_amount DECIMAL(12, 2) NOT NULL,
    month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, category, month)
);

ALTER TABLE accounts ADD COLUMN IF NOT EXISTS icon VARCHAR(100);

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type VARCHAR(20) CHECK (type IN ('income', 'expense')),
    parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    icon VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Removed DELETE statements to preserve data

ALTER TABLE transactions DROP COLUMN IF EXISTS category;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

ALTER TABLE budgets DROP COLUMN IF EXISTS category;
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE CASCADE;

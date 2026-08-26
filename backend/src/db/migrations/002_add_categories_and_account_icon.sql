ALTER TABLE accounts ADD COLUMN icon VARCHAR(100);

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type VARCHAR(20) CHECK (type IN ('income', 'expense')),
    parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    icon VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Delete existing transactions and budgets to avoid conflicts when dropping columns
DELETE FROM transactions;
DELETE FROM budgets;

ALTER TABLE transactions DROP COLUMN category;
ALTER TABLE transactions ADD COLUMN category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

ALTER TABLE budgets DROP COLUMN category;
ALTER TABLE budgets ADD COLUMN category_id UUID REFERENCES categories(id) ON DELETE CASCADE;

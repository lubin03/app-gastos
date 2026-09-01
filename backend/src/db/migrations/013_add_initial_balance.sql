-- Add initial_balance to accounts table
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS initial_balance NUMERIC(12, 2) DEFAULT 0 NOT NULL;

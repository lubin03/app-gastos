ALTER TABLE transactions ADD COLUMN IF NOT EXISTS destination_account_id UUID REFERENCES accounts(id);

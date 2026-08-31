-- Add network to accounts
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS network VARCHAR(50);

-- Create credit_card_invoices table
CREATE TABLE IF NOT EXISTS credit_card_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  month INT NOT NULL,
  year INT NOT NULL,
  status VARCHAR(20) DEFAULT 'open', -- open, closed, paid
  total_amount NUMERIC(12, 2) DEFAULT 0,
  paid_amount NUMERIC(12, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(account_id, month, year)
);

-- Add parity fields to transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES credit_card_invoices(id) ON DELETE SET NULL;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS installment_current INT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS installment_total INT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS parent_transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE;

-- Update existing credit card transactions to map to an invoice
-- (Since we don't have invoices yet, we will let the backend handle the creation dynamically when queried, or we can write a complex PL/pgSQL script. 
-- For now, the schema is enough, we will create missing invoices on the fly).

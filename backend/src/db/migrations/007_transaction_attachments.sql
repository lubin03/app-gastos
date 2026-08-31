CREATE TABLE IF NOT EXISTS transaction_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    content_type TEXT NOT NULL,
    data BYTEA NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS banking_institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    primary_color TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert catalog
INSERT INTO banking_institutions (name, code, logo_url, primary_color) VALUES
    ('Bancolombia', 'bancolombia', '/assets/banks/bancolombia.svg', '#F2D000'),
    ('Nequi', 'nequi', '/assets/banks/nequi.svg', '#DA0081'),
    ('Davivienda', 'davivienda', '/assets/banks/davivienda.svg', '#ED1C24'),
    ('Nubank', 'nubank', '/assets/banks/nubank.svg', '#8A05BE'),
    ('PayPal', 'paypal', '/assets/banks/paypal.svg', '#003087'),
    ('Mercado Pago', 'mercadopago', '/assets/banks/mercadopago.svg', '#009EE3'),
    ('Ualá', 'uala', '/assets/banks/uala.svg', '#FF4E50'),
    ('Lulo Bank', 'lulobank', '/assets/banks/lulobank.svg', '#CAFF00')
ON CONFLICT (code) DO NOTHING;

-- Modify accounts table
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES banking_institutions(id) ON DELETE SET NULL;

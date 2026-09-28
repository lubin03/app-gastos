import { Pool, types } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Override pg type parsers to return TIMESTAMP/TIMESTAMPTZ as raw strings
// instead of JS Date objects. This prevents timezone conversion bugs where
// '2026-09-28 00:00:00' becomes '2026-09-27T19:00:00.000Z' in UTC-5.
types.setTypeParser(1114, (str: string) => str); // TIMESTAMP WITHOUT TIME ZONE
types.setTypeParser(1184, (str: string) => str); // TIMESTAMP WITH TIME ZONE

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'postgres'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'app_gastos'}`
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export default pool;

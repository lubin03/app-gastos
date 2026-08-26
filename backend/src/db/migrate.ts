import fs from 'fs';
import path from 'path';
import pool from './index';

export const runMigrations = async () => {
  const client = await pool.connect();
  try {
    // Create migrations table to track state
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT NOW()
      );
    `);

    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    for (const file of files) {
      // Check if migration already ran
      const { rows } = await client.query('SELECT id FROM migrations WHERE name = $1', [file]);
      if (rows.length === 0) {
        console.log(`Running migration: ${file}`);
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf-8');
        
        await client.query('BEGIN');
        try {
          await client.query(sql);
          await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
          await client.query('COMMIT');
          console.log(`Migration ${file} completed successfully.`);
        } catch (err) {
          await client.query('ROLLBACK');
          console.error(`Error running migration ${file}:`, err);
          throw err;
        }
      }
    }
    console.log('All migrations are up to date.');
  } catch (err) {
    console.error('Migration failed:', err);
    throw err;
  } finally {
    client.release();
  }
};

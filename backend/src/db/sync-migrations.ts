import pool from './index';

async function sync() {
  const client = await pool.connect();
  try {
    const migrations = [
      '001_initial_schema.sql',
      '002_add_categories_and_account_icon.sql',
      '003_add_credit_cards.sql',
      '004_add_reset_password.sql'
    ];
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    for (const m of migrations) {
      await client.query(`
        INSERT INTO migrations (name) VALUES ($1) ON CONFLICT DO NOTHING
      `, [m]);
    }
    console.log('Migrations synced successfully');
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    process.exit(0);
  }
}
sync();

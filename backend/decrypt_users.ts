import 'dotenv/config';
import { Pool } from 'pg';
import { decrypt } from './src/utils/crypto';

console.log('MASTER_KEY from env:', process.env.MASTER_KEY ? process.env.MASTER_KEY.substring(0, 5) + '...' : 'undefined');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  try {
    const res = await pool.query('SELECT * FROM users');
    
    if (res.rows.length === 0) {
      console.log('No users found.');
      return;
    }

    console.log(`Found ${res.rows.length} users.\n`);

    res.rows.forEach(user => {
      console.log('ID:', user.id);
      console.log('Email:', decrypt(user.email_encrypted));
      console.log('Name:', decrypt(user.name_encrypted));
      console.log('Created At:', user.created_at);
      console.log('-----------------------------------');
    });
  } catch (err) {
    console.error('Error fetching users:', err);
  } finally {
    await pool.end();
  }
}

main();

import { query } from '../db';
import { encrypt, decrypt } from '../utils/crypto';

export interface User {
  id: string;
  email_encrypted: string;
  name_encrypted: string;
  password_hash?: string;
  google_id?: string;
  reset_token?: string;
  reset_token_expires?: Date;
  created_at: Date;
}

export const createUser = async (email: string, name: string, passwordHash?: string, googleId?: string): Promise<User> => {
  const emailEncrypted = encrypt(email);
  const nameEncrypted = encrypt(name);

  const res = await query(
    `INSERT INTO users (email_encrypted, name_encrypted, password_hash, google_id)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [emailEncrypted, nameEncrypted, passwordHash, googleId]
  );
  return res.rows[0];
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  // To find by email, we would either need a deterministic encryption or store a hash of the email.
  // Since we use GCM which is not deterministic, we must fetch all users and find the match, 
  // OR we should store a blind index (hash) of the email for lookups.
  // For the sake of this initial implementation, if we assume email is needed for login:
  // A standard approach is to store a hash(email) column or decrypt on the fly (very slow).
  // Let's decrypt on the fly for now, but in production we'd add an email_hash column.
  const res = await query(`SELECT * FROM users`);
  for (const row of res.rows) {
    const decryptedEmail = decrypt(row.email_encrypted);
    if (decryptedEmail === email) {
      return row;
    }
  }
  return null;
};

export const getUserByGoogleId = async (googleId: string): Promise<User | null> => {
  const res = await query(`SELECT * FROM users WHERE google_id = $1`, [googleId]);
  return res.rows[0] || null;
};

export const getUserById = async (id: string): Promise<User | null> => {
  const res = await query(`SELECT * FROM users WHERE id = $1`, [id]);
  return res.rows[0] || null;
};

export const updateUser = async (id: string, email: string, passwordHash?: string): Promise<User> => {
  const emailEncrypted = encrypt(email);
  if (passwordHash) {
    const res = await query(
      `UPDATE users SET email_encrypted = $1, password_hash = $2 WHERE id = $3 RETURNING *`,
      [emailEncrypted, passwordHash, id]
    );
    return res.rows[0];
  } else {
    const res = await query(
      `UPDATE users SET email_encrypted = $1 WHERE id = $2 RETURNING *`,
      [emailEncrypted, id]
    );
    return res.rows[0];
  }
};

export const saveResetToken = async (userId: string, token: string, expiresAt: Date): Promise<void> => {
  await query(
    `UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3`,
    [token, expiresAt, userId]
  );
};

export const getUserByResetToken = async (token: string): Promise<User | null> => {
  const res = await query(`SELECT * FROM users WHERE reset_token = $1`, [token]);
  return res.rows[0] || null;
};

export const updatePasswordAndClearToken = async (userId: string, passwordHash: string): Promise<void> => {
  await query(
    `UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2`,
    [passwordHash, userId]
  );
};

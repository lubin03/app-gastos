import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
// MASTER_KEY must be exactly 32 bytes (256 bits). In a real app, ensure this exists in the environment.
const MASTER_KEY = Buffer.from(process.env.MASTER_KEY || '0000000000000000000000000000000000000000000000000000000000000000', 'hex');

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, MASTER_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  // Format: iv:authTag:ciphertext
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decrypt(encryptedData: string): string | null {
  if (!encryptedData) return null;
  try {
    const [ivHex, authTagHex, ciphertext] = encryptedData.split(':');
    if (!ivHex || !authTagHex || !ciphertext) return null;
    
    const decipher = crypto.createDecipheriv(
      ALGORITHM, 
      MASTER_KEY, 
      Buffer.from(ivHex, 'hex')
    );
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error', error);
    return null;
  }
}

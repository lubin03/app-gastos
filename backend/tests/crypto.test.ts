import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from '../src/utils/crypto';

describe('Cryptography Utils', () => {
  it('should encrypt and decrypt a string successfully', () => {
    const originalText = 'secret account name';
    const encryptedText = encrypt(originalText);
    
    // Encrypted text should be different from original
    expect(encryptedText).not.toBe(originalText);
    
    // Encrypted text should have iv, authTag, and ciphertext separated by colons
    const parts = encryptedText.split(':');
    expect(parts.length).toBe(3);
    
    const decryptedText = decrypt(encryptedText);
    expect(decryptedText).toBe(originalText);
  });

  it('should return null when decrypting an invalid format', () => {
    expect(decrypt('')).toBeNull();
    expect(decrypt('invalid:format')).toBeNull();
  });

  it('should return null when decryption fails (e.g., bad auth tag)', () => {
    const encryptedText = encrypt('some text');
    const parts = encryptedText.split(':');
    // Mangle the auth tag
    parts[1] = parts[1].replace(/[0-9a-f]/i, '0');
    const mangledEncryptedText = parts.join(':');
    
    expect(decrypt(mangledEncryptedText)).toBeNull();
  });
});

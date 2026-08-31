import { describe, it, expect, vi } from 'vitest';
import { getTransactions } from '../src/controllers/transactions';
import { query } from '../src/db';
import { encrypt } from '../src/utils/crypto';

// Mock the db module
vi.mock('../src/db', () => ({
  query: vi.fn(),
}));

describe('Transactions API - DB Plaintext vs Encrypted', () => {
  it('should decrypt encrypted fields when returning transactions', async () => {
    const mockReq = {
      user: { userId: 1 },
      query: {},
    };
    
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const encryptedDesc = encrypt('Secret Salary');
    const encryptedAccName = encrypt('Hidden Bank');
    const encryptedDestName = encrypt('Another Bank');

    const mockDbResult = {
      rows: [
        {
          id: 100,
          account_id: 1,
          destination_account_id: 2,
          account_name_encrypted: encryptedAccName,
          dest_account_name_encrypted: encryptedDestName,
          amount: 5000,
          category_id: 1,
          date: '2023-10-01',
          description_encrypted: encryptedDesc,
          tag_list: [],
          type: 'income',
          paid: true,
          created_at: '2023-10-01T10:00:00.000Z'
        }
      ]
    };

    (query as any).mockResolvedValue(mockDbResult);

    await getTransactions(mockReq as any, mockRes as any);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    const jsonArgs = mockRes.json.mock.calls[0][0];
    
    expect(jsonArgs.length).toBe(1);
    expect(jsonArgs[0].description).toBe('Secret Salary');
    expect(jsonArgs[0].account_name).toBe('Hidden Bank');
    expect(jsonArgs[0].destination_account_name).toBe('Another Bank');
  });
});

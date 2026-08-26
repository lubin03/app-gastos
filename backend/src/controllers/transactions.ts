import { Request, Response } from 'express';
import { query } from '../db';
import { encrypt, decrypt } from '../utils/crypto';

export const getTransactions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { startDate, endDate } = req.query;

    let queryStr = `
      SELECT t.* 
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      WHERE a.user_id = $1
    `;
    const params: any[] = [userId];

    if (startDate && endDate) {
      queryStr += ` AND t.date >= $2 AND t.date <= $3`;
      params.push(startDate, endDate);
    }

    queryStr += ` ORDER BY t.date DESC`;

    const result = await query(queryStr, params);
    
    const transactions = result.rows.map(row => ({
      id: row.id,
      account_id: row.account_id,
      amount: row.amount,
      category_id: row.category_id,
      date: row.date,
      description: row.description_encrypted ? decrypt(row.description_encrypted) : '',
      tags: row.tags_encrypted ? decrypt(row.tags_encrypted) : '',
      type: row.type,
      paid: row.paid,
      created_at: row.created_at
    }));

    res.status(200).json(transactions);
  } catch (error) {
    console.error('Get transactions error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createTransaction = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { amount, category_id, date, description, tags, type } = req.body;
    const account_id = req.body.account_id || req.body.accountId;

    // Validate account belongs to user
    const accResult = await query('SELECT id FROM accounts WHERE id = $1 AND user_id = $2', [account_id, userId]);
    if (accResult.rowCount === 0) {
      return res.status(403).json({ error: 'Invalid account' });
    }

    const descEncrypted = description ? encrypt(description) : null;
    const tagsEncrypted = tags ? encrypt(tags) : null;

    const result = await query(
      `INSERT INTO transactions 
       (account_id, amount, category_id, date, description_encrypted, tags_encrypted, type) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [account_id, amount, category_id, date, descEncrypted, tagsEncrypted, type]
    );

    const row = result.rows[0];
    res.status(201).json({
      id: row.id,
      account_id: row.account_id,
      amount: row.amount,
      category_id: row.category_id,
      date: row.date,
      description: row.description_encrypted ? decrypt(row.description_encrypted) : '',
      tags: row.tags_encrypted ? decrypt(row.tags_encrypted) : '',
      type: row.type,
      created_at: row.created_at
    });
  } catch (error) {
    console.error('Create transaction error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTransactionYears = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const result = await query(`
      SELECT DISTINCT EXTRACT(YEAR FROM t.date) as year
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      WHERE a.user_id = $1
      ORDER BY year DESC
    `, [userId]);

    let years = result.rows.map(r => parseInt(r.year, 10));
    
    // Always ensure current year is included even if no transactions
    const currentYear = new Date().getFullYear();
    if (!years.includes(currentYear)) {
      years.push(currentYear);
      years.sort((a, b) => b - a); // descending
    }

    res.status(200).json(years);
  } catch (error) {
    console.error('Get transaction years error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateTransaction = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    const { amount, category_id, date, description, tags, type } = req.body;
    const account_id = req.body.account_id || req.body.accountId;

    // Validate transaction exists and belongs to user
    const existing = await query(`
      SELECT t.id FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      WHERE t.id = $1 AND a.user_id = $2
    `, [id, userId]);

    if (existing.rowCount === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (account_id) {
      const accResult = await query('SELECT id FROM accounts WHERE id = $1 AND user_id = $2', [account_id, userId]);
      if (accResult.rowCount === 0) {
        return res.status(403).json({ error: 'Invalid account' });
      }
    }

    const descEncrypted = description !== undefined ? (description ? encrypt(description) : null) : undefined;
    const tagsEncrypted = tags !== undefined ? (tags ? encrypt(tags) : null) : undefined;

    const result = await query(
      `UPDATE transactions 
       SET 
         account_id = COALESCE($1, account_id),
         amount = COALESCE($2, amount),
         category_id = COALESCE($3, category_id),
         date = COALESCE($4, date),
         description_encrypted = COALESCE($5, description_encrypted),
         tags_encrypted = COALESCE($6, tags_encrypted),
         type = COALESCE($7, type)
       WHERE id = $8 RETURNING *`,
      [account_id, amount, category_id, date, descEncrypted, tagsEncrypted, type, id]
    );

    const row = result.rows[0];
    res.status(200).json({
      id: row.id,
      account_id: row.account_id,
      amount: row.amount,
      category_id: row.category_id,
      date: row.date,
      description: row.description_encrypted ? decrypt(row.description_encrypted) : '',
      tags: row.tags_encrypted ? decrypt(row.tags_encrypted) : '',
      type: row.type,
      created_at: row.created_at
    });
  } catch (error) {
    console.error('Update transaction error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteTransaction = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const existing = await query(`
      SELECT t.id FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      WHERE t.id = $1 AND a.user_id = $2
    `, [id, userId]);

    if (existing.rowCount === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    await query('DELETE FROM transactions WHERE id = $1', [id]);
    res.status(200).json({ message: 'Transaction deleted' });
  } catch (error) {
    console.error('Delete transaction error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

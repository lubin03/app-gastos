import { Request, Response } from 'express';
import { query } from '../db';
import { encrypt, decrypt } from '../utils/crypto';

export const getTransactions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { startDate, endDate } = req.query;

    let queryStr = `
      SELECT t.*, a.name_encrypted as account_name_encrypted,
             d.name_encrypted as dest_account_name_encrypted,
             (SELECT COALESCE(json_agg(json_build_object('id', tg.id, 'name', tg.name)), '[]')
              FROM transaction_tags tt 
              JOIN tags tg ON tt.tag_id = tg.id 
              WHERE tt.transaction_id = t.id) as tag_list
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      LEFT JOIN accounts d ON t.destination_account_id = d.id
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
      destination_account_id: row.destination_account_id,
      account_name: row.account_name_encrypted ? decrypt(row.account_name_encrypted) : '',
      destination_account_name: row.dest_account_name_encrypted ? decrypt(row.dest_account_name_encrypted) : '',
      amount: row.amount,
      category_id: row.category_id,
      date: row.date,
      description: row.description_encrypted ? decrypt(row.description_encrypted) : '',
      tags: row.tag_list || [],
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
    const { amount, category_id, date, description, tags, type, paid, destination_account_id, installments } = req.body;
    const account_id = req.body.account_id || req.body.accountId;

    // Validate account belongs to user
    const accResult = await query('SELECT id, type FROM accounts WHERE id = $1 AND user_id = $2', [account_id, userId]);
    if (accResult.rowCount === 0) {
      return res.status(403).json({ error: 'Invalid account' });
    }
    const accountType = accResult.rows[0].type;

    const descEncrypted = description ? encrypt(description) : null;

    let finalPaid = paid;
    if (finalPaid === undefined) {
      finalPaid = accountType !== 'credit_card';
    }

    const installmentTotal = parseInt(installments, 10) || 1;
    const installmentAmount = installmentTotal > 1 ? (Number(amount) / installmentTotal).toFixed(2) : amount;
    
    let firstRow: any = null;
    let parentId: string | null = null;

    for (let i = 0; i < installmentTotal; i++) {
      const d = new Date(date || new Date());
      d.setMonth(d.getMonth() + i);
      const instDate = d.toISOString();

      const instDesc = installmentTotal > 1 ? `${description || ''} (${i+1}/${installmentTotal})` : description;
      const descEncrypted = instDesc ? encrypt(instDesc) : null;

      const result = await query(
        `INSERT INTO transactions 
         (account_id, amount, category_id, date, description_encrypted, type, paid, destination_account_id, installment_current, installment_total, parent_transaction_id) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
        [account_id, installmentAmount, category_id, instDate, descEncrypted, type, finalPaid, destination_account_id || null, i + 1, installmentTotal, parentId]
      );

      const row = result.rows[0];
      if (i === 0) {
        firstRow = row;
        if (installmentTotal > 1) {
           parentId = row.id;
           // update first row to have itself as parent if you want, or just leave null
           await query(`UPDATE transactions SET parent_transaction_id = $1 WHERE id = $2`, [parentId, parentId]);
        }
      }

      // Handle tags
      if (tags && Array.isArray(tags)) {
        for (const tagId of tags) {
          await query('INSERT INTO transaction_tags (transaction_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [row.id, tagId]);
        }
      }
    }

    // Fetch tags to return for the first transaction
    const tagsResult = await query(
      `SELECT tg.id, tg.name FROM transaction_tags tt JOIN tags tg ON tt.tag_id = tg.id WHERE tt.transaction_id = $1`,
      [firstRow.id]
    );

    res.status(201).json({
      id: firstRow.id,
      account_id: firstRow.account_id,
      destination_account_id: firstRow.destination_account_id,
      amount: firstRow.amount,
      category_id: firstRow.category_id,
      date: firstRow.date,
      description: firstRow.description_encrypted ? decrypt(firstRow.description_encrypted) : '',
      tags: tagsResult.rows || [],
      type: firstRow.type,
      paid: firstRow.paid,
      installment_current: 1,
      installment_total: installmentTotal,
      created_at: firstRow.created_at
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
    const { amount, category_id, date, description, tags, type, paid, destination_account_id } = req.body;
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

    const result = await query(
      `UPDATE transactions 
       SET 
         account_id = COALESCE($1, account_id),
         amount = COALESCE($2, amount),
         category_id = COALESCE($3, category_id),
         date = COALESCE($4, date),
         description_encrypted = COALESCE($5, description_encrypted),
         type = COALESCE($6, type),
         paid = COALESCE($7, paid),
         destination_account_id = $8
       WHERE id = $9 RETURNING *`,
      [account_id, amount, category_id, date, descEncrypted, type, paid, destination_account_id || null, id]
    );

    const row = result.rows[0];

    // Handle tags (expecting array of tag IDs)
    if (tags !== undefined && Array.isArray(tags)) {
      // Clear old tags
      await query('DELETE FROM transaction_tags WHERE transaction_id = $1', [id]);
      // Insert new tags
      for (const tagId of tags) {
        await query('INSERT INTO transaction_tags (transaction_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, tagId]);
      }
    }

    // Fetch tags to return
    const tagsResult = await query(
      `SELECT tg.id, tg.name FROM transaction_tags tt JOIN tags tg ON tt.tag_id = tg.id WHERE tt.transaction_id = $1`,
      [id]
    );
    res.status(200).json({
      id: row.id,
      account_id: row.account_id,
      destination_account_id: row.destination_account_id,
      amount: row.amount,
      category_id: row.category_id,
      date: row.date,
      description: row.description_encrypted ? decrypt(row.description_encrypted) : '',
      tags: tagsResult.rows || [],
      type: row.type,
      paid: row.paid,
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

export const deleteAllTransactions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    // Delete in dependency order to respect FK constraints
    // 1. Transaction attachments and tags (via transactions cascade)
    await query(`
      DELETE FROM transactions t
      USING accounts a
      WHERE t.account_id = a.id AND a.user_id = $1
    `, [userId]);
    // 2. Invoices tied to accounts
    await query(`
      DELETE FROM credit_card_invoices ci
      USING accounts a
      WHERE ci.account_id = a.id AND a.user_id = $1
    `, [userId]);
    // 3. Accounts
    await query('DELETE FROM accounts WHERE user_id = $1', [userId]);
    // 4. Categories, tags, budgets, goals
    await query('DELETE FROM categories WHERE user_id = $1', [userId]);
    await query('DELETE FROM tags WHERE user_id = $1', [userId]);
    await query('DELETE FROM budgets WHERE user_id = $1', [userId]);
    await query('DELETE FROM goals WHERE user_id = $1', [userId]);

    res.status(200).json({ message: 'All user data deleted successfully' });
  } catch (error) {
    console.error('Delete all data error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

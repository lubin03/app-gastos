import { Request, Response } from 'express';
import { query } from '../db';
import { encrypt, decrypt } from '../utils/crypto';

export const getAccounts = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { endDate } = req.query;

    const queryParams: any[] = [userId];
    let dateFilter = '';
    let ccDateFilter = '';

    if (endDate) {
      queryParams.push(endDate);
      dateFilter = ` AND t.date < $2::date + interval '1 day'`;
      ccDateFilter = ` AND t.date < $2::date + interval '1 day'`;
    }

    const result = await query(`
      SELECT a.*, b.name as institution_name, b.code as institution_code, b.logo_url as institution_logo, b.primary_color as institution_color,
      CASE 
        WHEN a.type = 'credit_card' THEN
          -(COALESCE(
            (SELECT SUM(t.amount) FROM transactions t WHERE t.account_id = a.id AND t.paid = FALSE AND t.type = 'expense'${ccDateFilter}),
            0
          ))
        ELSE
          (COALESCE(
            (SELECT SUM(
              CASE 
                WHEN t.type = 'income' THEN t.amount 
                WHEN t.type = 'expense' THEN -t.amount 
                WHEN t.type = 'transfer' AND t.account_id = a.id THEN -t.amount
                WHEN t.type = 'transfer' AND t.destination_account_id = a.id THEN t.amount
                ELSE 0 
              END
            ) FROM transactions t 
              WHERE (t.account_id = a.id OR t.destination_account_id = a.id)${dateFilter}
            ), 0
          ) + COALESCE(a.initial_balance, 0))
      END as balance
      FROM accounts a
      LEFT JOIN banking_institutions b ON a.institution_id = b.id
      WHERE a.user_id = $1 
      ORDER BY a.created_at ASC
    `, queryParams);
    
    const accounts = result.rows.map(row => ({
      id: row.id,
      name: decrypt(row.name_encrypted),
      icon: row.icon,
      institution_id: row.institution_id,
      institution: row.institution_id ? {
        id: row.institution_id,
        name: row.institution_name,
        code: row.institution_code,
        logo_url: row.institution_logo,
        primary_color: row.institution_color
      } : null,
      type: row.type,
      credit_limit: row.credit_limit,
      closing_day: row.closing_day,
      due_day: row.due_day,
      network: row.network,
      is_archived: row.is_archived,
      initial_balance: Number(row.initial_balance || 0),
      created_at: row.created_at,
      balance: Number(row.balance)
    }));

    res.status(200).json(accounts);
  } catch (error) {
    console.error('Get accounts error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createAccount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { name, icon, institution_id, type, credit_limit, closing_day, due_day, network, initial_balance } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Account name is required' });
    }

    if (type === 'credit_card') {
      if (!closing_day || closing_day < 1 || closing_day > 31) {
        return res.status(400).json({ error: 'Invalid closing_day (must be 1-31)' });
      }
      if (!due_day || due_day < 1 || due_day > 31) {
        return res.status(400).json({ error: 'Invalid due_day (must be 1-31)' });
      }
    }

    const nameEncrypted = encrypt(name);
    const parsedInitialBalance = initial_balance !== undefined && initial_balance !== null ? (parseFloat(initial_balance) || 0) : 0;
    const result = await query(
      'INSERT INTO accounts (user_id, name_encrypted, icon, institution_id, type, credit_limit, closing_day, due_day, network, initial_balance) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [userId, nameEncrypted, icon || null, institution_id || null, type || 'debit', credit_limit || null, closing_day || null, due_day || null, network || null, parsedInitialBalance]
    );

    const row = result.rows[0];
    res.status(201).json({
      id: row.id,
      name: decrypt(row.name_encrypted),
      icon: row.icon,
      type: row.type,
      credit_limit: row.credit_limit,
      closing_day: row.closing_day,
      due_day: row.due_day,
      network: row.network,
      initial_balance: Number(row.initial_balance || 0),
      created_at: row.created_at
    });
  } catch (error) {
    console.error('Create account error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateAccount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    const { name, icon, institution_id, type, credit_limit, closing_day, due_day, network, initial_balance } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Account name is required' });
    }

    if (type === 'credit_card') {
      if (!closing_day || closing_day < 1 || closing_day > 31) {
        return res.status(400).json({ error: 'Invalid closing_day (must be 1-31)' });
      }
      if (!due_day || due_day < 1 || due_day > 31) {
        return res.status(400).json({ error: 'Invalid due_day (must be 1-31)' });
      }
    }

    const nameEncrypted = encrypt(name);
    const parsedInitialBalance = initial_balance !== undefined && initial_balance !== null ? (parseFloat(initial_balance) || 0) : 0;
    const result = await query(
      'UPDATE accounts SET name_encrypted = $1, icon = $2, institution_id = $3, type = $4, credit_limit = $5, closing_day = $6, due_day = $7, network = $8, initial_balance = $9 WHERE id = $10 AND user_id = $11 RETURNING *',
      [nameEncrypted, icon || null, institution_id || null, type || 'debit', credit_limit || null, closing_day || null, due_day || null, network || null, parsedInitialBalance, id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const row = result.rows[0];
    res.status(200).json({
      id: row.id,
      name: decrypt(row.name_encrypted),
      icon: row.icon,
      type: row.type,
      credit_limit: row.credit_limit,
      closing_day: row.closing_day,
      due_day: row.due_day,
      network: row.network,
      initial_balance: Number(row.initial_balance || 0),
      created_at: row.created_at
    });
  } catch (error) {
    console.error('Update account error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const { force } = req.query;

    let result;
    if (force === 'true') {
      result = await query(
        'DELETE FROM accounts WHERE id = $1 AND user_id = $2 RETURNING id',
        [id, userId]
      );
    } else {
      result = await query(
        'UPDATE accounts SET is_archived = TRUE WHERE id = $1 AND user_id = $2 RETURNING id',
        [id, userId]
      );
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    res.status(200).json({ message: 'Account deleted' });
  } catch (error) {
    console.error('Delete account error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const payCreditCard = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params; // Credit card account ID
    const { invoice_id, funding_account_id, amount, category_id, date, description } = req.body;

    if (!invoice_id) {
      return res.status(400).json({ error: 'invoice_id is required' });
    }

    // Validate both accounts exist and belong to user
    const ccResult = await query('SELECT id FROM accounts WHERE id = $1 AND user_id = $2 AND type = $3', [id, userId, 'credit_card']);
    if (ccResult.rowCount === 0) return res.status(404).json({ error: 'Credit card not found' });

    const fundResult = await query('SELECT id FROM accounts WHERE id = $1 AND user_id = $2', [funding_account_id, userId]);
    if (fundResult.rowCount === 0) return res.status(404).json({ error: 'Funding account not found' });

    // Validate invoice exists
    const invResult = await query('SELECT id FROM credit_card_invoices WHERE id = $1 AND account_id = $2', [invoice_id, id]);
    if (invResult.rowCount === 0) return res.status(404).json({ error: 'Invoice not found' });

    // 1. Mark all unpaid expense transactions on the specific invoice as paid
    await query(`
      UPDATE transactions 
      SET paid = TRUE 
      WHERE invoice_id = $1 AND paid = FALSE AND type = 'expense'
    `, [invoice_id]);

    // Update specific invoice status to paid
    await query(`
      UPDATE credit_card_invoices 
      SET status = 'paid'
      WHERE id = $1
    `, [invoice_id]);

    // 2. Create the payment expense on the funding account
    const descEncrypted = description ? encrypt(description) : null;
    await query(`
      INSERT INTO transactions (account_id, amount, category_id, date, description_encrypted, type, paid)
      VALUES ($1, $2, $3, $4, $5, $6, TRUE)
    `, [funding_account_id, amount, category_id, date || new Date().toISOString(), descEncrypted, 'expense']);

    res.status(200).json({ message: 'Credit card paid successfully' });
  } catch (error) {
    console.error('Pay credit card error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

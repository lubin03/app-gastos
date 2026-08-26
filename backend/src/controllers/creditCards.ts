import { Request, Response } from 'express';
import { query } from '../db';
import { decrypt } from '../utils/crypto';

export const getCreditCardsSummary = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    // Fetch all credit card accounts
    const ccResult = await query(`
      SELECT id, name_encrypted, icon, credit_limit, closing_day, due_day 
      FROM accounts 
      WHERE user_id = $1 AND type = 'credit_card'
    `, [userId]);

    const cards = [];

    for (const row of ccResult.rows) {
      // Calculate unpaid expenses (current invoice)
      const unpaidResult = await query(`
        SELECT SUM(amount) as total_unpaid
        FROM transactions
        WHERE account_id = $1 AND paid = FALSE AND type = 'expense'
      `, [row.id]);

      const consumed = parseFloat(unpaidResult.rows[0].total_unpaid || '0');
      const limit = parseFloat(row.credit_limit || '0');
      
      cards.push({
        id: row.id,
        name: decrypt(row.name_encrypted),
        icon: row.icon,
        limit,
        consumed,
        available: limit - consumed,
        closing_day: row.closing_day,
        due_day: row.due_day
      });
    }

    res.status(200).json(cards);
  } catch (error) {
    console.error('Get credit cards summary error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCreditCardTransactions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    // Validate ownership
    const ccResult = await query('SELECT id FROM accounts WHERE id = $1 AND user_id = $2 AND type = $3', [id, userId, 'credit_card']);
    if (ccResult.rowCount === 0) {
      return res.status(404).json({ error: 'Credit card not found' });
    }

    // Get transactions (both paid and unpaid to show history)
    const result = await query(`
      SELECT t.*, c.name as category_name 
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.account_id = $1
      ORDER BY t.paid ASC, t.date DESC
    `, [id]);

    const transactions = result.rows.map(row => ({
      id: row.id,
      amount: parseFloat(row.amount),
      date: row.date,
      description: row.description_encrypted ? decrypt(row.description_encrypted) : '',
      category_name: row.category_name,
      type: row.type,
      paid: row.paid
    }));

    res.status(200).json(transactions);
  } catch (error) {
    console.error('Get credit card transactions error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

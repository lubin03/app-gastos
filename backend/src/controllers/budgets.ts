import { Request, Response } from 'express';
import { query } from '../db';

export const getBudgets = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { startDate } = req.query;

    let queryStr = 'SELECT * FROM budgets WHERE user_id = $1';
    const params: any[] = [userId];

    if (startDate && typeof startDate === 'string') {
      const monthStr = startDate.substring(0, 7); // 'YYYY-MM'
      queryStr += ' AND month = $2';
      params.push(monthStr);
    }

    queryStr += ' ORDER BY month DESC';

    const result = await query(queryStr, params);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Get budgets error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createBudget = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { category_id, amount } = req.body;

    if (!category_id || !amount) {
      return res.status(400).json({ error: 'Category ID and amount are required' });
    }

    const month = new Date().toISOString().slice(0, 7); // YYYY-MM

    const result = await query(
      'INSERT INTO budgets (user_id, category_id, limit_amount, month) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id, category_id, month) DO UPDATE SET limit_amount = EXCLUDED.limit_amount RETURNING *',
      [userId, category_id, amount, month]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create budget error', error);
    // Handle unique constraint violation (code 23505 in postgres)
    if ((error as any).code === '23505') {
      return res.status(409).json({ error: 'Budget for this category and month already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateBudget = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    const { limit_amount } = req.body;

    if (limit_amount === undefined) {
      return res.status(400).json({ error: 'Missing limit_amount' });
    }

    const result = await query(
      `UPDATE budgets SET limit_amount = $1 WHERE id = $2 AND user_id = $3 RETURNING *`,
      [limit_amount, id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Update budget error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteBudget = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const result = await query(
      'DELETE FROM budgets WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    res.status(200).json({ message: 'Budget deleted' });
  } catch (error) {
    console.error('Delete budget error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

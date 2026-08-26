import { Request, Response } from 'express';
import { query } from '../db';

export const getDailyEvolution = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    // Daily evolution for the given period
    const result = await query(`
      SELECT 
        TO_CHAR(t.date, 'YYYY-MM-DD') as day,
        SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as expense,
        SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as income
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      WHERE a.user_id = $1 AND t.date >= $2::date AND t.date < $3::date + interval '1 day'
      GROUP BY TO_CHAR(t.date, 'YYYY-MM-DD')
      ORDER BY day ASC
    `, [userId, startDate, endDate]);

    const formattedData = result.rows.map(r => ({
      date: r.day,
      expense: parseFloat(r.expense),
      income: parseFloat(r.income)
    }));

    res.status(200).json(formattedData);
  } catch (error) {
    console.error('Get daily evolution error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMonthlyEvolution = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    
    // Last 12 months evolution (globally across the year)
    const result = await query(`
      SELECT 
        TO_CHAR(t.date, 'YYYY-MM') as month,
        SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as expense,
        SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as income
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      WHERE a.user_id = $1 AND t.date >= (CURRENT_DATE - INTERVAL '12 months')
      GROUP BY TO_CHAR(t.date, 'YYYY-MM')
      ORDER BY month ASC
    `, [userId]);

    const formattedData = result.rows.map(r => ({
      month: r.month,
      expense: parseFloat(r.expense),
      income: parseFloat(r.income)
    }));

    res.status(200).json(formattedData);
  } catch (error) {
    console.error('Get monthly evolution error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

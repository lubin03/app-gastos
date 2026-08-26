import { Request, Response } from 'express';
import { query } from '../db';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { startDate, endDate } = req.query;

    // 1. Calculate All-Time Balances (Bank Total and CC Debt)
    // Bank Total = Income - Expense on debit accounts
    // CC Debt = Expense - Income on credit_card accounts where paid = false
    const balancesResult = await query(`
      SELECT 
        a.type, 
        t.type as tx_type, 
        t.paid, 
        SUM(t.amount) as total
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      WHERE a.user_id = $1
      GROUP BY a.type, t.type, t.paid
    `, [userId]);

    let bankTotal = 0;
    let ccDebt = 0;

    balancesResult.rows.forEach(row => {
      const amount = parseFloat(row.total);
      if (row.type === 'credit_card') {
        if (!row.paid) {
          if (row.tx_type === 'expense') ccDebt += amount;
          if (row.tx_type === 'income') ccDebt -= amount;
        }
      } else {
        if (row.tx_type === 'income') bankTotal += amount;
        if (row.tx_type === 'expense') bankTotal -= amount;
      }
    });

    // 2. Calculate Income and Expense for the selected date range
    let income = 0;
    let expense = 0;

    let dateQuery = `
      SELECT t.type, SUM(t.amount) as total
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      WHERE a.user_id = $1
    `;
    const params: any[] = [userId];

    if (startDate && endDate) {
      dateQuery += ` AND t.date >= $2 AND t.date <= $3`;
      params.push(startDate, endDate);
    }

    dateQuery += ` GROUP BY t.type`;

    const periodResult = await query(dateQuery, params);

    periodResult.rows.forEach(row => {
      const amount = parseFloat(row.total);
      if (row.type === 'income') income += amount;
      if (row.type === 'expense') expense += amount;
    });

    res.status(200).json({
      bankTotal,
      ccDebt,
      income,
      expense
    });

  } catch (error) {
    console.error('Get dashboard stats error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

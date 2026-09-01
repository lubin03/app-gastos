import { Request, Response } from 'express';
import { query } from '../db';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { startDate, endDate } = req.query;

    // 1. Calculate Period Balances (Bank Total and CC Debt up to endDate)
    let txDateFilter = '';
    const balanceParams: any[] = [userId];
    if (endDate) {
      balanceParams.push(endDate);
      txDateFilter = ` AND t.date < $2::date + interval '1 day'`;
    }

    const balancesResult = await query(`
      WITH normalized_txs AS (
        SELECT a.type as account_type, t.type as tx_type, t.paid, t.amount
        FROM transactions t
        JOIN accounts a ON t.account_id = a.id
        WHERE a.user_id = $1 AND t.type != 'transfer'${txDateFilter}
        
        UNION ALL
        
        SELECT a.type as account_type, 'expense' as tx_type, t.paid, t.amount
        FROM transactions t
        JOIN accounts a ON t.account_id = a.id
        WHERE a.user_id = $1 AND t.type = 'transfer'${txDateFilter}
        
        UNION ALL
        
        SELECT d.type as account_type, 'income' as tx_type, t.paid, t.amount
        FROM transactions t
        JOIN accounts d ON t.destination_account_id = d.id
        WHERE d.user_id = $1 AND t.type = 'transfer'${txDateFilter}
      )
      SELECT account_type as type, tx_type, paid, SUM(amount) as total
      FROM normalized_txs
      GROUP BY account_type, tx_type, paid
    `, balanceParams);

    // Initial balance sum for bank/cash accounts
    const initRes = await query(
      `SELECT SUM(initial_balance) as init_sum FROM accounts WHERE user_id = $1 AND type != 'credit_card'`,
      [userId]
    );
    let bankTotal = parseFloat(initRes.rows[0]?.init_sum || '0');
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
      dateQuery += ` AND t.date >= $2::date AND t.date < $3::date + interval '1 day'`;
      params.push(startDate, endDate);
    }

    dateQuery += ` GROUP BY t.type`;

    const periodResult = await query(dateQuery, params);

    periodResult.rows.forEach(row => {
      const amount = parseFloat(row.total);
      if (row.type === 'income') income += amount;
      if (row.type === 'expense') expense += amount;
    });

    // 3. Calculate Expenses and Income by Category
    let categoryQuery = `
      SELECT c.name, t.type, SUM(t.amount) as total
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      JOIN accounts a ON t.account_id = a.id
      WHERE a.user_id = $1
    `;
    const catParams: any[] = [userId];

    if (startDate && endDate) {
      categoryQuery += ` AND t.date >= $2::date AND t.date < $3::date + interval '1 day'`;
      catParams.push(startDate, endDate);
    }
    
    categoryQuery += ` GROUP BY c.name, t.type`;
    
    const catResult = await query(categoryQuery, catParams);
    
    const expensesByCategory = catResult.rows
      .filter(r => r.type === 'expense')
      .map(r => ({ name: r.name, value: parseFloat(r.total) }));
      
    const incomeByCategory = catResult.rows
      .filter(r => r.type === 'income')
      .map(r => ({ name: r.name, value: parseFloat(r.total) }));

    // 4. Calculate Monthly Balance (Last 6 months)
    const monthlyQuery = `
      SELECT 
        TO_CHAR(t.date, 'YYYY-MM') as month,
        SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as income,
        SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as expense
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      WHERE a.user_id = $1
      GROUP BY TO_CHAR(t.date, 'YYYY-MM')
      ORDER BY month DESC
      LIMIT 6
    `;
    const monthlyResult = await query(monthlyQuery, [userId]);
    const monthlyBalance = monthlyResult.rows.reverse().map(r => ({
      name: r.month,
      income: parseFloat(r.income),
      expense: parseFloat(r.expense)
    }));

    res.status(200).json({
      bankTotal,
      ccDebt,
      income,
      expense,
      expensesByCategory,
      incomeByCategory,
      monthlyBalance
    });

  } catch (error) {
    console.error('Get dashboard stats error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

import { Request, Response } from 'express';
import { query } from '../db';

export const getInsights = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { startDate, endDate } = req.query; // Usually current month
    
    // We need to calculate the previous month's date range based on the provided range
    // But for simplicity, we can do it directly in SQL using interval '1 month' 
    // if we assume startDate and endDate span exactly one month.
    
    // 1. Current period totals
    const currentResult = await query(`
      SELECT 
        SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as total_expense,
        SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as total_income
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      WHERE a.user_id = $1 AND t.date >= $2::date AND t.date < $3::date + interval '1 day'
    `, [userId, startDate, endDate]);

    const currentExpense = parseFloat(currentResult.rows[0].total_expense || '0');
    const currentIncome = parseFloat(currentResult.rows[0].total_income || '0');

    // 2. Previous period totals (assume exact same length minus 1 month)
    // We'll calculate the date range manually in JS to be safe
    const prevStart = new Date(startDate as string);
    prevStart.setMonth(prevStart.getMonth() - 1);
    
    const prevEnd = new Date(endDate as string);
    prevEnd.setMonth(prevEnd.getMonth() - 1);
    
    // Set to end of month if it overflowed
    if (prevEnd.getDate() !== new Date(endDate as string).getDate()) {
        prevEnd.setDate(0);
    }
    const prevStartDate = prevStart.toISOString().split('T')[0];
    const prevEndDate = prevEnd.toISOString().split('T')[0];

    const prevResult = await query(`
      SELECT 
        SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as total_expense,
        SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as total_income
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      WHERE a.user_id = $1 AND t.date >= $2::date AND t.date < $3::date + interval '1 day'
    `, [userId, prevStartDate, prevEndDate]);

    const prevExpense = parseFloat(prevResult.rows[0].total_expense || '0');
    const prevIncome = parseFloat(prevResult.rows[0].total_income || '0');

    // 3. Budgets total (to compare expense against total budget)
    const budgetResult = await query(`
      SELECT SUM(limit_amount) as total_budget
      FROM budgets
      WHERE user_id = $1
    `, [userId]);
    const totalBudget = parseFloat(budgetResult.rows[0].total_budget || '0');

    // 4. Group by category type (just standard categories, we don't have fixed/variable flag yet)
    // We'll just return top 3 expense categories
    const topCategories = await query(`
      SELECT c.name, SUM(t.amount) as total
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      JOIN categories c ON t.category_id = c.id
      WHERE a.user_id = $1 AND t.date >= $2::date AND t.date < $3::date + interval '1 day' AND t.type = 'expense'
      GROUP BY c.id
      ORDER BY total DESC
      LIMIT 3
    `, [userId, startDate, endDate]);

    res.status(200).json({
      current: {
        expense: currentExpense,
        income: currentIncome
      },
      previous: {
        expense: prevExpense,
        income: prevIncome
      },
      ratios: {
        expenseToIncome: currentIncome > 0 ? (currentExpense / currentIncome) * 100 : 0,
        monthOverMonthExpense: prevExpense > 0 ? ((currentExpense - prevExpense) / prevExpense) * 100 : 0,
        budgetUsed: totalBudget > 0 ? (currentExpense / totalBudget) * 100 : 0
      },
      topCategories: topCategories.rows.map(r => ({ name: r.name, amount: parseFloat(r.total) }))
    });

  } catch (error) {
    console.error('Get insights error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

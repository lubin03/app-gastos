import { Request, Response } from 'express';
import { query } from '../db';
import { decrypt } from '../utils/crypto';
import { computeInvoicePeriod, getOrCreateInvoice } from '../utils/billingCycle';

export const getCreditCardsSummary = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    // Fetch all credit card accounts
    const ccResult = await query(`
      SELECT id, name_encrypted, icon, credit_limit, closing_day, due_day, network 
      FROM accounts 
      WHERE user_id = $1 AND type = 'credit_card'
    `, [userId]);

    const cards = [];

    for (const row of ccResult.rows) {
      // Calculate unpaid expenses (current invoice / balance)
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
        available: limit > 0 ? limit - consumed : 0,
        closing_day: row.closing_day,
        due_day: row.due_day,
        network: row.network
      });
    }

    res.status(200).json(cards);
  } catch (error) {
    console.error('Get credit cards summary error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCreditCardInvoices = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    // Validate ownership
    const ccResult = await query('SELECT id, closing_day, due_day FROM accounts WHERE id = $1 AND user_id = $2 AND type = $3', [id, userId, 'credit_card']);
    if (ccResult.rowCount === 0) {
      return res.status(404).json({ error: 'Credit card not found' });
    }

    const card = ccResult.rows[0];

    // Query all invoices for this card with total expenses computed
    const invoicesResult = await query(`
      SELECT 
        ci.id, 
        ci.month, 
        ci.year, 
        ci.status,
        COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as total_amount,
        COALESCE(SUM(CASE WHEN t.type = 'expense' AND t.paid = TRUE THEN t.amount ELSE 0 END), 0) as paid_amount,
        COUNT(t.id) as transaction_count
      FROM credit_card_invoices ci
      LEFT JOIN transactions t ON t.invoice_id = ci.id AND t.account_id = ci.account_id
      WHERE ci.account_id = $1
      GROUP BY ci.id, ci.month, ci.year, ci.status
      ORDER BY ci.year DESC, ci.month DESC
    `, [id]);

    // Ensure current period invoice exists
    const now = new Date();
    const currentPeriod = computeInvoicePeriod(now, card.closing_day);
    const hasCurrent = invoicesResult.rows.some(
      inv => inv.month === currentPeriod.month && inv.year === currentPeriod.year
    );

    if (!hasCurrent) {
      const newInvId = await getOrCreateInvoice(id, currentPeriod.month, currentPeriod.year, 'open');
      invoicesResult.rows.unshift({
        id: newInvId,
        month: currentPeriod.month,
        year: currentPeriod.year,
        status: 'open',
        total_amount: '0',
        paid_amount: '0',
        transaction_count: '0'
      });
    }

    const invoices = invoicesResult.rows.map(inv => ({
      id: inv.id,
      month: inv.month,
      year: inv.year,
      status: inv.status,
      total_amount: parseFloat(inv.total_amount || '0'),
      paid_amount: parseFloat(inv.paid_amount || '0'),
      transaction_count: parseInt(inv.transaction_count || '0', 10),
      is_current: inv.month === currentPeriod.month && inv.year === currentPeriod.year
    }));

    res.status(200).json(invoices);
  } catch (error) {
    console.error('Get credit card invoices error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCreditCardTransactions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    const { month, year, invoice_id, all } = req.query;

    // Validate ownership
    const ccResult = await query('SELECT id, closing_day, due_day FROM accounts WHERE id = $1 AND user_id = $2 AND type = $3', [id, userId, 'credit_card']);
    if (ccResult.rowCount === 0) {
      return res.status(404).json({ error: 'Credit card not found' });
    }

    const card = ccResult.rows[0];
    let queryParams: any[] = [id];
    let whereClause = 'WHERE t.account_id = $1';

    if (invoice_id) {
      queryParams.push(invoice_id);
      whereClause += ` AND t.invoice_id = $${queryParams.length}`;
    } else if (month && year) {
      const m = parseInt(month as string, 10);
      const y = parseInt(year as string, 10);
      queryParams.push(m, y);
      whereClause += ` AND ci.month = $${queryParams.length - 1} AND ci.year = $${queryParams.length}`;
    } else if (all !== 'true') {
      // Default: fetch the current open invoice or latest month
      const currentPeriod = computeInvoicePeriod(new Date(), card.closing_day);
      queryParams.push(currentPeriod.month, currentPeriod.year);
      whereClause += ` AND ((ci.month = $${queryParams.length - 1} AND ci.year = $${queryParams.length}) OR (t.invoice_id IS NULL AND t.paid = FALSE))`;
    }

    const result = await query(`
      SELECT 
        t.*, 
        c.name as category_name,
        ci.month as invoice_month,
        ci.year as invoice_year,
        ci.status as invoice_status
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN credit_card_invoices ci ON t.invoice_id = ci.id
      ${whereClause}
      ORDER BY t.paid ASC, t.date DESC
    `, queryParams);

    const transactions = result.rows.map(row => ({
      id: row.id,
      amount: parseFloat(row.amount),
      date: row.date,
      description: row.description_encrypted ? decrypt(row.description_encrypted) : '',
      category_name: row.category_name,
      type: row.type,
      paid: row.paid,
      invoice_id: row.invoice_id,
      invoice_month: row.invoice_month,
      invoice_year: row.invoice_year,
      invoice_status: row.invoice_status
    }));

    res.status(200).json(transactions);
  } catch (error) {
    console.error('Get credit card transactions error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const moveTransactionInvoice = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { txId } = req.params;
    const { month, year, direction } = req.body;

    // Validate that transaction belongs to an account owned by user
    const txResult = await query(`
      SELECT t.id, t.account_id, t.date, t.invoice_id, a.closing_day, ci.month, ci.year
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      LEFT JOIN credit_card_invoices ci ON t.invoice_id = ci.id
      WHERE t.id = $1 AND a.user_id = $2 AND a.type = 'credit_card'
    `, [txId, userId]);

    if (txResult.rowCount === 0) {
      return res.status(404).json({ error: 'Credit card transaction not found' });
    }

    const tx = txResult.rows[0];
    let targetMonth: number;
    let targetYear: number;

    if (month && year) {
      targetMonth = parseInt(month, 10);
      targetYear = parseInt(year, 10);
    } else {
      // Calculate current assigned month/year
      let curMonth = tx.month;
      let curYear = tx.year;
      if (!curMonth || !curYear) {
        const period = computeInvoicePeriod(tx.date, tx.closing_day);
        curMonth = period.month;
        curYear = period.year;
      }

      if (direction === 'prev') {
        targetMonth = curMonth - 1;
        targetYear = curYear;
        if (targetMonth < 1) {
          targetMonth = 12;
          targetYear -= 1;
        }
      } else {
        // default: next
        targetMonth = curMonth + 1;
        targetYear = curYear;
        if (targetMonth > 12) {
          targetMonth = 1;
          targetYear += 1;
        }
      }
    }

    const newInvoiceId = await getOrCreateInvoice(tx.account_id, targetMonth, targetYear, 'open');

    await query('UPDATE transactions SET invoice_id = $1 WHERE id = $2', [newInvoiceId, txId]);

    res.status(200).json({
      message: 'Transaction invoice updated',
      transaction_id: txId,
      invoice_id: newInvoiceId,
      month: targetMonth,
      year: targetYear
    });
  } catch (error) {
    console.error('Move transaction invoice error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

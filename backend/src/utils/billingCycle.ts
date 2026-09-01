import { query } from '../db';

/**
 * Computes which credit card invoice month/year an expense belongs to, based on the account's closing day.
 * If date day > closingDay, it rolls over to the following month (and increments year if December).
 */
export function computeInvoicePeriod(
  dateInput: string | Date,
  closingDay: number | null
): { month: number; year: number } {
  const d = new Date(dateInput);
  let month = d.getUTCMonth() + 1; // 1-12
  let year = d.getUTCFullYear();
  const day = d.getUTCDate();

  if (closingDay && closingDay > 0 && day > closingDay) {
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return { month, year };
}

/**
 * Gets an existing invoice for an account and period, or creates it if it doesn't exist.
 */
export async function getOrCreateInvoice(
  accountId: string,
  month: number,
  year: number,
  status: 'open' | 'closed' | 'paid' = 'open'
): Promise<string> {
  const existing = await query(
    'SELECT id FROM credit_card_invoices WHERE account_id = $1 AND month = $2 AND year = $3',
    [accountId, month, year]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }

  const result = await query(
    'INSERT INTO credit_card_invoices (account_id, month, year, status) VALUES ($1, $2, $3, $4) RETURNING id',
    [accountId, month, year, status]
  );

  return result.rows[0].id;
}

import { Request, Response } from 'express';
import * as xlsx from 'xlsx';
import { query } from '../db';
import { encrypt, decrypt } from '../utils/crypto';

// Helper to parse DD/MM/YYYY to Date string YYYY-MM-DD
const parseDate = (dateStr: string | number) => {
  if (typeof dateStr === 'number') {
    // Excel serial date
    const d = new Date(Math.round((dateStr - 25569) * 86400 * 1000));
    return d.toISOString();
  }
  if (typeof dateStr === 'string') {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  return new Date().toISOString();
};

export const importTransactions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data: any[] = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    if (data.length < 2) {
      return res.status(400).json({ error: 'Empty file' });
    }

    const headers = data[0] as string[];
    const requiredHeaders = ['Fecha', 'Descripción', 'Valor', 'Cuenta', 'Situación', 'Categoria'];
    
    // Quick validation
    for (const h of requiredHeaders) {
      if (!headers.includes(h)) {
         return res.status(400).json({ error: `Missing required column: ${h}` });
      }
    }

    const headerMap = headers.reduce((acc, h, i) => { acc[h] = i; return acc; }, {} as any);

    // Fetch existing accounts
    const accRes = await query('SELECT id, name_encrypted, type FROM accounts WHERE user_id = $1', [userId]);
    const accounts = accRes.rows.map(r => ({ id: r.id, name: decrypt(r.name_encrypted), type: r.type }));

    // Fetch existing categories
    const catRes = await query('SELECT id, name, parent_id FROM categories WHERE user_id = $1', [userId]);
    const categories = catRes.rows;

    let imported = 0;

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      const rawDate = row[headerMap['Fecha']];
      const desc = row[headerMap['Descripción']] || '';
      const val = parseFloat(row[headerMap['Valor']]) || 0;
      const cuentaName = row[headerMap['Cuenta']] || 'Default';
      const situacion = row[headerMap['Situación']] || '';
      const catName = row[headerMap['Categoria']] || 'General';
      const subCatName = row[headerMap['Subcategoria']];
      const tags = row[headerMap['Etiquetas']] || '';
      const tipoCuentaCol = row[headerMap['TipoCuenta']] || '';
      const esFatura = row[headerMap['EsFaturaCartao']] === true || row[headerMap['EsFaturaCartao']] === 'true';

      // Skip card bill payment rows (isFaturaCartao) — they are the "Pago de Factura" transfer
      // that will be handled as a transfer in the Transferencias sheet instead.
      if (esFatura) continue;

      if (val === 0 && !desc) continue; // skip empty rows

      const isExpense = val < 0;
      const amount = Math.abs(val);
      const type = isExpense ? 'expense' : 'income';
      const dateStr = parseDate(rawDate);

      // Match or Create Account
      let accountId = null;
      let accType = 'debit';
      let accountMatch = accounts.find(a => a.name.toLowerCase() === cuentaName.toLowerCase());
      if (accountMatch) {
        accountId = accountMatch.id;
        accType = accountMatch.type;
      } else {
        // Use explicit TipoCuenta column if present, else heuristic on name
        if (tipoCuentaCol === 'credit_card' || tipoCuentaCol === 'debit') {
          accType = tipoCuentaCol;
        } else {
          accType = cuentaName.toLowerCase().includes('tarjeta') || cuentaName.toLowerCase().includes('visa') || cuentaName.toLowerCase().includes('mastercard') || cuentaName.toLowerCase().includes('amex') ? 'credit_card' : 'debit';
        }
        const newAccRes = await query(
          'INSERT INTO accounts (user_id, name_encrypted, type) VALUES ($1, $2, $3) RETURNING id',
          [userId, encrypt(cuentaName), accType]
        );
        accountId = newAccRes.rows[0].id;
        accounts.push({ id: accountId, name: cuentaName, type: accType }); // cache it
      }

      let paid = true;
      if (situacion && situacion.trim() !== '') {
        paid = situacion.toLowerCase() === 'pago';
      } else {
        paid = accType !== 'credit_card';
      }

      // Match or Create Category
      let categoryId = null;
      let catMatch = categories.find(c => c.name.toLowerCase() === catName.toLowerCase() && !c.parent_id);
      if (catMatch) {
        categoryId = catMatch.id;
      } else {
        const newCatRes = await query(
          'INSERT INTO categories (user_id, name, type) VALUES ($1, $2, $3) RETURNING id',
          [userId, catName, type]
        );
        categoryId = newCatRes.rows[0].id;
        categories.push({ id: categoryId, name: catName, parent_id: null }); // cache it
      }

      // Match or Create Subcategory
      if (subCatName) {
        let subMatch = categories.find(c => c.name.toLowerCase() === subCatName.toLowerCase() && c.parent_id === categoryId);
        if (subMatch) {
          categoryId = subMatch.id; // use subcat id for transaction
        } else {
          const newSubRes = await query(
            'INSERT INTO categories (user_id, name, type, parent_id) VALUES ($1, $2, $3, $4) RETURNING id',
            [userId, subCatName, type, categoryId]
          );
          const subId = newSubRes.rows[0].id;
          categories.push({ id: subId, name: subCatName, parent_id: categoryId }); // cache it
          categoryId = subId;
        }
      }

      // Insert transaction
      await query(
        `INSERT INTO transactions 
         (account_id, amount, category_id, date, description_encrypted, tags_encrypted, type, paid) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [accountId, amount, categoryId, dateStr, desc ? encrypt(desc) : null, tags ? encrypt(tags) : null, type, paid]
      );
      
      imported++;
    }

    // Now process Transfers if the sheet exists
    const transferSheetName = workbook.SheetNames.find(s => s.toLowerCase().includes('transferencia'));
    if (transferSheetName) {
      const transferSheet = workbook.Sheets[transferSheetName];
      const transferData: any[] = xlsx.utils.sheet_to_json(transferSheet, { header: 1 });
      
      if (transferData.length >= 2) {
        const tHeaders = transferData[0] as string[];
        const tHeaderMap = tHeaders.reduce((acc, h, i) => { acc[h] = i; return acc; }, {} as any);
        
        for (let i = 1; i < transferData.length; i++) {
          const row = transferData[i];
          if (!row || row.length === 0) continue;
          
          const rawDate = row[tHeaderMap['Fecha']];
          const originName = row[tHeaderMap['Conta origem']];
          const destName = row[tHeaderMap['Conta destino']];
          const val = parseFloat(row[tHeaderMap['Valor']]) || 0;
          const tags = row[tHeaderMap['Etiquetas']] || '';
          const tipoCuentaOrigen = row[tHeaderMap['TipoCuentaOrigen']] || '';
          const tipoCuentaDestino = row[tHeaderMap['TipoCuentaDestino']] || '';
          
          if (val === 0 || !originName || !destName) continue;
          
          const dateStr = parseDate(rawDate);
          
          // Helper to get or create account — respects explicit type column
          const getOrCreateAccount = async (name: string, typeHint: string) => {
            let accountMatch = accounts.find(a => a.name.toLowerCase() === name.toLowerCase());
            if (accountMatch) return accountMatch.id;
            
            let type: string;
            if (typeHint === 'credit_card') {
              type = 'credit_card';
            } else {
              type = name.toLowerCase().includes('tarjeta') || name.toLowerCase().includes('visa') || name.toLowerCase().includes('mastercard') || name.toLowerCase().includes('amex') ? 'credit_card' : 'debit';
            }
            const newAccRes = await query(
              'INSERT INTO accounts (user_id, name_encrypted, type) VALUES ($1, $2, $3) RETURNING id',
              [userId, encrypt(name), type]
            );
            const id = newAccRes.rows[0].id;
            accounts.push({ id, name, type });
            return id;
          };
          
          const originId = await getOrCreateAccount(originName, tipoCuentaOrigen);
          const destId = await getOrCreateAccount(destName, tipoCuentaDestino);
          
          // Match or create category 'Transferencia'
          let categoryId = null;
          const catName = 'Transferencia';
          let catMatch = categories.find(c => c.name.toLowerCase() === catName.toLowerCase());
          if (catMatch) {
            categoryId = catMatch.id;
          } else {
            const newCatRes = await query(
              'INSERT INTO categories (user_id, name, type) VALUES ($1, $2, $3) RETURNING id',
              [userId, catName, 'transfer']
            );
            categoryId = newCatRes.rows[0].id;
            categories.push({ id: categoryId, name: catName, parent_id: null });
          }

          // Insert transfer
          await query(
            `INSERT INTO transactions 
             (account_id, destination_account_id, amount, category_id, date, tags_encrypted, type, paid) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [originId, destId, Math.abs(val), categoryId, dateStr, tags ? encrypt(tags) : null, 'transfer', true]
          );
          
          imported++;
        }
      }
    }

    res.status(200).json({ message: `Successfully imported ${imported} transactions` });
  } catch (error) {
    console.error('Import error', error);
    res.status(500).json({ error: 'Failed to import file' });
  }
};

export const exportTransactions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    // Fetch transactions with account and category names
    const result = await query(`
      SELECT 
        t.date, t.description_encrypted, t.amount, t.type, t.paid, t.tags_encrypted,
        a.name_encrypted as account_name,
        c.name as category_name, c.parent_id as cat_parent_id
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      JOIN categories c ON t.category_id = c.id
      WHERE a.user_id = $1
      ORDER BY t.date DESC
    `, [userId]);

    // We need all categories to find parent names if needed
    const catRes = await query('SELECT id, name FROM categories WHERE user_id = $1', [userId]);
    const catMap = catRes.rows.reduce((acc, c) => { acc[c.id] = c.name; return acc; }, {} as any);

    const rows = result.rows.map(r => {
      const isExpense = r.type === 'expense';
      const valor = isExpense ? -Number(r.amount) : Number(r.amount);
      const desc = r.description_encrypted ? decrypt(r.description_encrypted) : '';
      const tags = r.tags_encrypted ? decrypt(r.tags_encrypted) : '';
      const accName = r.account_name ? decrypt(r.account_name) : '';
      
      let cat = r.category_name;
      let subcat = '';
      if (r.cat_parent_id) {
         subcat = r.category_name;
         cat = catMap[r.cat_parent_id] || '';
      }

      const d = new Date(r.date);
      const dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear()}`;

      return {
        'Fecha': dateStr,
        'Descripción': desc,
        'Valor': valor,
        'Cuenta': accName,
        'Situación': r.paid ? 'Pago' : 'Pendiente',
        'Categoria': cat,
        'Subcategoria': subcat,
        'Etiquetas': tags
      };
    });

    const worksheet = xlsx.utils.json_to_sheet(rows);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Transacciones');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="Transacciones.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.status(200).send(buffer);
  } catch (error) {
    console.error('Export error', error);
    res.status(500).json({ error: 'Failed to export file' });
  }
};

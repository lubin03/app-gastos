import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { query } from '../db';
import { encrypt, decrypt } from '../utils/crypto';

export const createMagicTransaction = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { text, audioBase64, imageBase64, mimeType } = req.body;

    if (!text && !audioBase64 && !imageBase64) {
      return res.status(400).json({ error: 'Text, Audio, or Image is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in the server' });
    }

    // 1. Fetch user's accounts
    const accResult = await query('SELECT id, name_encrypted, type FROM accounts WHERE user_id = $1', [userId]);
    const accounts = accResult.rows.map(r => ({
      id: r.id,
      name: decrypt(r.name_encrypted),
      type: r.type
    }));

    if (accounts.length === 0) {
      return res.status(400).json({ error: 'You need at least one account to create a transaction' });
    }

    // 2. Fetch user's categories
    const catResult = await query('SELECT id, name FROM categories WHERE user_id = $1 AND parent_id IS NULL', [userId]);
    const categories = catResult.rows.map(r => r.name);

    // 3. Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-8b' });

    // 4. Construct Prompt
    const prompt = `
You are a financial assistant parsing a user's input into a transaction JSON.
${text ? `User input: "${text}"` : audioBase64 ? 'User provided an audio recording of their input in Spanish. Please transcribe and listen carefully to the exact numbers.' : 'User provided an image of a receipt or ticket. Please extract the total amount, what was bought, and determine the appropriate category.'}

Available Accounts:
${accounts.map(a => `- ${a.name} (ID: ${a.id}, Type: ${a.type})`).join('\n')}

Existing Categories:
${categories.length > 0 ? categories.join(', ') : 'None yet.'}

Instructions:
1. Extract the "amount" as a positive number. Be extremely precise with the numbers mentioned in the audio (e.g. "diez mil" = 10000).
2. Extract the "description" (a short summary of what was bought or earned).
3. Determine if it's an 'expense' or 'income' ("type").
4. Determine the "account_id" from the Available Accounts. If the user mentions "tarjeta", pick a credit_card account. If they don't specify, pick the first account (${accounts[0].id}).
5. Determine a suitable "category_name". If it perfectly matches an Existing Category, use it. If not, invent a short, logical category name (e.g. "Comida", "Transporte", "Sueldo").
6. Determine if it's "paid" (boolean). (Credit card expenses are usually paid=false if it's debt, but just default to true for debit, false for credit card).
7. Transcribe the user's audio exactly into the "transcript" field (if image, just summarize the items bought). CRITICAL: If the input is unintelligible, silent, or if the image does NOT contain a valid receipt/invoice, you MUST write "SILENCE" (for audio) or "INVALID_IMAGE" (for images) in the transcript field. DO NOT invent or guess transactions. NEVER output default values like 25000.
8. Return ONLY a valid raw JSON object, without markdown formatting like \`\`\`json.

Format exactly like this:
{
  "amount": 1500,
  "description": "Hamburguesa",
  "type": "expense",
  "account_id": "uuid-here",
  "category_name": "Comida",
  "paid": true,
  "transcript": "Ayer gasté mil quinientos en una hamburguesa"
}
`;

    // 5. Call Gemini
    const parts: any[] = [{ text: prompt }];
    if (audioBase64 && mimeType) {
      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: audioBase64
        }
      });
    } else if (imageBase64 && mimeType) {
      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: imageBase64
        }
      });
    }

    const result = await model.generateContent(parts);
    let responseText = result.response.text().trim();
    
    // Clean markdown if Gemini accidentally includes it
    if (responseText.startsWith('```json')) {
      responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    }

    let parsed;
    try {
      parsed = JSON.parse(responseText);
      console.log('Gemini Transcript:', parsed.transcript);
      if (parsed.transcript === 'SILENCE' || parsed.transcript === 'INVALID_IMAGE') {
        return res.status(400).json({ error: 'No se pudo entender el audio o la imagen proporcionada. Intenta nuevamente.' });
      }
    } catch (err) {
      console.error('Failed to parse Gemini JSON:', responseText);
      return res.status(500).json({ error: 'AI failed to parse the transaction properly' });
    }

    // 6. Resolve Category
    let categoryId = null;
    const categoryName = parsed.category_name || 'General';
    const exactCat = catResult.rows.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
    
    if (exactCat) {
      categoryId = exactCat.id;
    } else {
      // Create new category
      const typeForCat = parsed.type === 'expense' || parsed.type === 'income' ? parsed.type : 'expense';
      const newCatRes = await query(
        'INSERT INTO categories (user_id, name, type) VALUES ($1, $2, $3) RETURNING id',
        [userId, categoryName, typeForCat]
      );
      categoryId = newCatRes.rows[0].id;
    }

    // 7. Insert Transaction
    const dateStr = new Date().toISOString().split('T')[0]; // Current date
    const descEncrypted = parsed.description ? encrypt(parsed.description) : null;
    const account = accounts.find(a => a.id === parsed.account_id) || accounts[0];
    const isPaid = account.type === 'credit_card' ? false : true;

    const txRes = await query(
      `INSERT INTO transactions 
       (account_id, amount, category_id, date, description_encrypted, type, paid) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [account.id, parsed.amount, categoryId, dateStr, descEncrypted, parsed.type, isPaid]
    );

    const row = txRes.rows[0];
    res.status(201).json({
      id: row.id,
      account_id: row.account_id,
      amount: row.amount,
      category_id: row.category_id,
      date: row.date,
      description: row.description_encrypted ? decrypt(row.description_encrypted) : '',
      type: row.type,
      paid: row.paid,
      created_at: row.created_at,
      _magic_category_name: categoryName, // useful for frontend feedback
      _magic_account_name: account.name
    });

  } catch (error: any) {
    console.error('Magic transaction error', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

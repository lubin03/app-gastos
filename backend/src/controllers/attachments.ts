import { Request, Response } from 'express';
import { query } from '../db';

export const uploadAttachment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { transactionId } = req.body;
    const file = req.file;

    if (!transactionId) {
      return res.status(400).json({ error: 'transactionId is required' });
    }

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Verify transaction belongs to user
    const txCheck = await query(
      'SELECT t.id FROM transactions t JOIN accounts a ON t.account_id = a.id WHERE t.id = $1 AND a.user_id = $2',
      [transactionId, userId]
    );

    if (txCheck.rowCount === 0) {
      return res.status(404).json({ error: 'Transaction not found or unauthorized' });
    }

    const result = await query(
      'INSERT INTO transaction_attachments (transaction_id, filename, content_type, data) VALUES ($1, $2, $3, $4) RETURNING id, filename, content_type, created_at',
      [transactionId, file.originalname, file.mimetype, file.buffer]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Upload attachment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAttachment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    // Verify attachment belongs to user's transaction
    const result = await query(`
      SELECT ta.data, ta.content_type, ta.filename 
      FROM transaction_attachments ta
      JOIN transactions t ON ta.transaction_id = t.id
      JOIN accounts a ON t.account_id = a.id
      WHERE ta.id = $1 AND a.user_id = $2
    `, [id, userId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    const attachment = result.rows[0];
    
    res.setHeader('Content-Type', attachment.content_type);
    res.setHeader('Content-Disposition', `inline; filename="${attachment.filename}"`);
    res.send(attachment.data);
  } catch (error) {
    console.error('Get attachment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAttachmentsByTransaction = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { transactionId } = req.params;

    // Verify transaction belongs to user
    const txCheck = await query(
      'SELECT t.id FROM transactions t JOIN accounts a ON t.account_id = a.id WHERE t.id = $1 AND a.user_id = $2',
      [transactionId, userId]
    );

    if (txCheck.rowCount === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const result = await query(
      'SELECT id, filename, content_type, created_at FROM transaction_attachments WHERE transaction_id = $1 ORDER BY created_at DESC',
      [transactionId]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Get attachments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteAttachment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    // Verify and delete
    const result = await query(`
      DELETE FROM transaction_attachments ta
      USING transactions t, accounts a
      WHERE ta.transaction_id = t.id AND t.account_id = a.id
      AND ta.id = $1 AND a.user_id = $2
      RETURNING ta.id
    `, [id, userId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    res.status(200).json({ message: 'Attachment deleted successfully' });
  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

import { Request, Response } from 'express';
import { query } from '../db';

export const getCategories = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const result = await query('SELECT * FROM categories WHERE user_id = $1 ORDER BY created_at ASC', [userId]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Get categories error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { name, type, parent_id, icon } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }

    const result = await query(
      'INSERT INTO categories (user_id, name, type, parent_id, icon) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, name, type, parent_id || null, icon || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create category error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    const { name, type, parent_id, icon } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }

    const result = await query(
      'UPDATE categories SET name = $1, type = $2, parent_id = $3, icon = $4 WHERE id = $5 AND user_id = $6 RETURNING *',
      [name, type, parent_id || null, icon || null, id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Update category error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const result = await query(
      'DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.status(200).json({ message: 'Category deleted' });
  } catch (error) {
    console.error('Delete category error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

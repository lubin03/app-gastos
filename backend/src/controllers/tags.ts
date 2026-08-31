import { Request, Response } from 'express';
import { query } from '../db';

export const getTags = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const result = await query(
      'SELECT id, name, created_at FROM tags WHERE user_id = $1 ORDER BY name ASC',
      [userId]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Get tags error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createTag = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Name is required' });
    }

    const cleanName = name.trim();

    // Check if tag already exists for user
    const existing = await query('SELECT id FROM tags WHERE user_id = $1 AND name = $2', [userId, cleanName]);
    if (existing.rowCount > 0) {
      // Just return the existing tag
      const result = await query('SELECT id, name, created_at FROM tags WHERE id = $1', [existing.rows[0].id]);
      return res.status(200).json(result.rows[0]);
    }

    const result = await query(
      'INSERT INTO tags (user_id, name) VALUES ($1, $2) RETURNING id, name, created_at',
      [userId, cleanName]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create tag error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteTag = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const existing = await query('SELECT id FROM tags WHERE id = $1 AND user_id = $2', [id, userId]);

    if (existing.rowCount === 0) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    await query('DELETE FROM tags WHERE id = $1', [id]);
    res.status(200).json({ message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Delete tag error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

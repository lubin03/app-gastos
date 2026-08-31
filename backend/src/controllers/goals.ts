import { Request, Response } from 'express';
import { query } from '../db';
import { encrypt, decrypt } from '../utils/crypto';

export const getGoals = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const result = await query('SELECT * FROM goals WHERE user_id = $1 ORDER BY created_at ASC', [userId]);
    
    const goals = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      target_amount: parseFloat(row.target_amount),
      current_amount: parseFloat(row.current_amount),
      deadline: row.deadline,
      icon: row.icon,
      created_at: row.created_at
    }));

    res.status(200).json(goals);
  } catch (error) {
    console.error('Get goals error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createGoal = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { name, target_amount, current_amount, deadline, icon } = req.body;

    if (!name || target_amount === undefined) {
      return res.status(400).json({ error: 'Name and target_amount are required' });
    }

    const result = await query(
      'INSERT INTO goals (user_id, name, target_amount, current_amount, deadline, icon) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [userId, name, target_amount, current_amount || 0, deadline || null, icon || null]
    );

    const row = result.rows[0];
    res.status(201).json({
      id: row.id,
      name: row.name,
      target_amount: parseFloat(row.target_amount),
      current_amount: parseFloat(row.current_amount),
      deadline: row.deadline,
      icon: row.icon,
      created_at: row.created_at
    });
  } catch (error) {
    console.error('Create goal error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateGoal = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    const { name, target_amount, current_amount, deadline, icon } = req.body;

    const result = await query(
      'UPDATE goals SET name = COALESCE($1, name), target_amount = COALESCE($2, target_amount), current_amount = COALESCE($3, current_amount), deadline = $4, icon = COALESCE($5, icon) WHERE id = $6 AND user_id = $7 RETURNING *',
      [name, target_amount, current_amount, deadline || null, icon, id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const row = result.rows[0];
    res.status(200).json({
      id: row.id,
      name: row.name,
      target_amount: parseFloat(row.target_amount),
      current_amount: parseFloat(row.current_amount),
      deadline: row.deadline,
      icon: row.icon,
      created_at: row.created_at
    });
  } catch (error) {
    console.error('Update goal error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteGoal = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const result = await query('DELETE FROM goals WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.status(200).json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Delete goal error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

import { Request, Response } from 'express';
import { query } from '../db';

export const getInstitutions = async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM banking_institutions ORDER BY name ASC');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Get institutions error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

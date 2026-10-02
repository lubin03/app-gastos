import { Router } from 'express';
import { getInsights } from '../controllers/insights';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', getInsights);

export default router;

import { Router } from 'express';
import { getInsights } from '../controllers/insights';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getInsights);

export default router;

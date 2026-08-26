import { Router } from 'express';
import { getDailyEvolution, getMonthlyEvolution } from '../controllers/reports';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/daily', getDailyEvolution);
router.get('/monthly', getMonthlyEvolution);

export default router;

import { Router } from 'express';
import { getCreditCardsSummary, getCreditCardTransactions } from '../controllers/creditCards';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', getCreditCardsSummary);
router.get('/:id/transactions', getCreditCardTransactions);

export default router;

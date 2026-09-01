import { Router } from 'express';
import { 
  getCreditCardsSummary, 
  getCreditCardTransactions, 
  getCreditCardInvoices, 
  moveTransactionInvoice 
} from '../controllers/creditCards';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', getCreditCardsSummary);
router.get('/:id/invoices', getCreditCardInvoices);
router.get('/:id/transactions', getCreditCardTransactions);
router.put('/transactions/:txId/move', moveTransactionInvoice);

export default router;

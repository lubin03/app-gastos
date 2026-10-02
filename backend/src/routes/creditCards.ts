import { Router } from 'express';
import { 
  getCreditCardsSummary, 
  getCreditCardTransactions, 
  getCreditCardInvoices, 
  moveTransactionInvoice,
  toggleTransactionPaid,
  bulkUpdateInstallments
} from '../controllers/creditCards';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', getCreditCardsSummary);
router.get('/:id/invoices', getCreditCardInvoices);
router.get('/:id/transactions', getCreditCardTransactions);
router.patch('/:id/transactions/:txId/toggle-paid', toggleTransactionPaid);
router.put('/transactions/:txId/move', moveTransactionInvoice);
router.put('/installments/:parentId/bulk-update', bulkUpdateInstallments);

export default router;

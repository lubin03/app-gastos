import { Router } from 'express';
import { getInstitutions } from '../controllers/institutions';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', getInstitutions);

export default router;

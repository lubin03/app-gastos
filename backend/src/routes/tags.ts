import { Router } from 'express';
import { getTags, createTag, deleteTag } from '../controllers/tags';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', getTags);
router.post('/', createTag);
router.delete('/:id', deleteTag);

export default router;

import { Router } from 'express';
import multer from 'multer';
import { uploadAttachment, getAttachment, getAttachmentsByTransaction, deleteAttachment } from '../controllers/attachments';
import { requireAuth } from '../middleware/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

router.use(requireAuth);

router.post('/', upload.single('file'), uploadAttachment);
router.get('/:id', getAttachment);
router.get('/transaction/:transactionId', getAttachmentsByTransaction);
router.delete('/:id', deleteAttachment);

export default router;

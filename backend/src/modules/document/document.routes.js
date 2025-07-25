import { Router } from 'express';
import { uploadDocument, listDocuments } from './document.controller.js';
import { upload } from '../../config/multer.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

const router = Router();

// Must be logged in to upload
router.post('/upload', authMiddleware, upload.single('file'), uploadDocument);
router.get('/', authMiddleware, listDocuments);

export default router;

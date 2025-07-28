import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { adminOnly } from '../../middleware/admin.middleware.js';
import { listAuditLogs } from './audit.controller.js';

const router = Router();

router.get('/', authMiddleware, adminOnly, listAuditLogs);

export default router;
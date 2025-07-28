import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { adminOnly } from '../../middleware/admin.middleware.js';
import {
  listUsers,
  updateUserRole,
  deleteUser,
  forceLogoutUser,
  listAllDocuments
} from './admin.controller.js';

const router = Router();

router.use(authMiddleware, adminOnly);

router.get('/users', listUsers);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);
router.post('/users/:id/logout', forceLogoutUser);
router.get('/documents', listAllDocuments);

export default router;
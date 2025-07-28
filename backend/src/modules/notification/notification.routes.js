import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import {
  getUserNotifications,
  markNotificationAsRead
} from './notification.controller.js';

const router = Router();

router.get('/', authMiddleware, getUserNotifications);
router.patch('/:id/read', authMiddleware, markNotificationAsRead);

export default router;
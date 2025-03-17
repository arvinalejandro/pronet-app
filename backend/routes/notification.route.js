import express from 'express';
import {
  getUserNotification,
  markNotificationAsRead,
  deleteNotification,
} from '../controllers/notification.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protectRoute, getUserNotification);
router.put('/:id/read', protectRoute, markNotificationAsRead);
router.delete('/:id', protectRoute, deleteNotification);
export default router;

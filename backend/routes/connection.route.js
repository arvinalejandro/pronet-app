import express from 'express';
import {
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
  getConnectionRequests,
  getUserConnections,
  removeConnection,
  getConnectionStatus,
} from '../controllers/connection.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/request/:userId', protectRoute, sendConnectionRequest);
router.put('/accept/:requestId', protectRoute, acceptConnectionRequest);
router.put('/reject/:requestId', protectRoute, rejectConnectionRequest);

router.get('/requests', protectRoute, getConnectionRequests);

router.get('/', protectRoute, getUserConnections);
router.delete('/:userId', protectRoute, removeConnection);
router.get('/status/:userId', protectRoute, getConnectionStatus);

export default router;

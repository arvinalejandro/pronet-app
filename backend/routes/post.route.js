import express from 'express';
import {
  getFeedPosts,
  createPost,
  deletePost,
  getPostById,
  createComment,
  likePost,
} from '../controllers/post.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protectRoute, getFeedPosts);
router.get('/:id', protectRoute, getPostById);
router.post('/create', protectRoute, createPost);
router.post('/:id/comment', protectRoute, createComment);
router.post('/:id/like', protectRoute, likePost);
router.delete('/delete/:id', protectRoute, deletePost);

export default router;

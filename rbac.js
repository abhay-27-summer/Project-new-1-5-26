import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { searchUsers } from '../controllers/userController.js';

const router = Router();
router.use(requireAuth);
router.get('/search', searchUsers);

export default router;

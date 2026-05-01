import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { loadTask } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { updateTaskSchema } from '../validators/task.js';
import { getTask, updateTask, deleteTask } from '../controllers/taskController.js';

const router = Router();

router.use(requireAuth);

router.get('/:id', loadTask, getTask);
router.patch('/:id', loadTask, validate(updateTaskSchema), updateTask);
router.delete('/:id', loadTask, deleteTask);

export default router;

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { loadProject, requireProjectRole, requireProjectOwner } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import {
  createProjectSchema,
  updateProjectSchema,
  addMemberSchema,
  updateMemberSchema,
} from '../validators/project.js';
import {
  listProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  updateMember,
  removeMember,
} from '../controllers/projectController.js';
import {
  listProjectTasks,
  createTaskInProject,
} from '../controllers/taskController.js';
import { createTaskSchema } from '../validators/task.js';

const router = Router();

router.use(requireAuth);

router.get('/', listProjects);
router.post('/', validate(createProjectSchema), createProject);

router.get('/:id', loadProject, getProject);
router.patch('/:id', loadProject, requireProjectRole('admin'), validate(updateProjectSchema), updateProject);
router.delete('/:id', loadProject, requireProjectOwner, deleteProject);

// Members (admin only)
router.post(
  '/:id/members',
  loadProject,
  requireProjectRole('admin'),
  validate(addMemberSchema),
  addMember
);
router.patch(
  '/:id/members/:userId',
  loadProject,
  requireProjectRole('admin'),
  validate(updateMemberSchema),
  updateMember
);
router.delete(
  '/:id/members/:userId',
  loadProject,
  requireProjectRole('admin'),
  removeMember
);

// Tasks scoped to a project
router.get('/:projectId/tasks', loadProject, listProjectTasks);
router.post(
  '/:projectId/tasks',
  loadProject,
  validate(createTaskSchema),
  createTaskInProject
);

export default router;

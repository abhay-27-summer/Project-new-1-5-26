import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';

/**
 * Loads the project (from :projectId or :id) and attaches req.project + req.projectRole.
 * Used by all project-scoped routes.
 */
export const loadProject = async (req, res, next) => {
  try {
    const id = req.params.projectId || req.params.id;
    if (!id) return res.status(400).json({ message: 'Project id required' });

    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const role = project.roleOf(req.userId);
    if (!role) return res.status(403).json({ message: 'Not a member of this project' });

    req.project = project;
    req.projectRole = role;
    next();
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid project id' });
    next(err);
  }
};

/** requireProjectRole('admin') ensures the requester is an admin (or owner) */
export const requireProjectRole = (role) => (req, res, next) => {
  if (role === 'admin' && req.projectRole !== 'admin') {
    return res.status(403).json({ message: 'Admin role required' });
  }
  next();
};

/** Owner-only — for destructive actions like deleting the project */
export const requireProjectOwner = (req, res, next) => {
  if (!req.project.owner.equals(req.userId)) {
    return res.status(403).json({ message: 'Only the project owner can do this' });
  }
  next();
};

/**
 * Loads a task by :id, attaches req.task and req.project, sets req.projectRole.
 * Used by /api/tasks/:id endpoints (task id is in URL, project is derived).
 */
export const loadTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await Project.findById(task.project);
    if (!project) return res.status(404).json({ message: 'Parent project not found' });

    const role = project.roleOf(req.userId);
    if (!role) return res.status(403).json({ message: 'Not a member of this project' });

    req.task = task;
    req.project = project;
    req.projectRole = role;
    next();
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid task id' });
    next(err);
  }
};

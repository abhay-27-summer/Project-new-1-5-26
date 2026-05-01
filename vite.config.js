import { Task, TASK_STATUSES } from '../models/Task.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// GET /api/projects/:projectId/tasks
export const listProjectTasks = asyncHandler(async (req, res) => {
  const { status, assignee } = req.query;
  const filter = { project: req.project._id };
  if (status && TASK_STATUSES.includes(status)) filter.status = status;
  if (assignee) filter.assignee = assignee === 'me' ? req.userId : assignee;

  const tasks = await Task.find(filter)
    .sort({ createdAt: -1 })
    .populate('assignee', 'name email')
    .populate('createdBy', 'name email');
  res.json({ tasks });
});

// POST /api/projects/:projectId/tasks
export const createTaskInProject = asyncHandler(async (req, res) => {
  const body = req.body;

  // If assignee specified, verify they're a member of the project
  if (body.assignee) {
    const isMember =
      req.project.owner.equals(body.assignee) ||
      req.project.members.some((m) => m.user.equals(body.assignee));
    if (!isMember) return res.status(400).json({ message: 'Assignee must be a project member' });
  }

  const task = await Task.create({
    ...body,
    project: req.project._id,
    createdBy: req.userId,
  });
  await task.populate('assignee', 'name email');
  await task.populate('createdBy', 'name email');
  res.status(201).json({ task });
});

// GET /api/tasks/:id
export const getTask = asyncHandler(async (req, res) => {
  await req.task.populate('assignee', 'name email');
  await req.task.populate('createdBy', 'name email');
  res.json({ task: req.task });
});

/**
 * PATCH /api/tasks/:id
 * Permission rules:
 *   - Admins: can edit anything
 *   - Members: can update status on tasks they're assigned to or that they created.
 *              Other field edits (title, description, assignee, dueDate, priority)
 *              require admin role.
 */
export const updateTask = asyncHandler(async (req, res) => {
  const isAdmin = req.projectRole === 'admin';
  const isAssignee = req.task.assignee && req.task.assignee.equals(req.userId);
  const isCreator = req.task.createdBy.equals(req.userId);

  const body = req.body;
  const adminOnlyFields = ['title', 'description', 'assignee', 'dueDate', 'priority'];
  const touchingAdminOnly = adminOnlyFields.some((f) => body[f] !== undefined);

  if (touchingAdminOnly && !isAdmin) {
    return res.status(403).json({
      message: 'Only admins can edit task details. Members may only update status.',
    });
  }
  if (body.status !== undefined && !isAdmin && !isAssignee && !isCreator) {
    return res
      .status(403)
      .json({ message: 'Only the assignee, creator, or an admin can change status' });
  }

  // If assignee is being changed, verify membership
  if (body.assignee) {
    const isMember =
      req.project.owner.equals(body.assignee) ||
      req.project.members.some((m) => m.user.equals(body.assignee));
    if (!isMember) return res.status(400).json({ message: 'Assignee must be a project member' });
  }

  Object.assign(req.task, body);
  await req.task.save();
  await req.task.populate('assignee', 'name email');
  await req.task.populate('createdBy', 'name email');
  res.json({ task: req.task });
});

// DELETE /api/tasks/:id  — admin or original creator
export const deleteTask = asyncHandler(async (req, res) => {
  const isAdmin = req.projectRole === 'admin';
  const isCreator = req.task.createdBy.equals(req.userId);
  if (!isAdmin && !isCreator) {
    return res.status(403).json({ message: 'Only admins or the creator can delete this task' });
  }
  await req.task.deleteOne();
  res.json({ ok: true });
});

import { Task } from '../models/Task.js';
import { Project } from '../models/Project.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getDashboard = asyncHandler(async (req, res) => {
  // All projects I'm part of
  const projects = await Project.find({
    $or: [{ owner: req.userId }, { 'members.user': req.userId }],
  }).select('_id name');

  const projectIds = projects.map((p) => p._id);

  // Tasks assigned to me across those projects
  const myTasks = await Task.find({
    project: { $in: projectIds },
    assignee: req.userId,
  })
    .sort({ dueDate: 1, createdAt: -1 })
    .populate('project', 'name')
    .limit(50);

  // Status breakdown across my tasks
  const statusCounts = { todo: 0, in_progress: 0, done: 0 };
  myTasks.forEach((t) => {
    statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
  });

  const now = new Date();
  const overdue = myTasks.filter(
    (t) => t.dueDate && t.dueDate < now && t.status !== 'done'
  );

  // Project-wide totals (so admins see the whole picture)
  const allProjectTasks = await Task.aggregate([
    { $match: { project: { $in: projectIds } } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const projectStatusCounts = { todo: 0, in_progress: 0, done: 0 };
  allProjectTasks.forEach((r) => {
    projectStatusCounts[r._id] = r.count;
  });

  res.json({
    summary: {
      projectCount: projects.length,
      myTaskCount: myTasks.length,
      overdueCount: overdue.length,
      myStatusCounts: statusCounts,
      projectStatusCounts,
    },
    myTasks,
    overdueTasks: overdue,
    projects,
  });
});

import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// GET /api/users/search?q=ali
export const searchUsers = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json({ users: [] });

  const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const users = await User.find({
    $or: [{ name: regex }, { email: regex }],
  })
    .limit(10)
    .select('name email');

  res.json({ users });
});

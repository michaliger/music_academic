import mongoose from 'mongoose';
import { Progress } from '../models/index.js';

export const emptyStats = { xp: 0, completed: 0, lastActive: null };

/** Progress totals (xp, completed lessons, last activity) for a list of user ids, keyed by id. */
export async function statsFor(ids) {
  if (!ids.length) return {};
  const objectIds = ids.map((id) => new mongoose.Types.ObjectId(String(id)));
  const rows = await Progress.aggregate([
    { $match: { userId: { $in: objectIds } } },
    { $group: { _id: '$userId', xp: { $sum: '$xp' }, completed: { $sum: { $cond: ['$completed', 1, 0] } }, lastActive: { $max: '$updatedAt' } } },
  ]);
  return Object.fromEntries(rows.map((r) => [String(r._id), { xp: r.xp, completed: r.completed, lastActive: r.lastActive }]));
}

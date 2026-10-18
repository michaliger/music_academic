import mongoose from 'mongoose';
import { Progress } from '../models.js';

export const emptyStats = { xp: 0, completed: 0, lastActive: null };
const oids = (ids) => ids.map((i) => new mongoose.Types.ObjectId(String(i)));

/** סטטיסטיקות התקדמות (xp, שיעורים שהושלמו, פעילות אחרונה) לרשימת משתמשים */
export async function statsFor(ids) {
  if (!ids.length) return {};
  const rows = await Progress.aggregate([
    { $match: { userId: { $in: oids(ids) } } },
    { $group: { _id: '$userId', xp: { $sum: '$xp' }, completed: { $sum: { $cond: ['$completed', 1, 0] } }, lastActive: { $max: '$updatedAt' } } },
  ]);
  return Object.fromEntries(rows.map((r) => [String(r._id), { xp: r.xp, completed: r.completed, lastActive: r.lastActive }]));
}

import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { User, Prompt, Progress, Lesson, Classroom, ROLES, populatePrompt, shapePrompt } from '../models.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { validate, idParam } from '../middleware/error.js';
import { statsFor, emptyStats } from '../services/stats.js';

const r = Router();
r.use(requireAuth, requireAdmin);
r.param('id', idParam);
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

r.get('/overview', async (_req, res, next) => {
  try {
    const [users, teachers, classes, lessons, completions, prompts] = await Promise.all([
      User.countDocuments(), User.countDocuments({ role: 'teacher' }), Classroom.countDocuments(), Lesson.countDocuments(),
      Progress.countDocuments({ completed: true }), Prompt.countDocuments(),
    ]);
    res.json({ users, teachers, classes, lessons, completions, prompts });
  } catch (e) { next(e); }
});

// GET /api/admin/users?page=1&limit=10&search=...&role=...
r.get('/users', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const search = String(req.query.search || '').trim();
    const filter = {};
    if (search) filter.$or = [{ name: new RegExp(escapeRegex(search), 'i') }, { phone: new RegExp(escapeRegex(search)) }];
    if (ROLES.includes(req.query.role)) filter.role = req.query.role;
    const [total, users] = await Promise.all([User.countDocuments(filter), User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)]);
    const ids = users.map((u) => u._id);
    const [stats, counts] = await Promise.all([statsFor(ids), Prompt.aggregate([{ $match: { userId: { $in: ids } } }, { $group: { _id: '$userId', n: { $sum: 1 } } }])]);
    const pc = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));
    res.json({ total, page, pages: Math.ceil(total / limit), users: users.map((u) => ({ ...u.toJSON(), ...(stats[u.id] || emptyStats), promptCount: pc[u.id] || 0 })) });
  } catch (e) { next(e); }
});

r.patch('/users/:id/role', validate(z.object({ role: z.enum(ROLES) })), async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) throw Object.assign(new Error('אי אפשר לשנות את התפקיד של עצמך'), { status: 400 });
    const u = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true });
    if (!u) throw Object.assign(new Error('משתמשת לא נמצאה'), { status: 404 });
    res.json(u.toJSON());
  } catch (e) { next(e); }
});

r.get('/users/:id/prompts', async (req, res, next) => {
  try { res.json((await Prompt.find({ userId: req.params.id }).sort({ createdAt: -1 }).populate(populatePrompt)).map(shapePrompt)); } catch (e) { next(e); }
});

r.get('/classes', async (_req, res, next) => {
  try {
    const list = await Classroom.find().populate('teacherId', 'name').sort({ createdAt: -1 });
    res.json(list.map((c) => ({ id: c.id, name: c.name, teacher: c.teacherId?.name, code: c.code, studentCount: c.studentIds.length })));
  } catch (e) { next(e); }
});

export default r;

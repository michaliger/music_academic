import { Router } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { Classroom, User, Lesson } from '../models.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate, idParam } from '../middleware/error.js';
import { statsFor, emptyStats } from '../services/stats.js';

const err = (status, m) => Object.assign(new Error(m), { status });
const manages = (cls, user) => user.role === 'admin' || String(cls.teacherId) === user.id;
const r = Router();
r.use(requireAuth);
r.param('id', idParam);
r.param('sid', idParam);

async function loadManaged(req) {
  const cls = await Classroom.findById(req.params.id);
  if (!cls) throw err(404, 'הכיתה לא נמצאה');
  if (!manages(cls, req.user)) throw err(403, 'אין הרשאה');
  return cls;
}

// הכיתות שלי: כמורה (או מנהלת) וכתלמידה
r.get('/', async (req, res, next) => {
  try {
    const me = req.user.id;
    const filter = req.user.role === 'admin' ? {} : { $or: [{ teacherId: me }, { studentIds: me }] };
    const list = await Classroom.find(filter).populate('teacherId', 'name').sort({ createdAt: -1 });
    res.json(list.map((c) => ({ id: c.id, name: c.name, teacher: c.teacherId?.name, studentCount: c.studentIds.length, canManage: manages(c, req.user), code: manages(c, req.user) ? c.code : undefined })));
  } catch (e) { next(e); }
});

r.post('/', requireRole('teacher', 'admin'), validate(z.object({ name: z.string().trim().min(2, 'שם קצר מדי').max(80) })), async (req, res, next) => {
  try {
    const cls = await Classroom.create({ name: req.body.name, teacherId: req.user.id, code: crypto.randomBytes(3).toString('hex').toUpperCase() });
    res.status(201).json({ id: cls.id, name: cls.name, code: cls.code });
  } catch (e) { next(e); }
});

r.post('/join', validate(z.object({ code: z.string().trim().min(4).max(12) })), async (req, res, next) => {
  try {
    const cls = await Classroom.findOneAndUpdate({ code: req.body.code.toUpperCase() }, { $addToSet: { studentIds: req.user.id } }, { new: true });
    if (!cls) throw err(404, 'קוד כיתה לא נכון');
    res.json({ id: cls.id, name: cls.name });
  } catch (e) { next(e); }
});

// התקדמות כל התלמידות בכיתה (מורת הכיתה או מנהלת)
r.get('/:id/progress', async (req, res, next) => {
  try {
    const cls = await loadManaged(req);
    const [students, totalLessons, stats] = await Promise.all([User.find({ _id: { $in: cls.studentIds } }).sort({ name: 1 }), Lesson.countDocuments(), statsFor(cls.studentIds)]);
    res.json({
      class: { id: cls.id, name: cls.name, code: cls.code }, totalLessons,
      students: students.map((u) => { const s = stats[u.id] || emptyStats; return { id: u.id, name: u.name, phone: u.phone, ...s, percent: totalLessons ? Math.round((100 * s.completed) / totalLessons) : 0 }; }),
    });
  } catch (e) { next(e); }
});

r.delete('/:id/students/:sid', async (req, res, next) => {
  try { const cls = await loadManaged(req); await cls.updateOne({ $pull: { studentIds: req.params.sid } }); res.json({ ok: true }); } catch (e) { next(e); }
});

r.delete('/:id', async (req, res, next) => {
  try { const cls = await loadManaged(req); await cls.deleteOne(); res.json({ ok: true }); } catch (e) { next(e); }
});

export default r;

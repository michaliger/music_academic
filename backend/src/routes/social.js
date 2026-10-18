import { Router } from 'express';
import { z } from 'zod';
import { User, Friendship } from '../models.js';
import { requireAuth } from '../middleware/auth.js';
import { validate, idParam } from '../middleware/error.js';
import { statsFor, emptyStats } from '../services/stats.js';

const err = (status, m) => Object.assign(new Error(m), { status });
const r = Router();
r.use(requireAuth);
r.param('id', idParam);

// חברות, בקשות ולוח דירוג בין חברות
r.get('/', async (req, res, next) => {
  try {
    const me = req.user.id;
    const fs = await Friendship.find({ $or: [{ fromId: me }, { toId: me }] });
    const other = (f) => String(String(f.fromId) === me ? f.toId : f.fromId);
    const ids = [...new Set([me, ...fs.map(other)])];
    const [users, stats] = await Promise.all([User.find({ _id: { $in: ids } }), statsFor(ids)]);
    const name = Object.fromEntries(users.map((u) => [u.id, u.name]));
    const card = (id) => ({ id, name: name[id], ...(stats[id] || emptyStats) });
    const friends = fs.filter((f) => f.status === 'accepted').map((f) => ({ friendshipId: f.id, ...card(other(f)) }));
    res.json({
      friends,
      leaderboard: [...friends, { ...card(me), isMe: true }].sort((a, b) => b.xp - a.xp),
      incoming: fs.filter((f) => f.status === 'pending' && String(f.toId) === me).map((f) => ({ friendshipId: f.id, name: name[String(f.fromId)] })),
      outgoing: fs.filter((f) => f.status === 'pending' && String(f.fromId) === me).map((f) => ({ friendshipId: f.id, name: name[String(f.toId)] })),
    });
  } catch (e) { next(e); }
});

r.post('/', validate(z.object({ phone: z.string().regex(/^0\d{8,9}$/, 'מספר טלפון לא תקין') })), async (req, res, next) => {
  try {
    const me = req.user.id;
    const target = await User.findOne({ phone: req.body.phone });
    if (!target) throw err(404, 'לא נמצאה משתמשת עם הטלפון הזה. אפשר להזמין אותה להצטרף!');
    if (String(target._id) === me) throw err(400, 'אי אפשר להוסיף את עצמך');
    const ex = await Friendship.findOne({ $or: [{ fromId: me, toId: target._id }, { fromId: target._id, toId: me }] });
    if (ex) {
      if (ex.status === 'pending' && String(ex.toId) === me) { ex.status = 'accepted'; await ex.save(); return res.json({ message: `אתן חברות עכשיו: ${target.name} 🎉` }); }
      throw err(409, 'כבר קיימת חברות או בקשה פתוחה');
    }
    await Friendship.create({ fromId: me, toId: target._id });
    res.status(201).json({ message: 'בקשת החברות נשלחה' });
  } catch (e) { next(e); }
});

r.post('/:id/accept', async (req, res, next) => {
  try {
    const f = await Friendship.findOneAndUpdate({ _id: req.params.id, toId: req.user.id, status: 'pending' }, { status: 'accepted' });
    if (!f) throw err(404, 'הבקשה לא נמצאה');
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ביטול בקשה, דחייה או הסרת חברה
r.delete('/:id', async (req, res, next) => {
  try {
    await Friendship.deleteOne({ _id: req.params.id, $or: [{ fromId: req.user.id }, { toId: req.user.id }] });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default r;

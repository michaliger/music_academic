import { User, Friendship } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';
import { statsFor, emptyStats } from '../services/stats.service.js';

/** Friends, pending requests and a leaderboard (friends + me, ranked by XP). */
export const getFriends = asyncHandler(async (req, res) => {
  const me = req.user.id;
  const all = await Friendship.find({ $or: [{ fromId: me }, { toId: me }] });
  const otherId = (f) => String(String(f.fromId) === me ? f.toId : f.fromId);
  const ids = [...new Set([me, ...all.map(otherId)])];

  const [users, stats] = await Promise.all([User.find({ _id: { $in: ids } }), statsFor(ids)]);
  const nameOf = Object.fromEntries(users.map((u) => [u.id, u.name]));
  const card = (id) => ({ id, name: nameOf[id], ...(stats[id] || emptyStats) });

  const friends = all.filter((f) => f.status === 'accepted').map((f) => ({ friendshipId: f.id, ...card(otherId(f)) }));
  const pending = all.filter((f) => f.status === 'pending');
  res.json({
    friends,
    leaderboard: [...friends, { ...card(me), isMe: true }].sort((a, b) => b.xp - a.xp),
    incoming: pending.filter((f) => String(f.toId) === me).map((f) => ({ friendshipId: f.id, name: nameOf[String(f.fromId)] })),
    outgoing: pending.filter((f) => String(f.fromId) === me).map((f) => ({ friendshipId: f.id, name: nameOf[String(f.toId)] })),
  });
});

/** Friend request by e-mail. If the other side already asked me, both become friends. */
export const sendRequest = asyncHandler(async (req, res) => {
  const me = req.user.id;
  const target = await User.findOne({ email: req.body.email });
  if (!target) throw httpError(404, 'לא נמצאה משתמשת עם המייל הזה. אפשר להזמין אותה להצטרף!');
  if (String(target._id) === me) throw httpError(400, 'אי אפשר להוסיף את עצמך');

  const existing = await Friendship.findOne({ $or: [{ fromId: me, toId: target._id }, { fromId: target._id, toId: me }] });
  if (existing) {
    if (existing.status !== 'pending' || String(existing.toId) !== me) throw httpError(409, 'כבר קיימת חברות או בקשה פתוחה');
    existing.status = 'accepted';
    await existing.save();
    return res.json({ message: `אתן חברות עכשיו: ${target.name} 🎉` });
  }
  await Friendship.create({ fromId: me, toId: target._id });
  res.status(201).json({ message: 'בקשת החברות נשלחה' });
});

export const acceptRequest = asyncHandler(async (req, res) => {
  const updated = await Friendship.findOneAndUpdate({ _id: req.params.id, toId: req.user.id, status: 'pending' }, { status: 'accepted' });
  if (!updated) throw httpError(404, 'הבקשה לא נמצאה');
  res.json({ ok: true });
});

/** Cancel / decline a request or remove a friend. */
export const removeFriendship = asyncHandler(async (req, res) => {
  await Friendship.deleteOne({ _id: req.params.id, $or: [{ fromId: req.user.id }, { toId: req.user.id }] });
  res.json({ ok: true });
});

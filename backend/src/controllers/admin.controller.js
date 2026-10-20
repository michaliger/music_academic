import { User, Prompt, Progress, Lesson, Classroom, PROMPT_POPULATE, toPromptDto } from '../models/index.js';
import { ROLES } from '../utils/constants.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';
import { statsFor, emptyStats } from '../services/stats.service.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getOverview = asyncHandler(async (_req, res) => {
  const [users, teachers, classes, lessons, completions, prompts] = await Promise.all([
    User.countDocuments(), User.countDocuments({ role: 'teacher' }), Classroom.countDocuments(), Lesson.countDocuments(),
    Progress.countDocuments({ completed: true }), Prompt.countDocuments(),
  ]);
  res.json({ users, teachers, classes, lessons, completions, prompts });
});

/** GET /admin/users?page=1&limit=10&search=...&role=... (paginated, searchable, filterable). */
export const listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  const search = String(req.query.search || '').trim();

  const filter = {};
  if (search) filter.$or = [{ name: new RegExp(escapeRegex(search), 'i') }, { phone: new RegExp(escapeRegex(search)) }];
  if (ROLES.includes(req.query.role)) filter.role = req.query.role;

  const [total, users] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
  ]);
  const ids = users.map((u) => u._id);
  const [stats, promptCounts] = await Promise.all([
    statsFor(ids), Prompt.aggregate([{ $match: { userId: { $in: ids } } }, { $group: { _id: '$userId', n: { $sum: 1 } } }]),
  ]);
  const promptsOf = Object.fromEntries(promptCounts.map((c) => [String(c._id), c.n]));

  res.json({
    total, page, pages: Math.ceil(total / limit),
    users: users.map((u) => ({ ...u.toJSON(), ...(stats[u.id] || emptyStats), promptCount: promptsOf[u.id] || 0 })),
  });
});

export const setRole = asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) throw httpError(400, 'אי אפשר לשנות את התפקיד של עצמך');
  const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true });
  if (!user) throw httpError(404, 'משתמשת לא נמצאה');
  res.json(user.toJSON());
});

export const getUserPrompts = asyncHandler(async (req, res) => {
  const prompts = await Prompt.find({ userId: req.params.id }).sort({ createdAt: -1 }).populate(PROMPT_POPULATE);
  res.json(prompts.map(toPromptDto));
});

export const listAllClasses = asyncHandler(async (_req, res) => {
  const classes = await Classroom.find().populate('teacherId', 'name').sort({ createdAt: -1 });
  res.json(classes.map((c) => ({ id: c.id, name: c.name, teacher: c.teacherId?.name, code: c.code, studentCount: c.studentIds.length })));
});

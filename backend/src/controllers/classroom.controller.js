import crypto from 'crypto';
import { Classroom, User, Lesson } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';
import { statsFor, emptyStats } from '../services/stats.service.js';

const canManage = (classroom, user) => user.role === 'admin' || String(classroom.teacherId) === user.id;

/** Loads a class and checks that the current user (its teacher, or an admin) may manage it. */
async function loadManaged(req) {
  const classroom = await Classroom.findById(req.params.id);
  if (!classroom) throw httpError(404, 'הכיתה לא נמצאה');
  if (!canManage(classroom, req.user)) throw httpError(403, 'אין הרשאה');
  return classroom;
}

/** My classes: as a teacher (or all classes for an admin) and as a student. */
export const listClasses = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { $or: [{ teacherId: req.user.id }, { studentIds: req.user.id }] };
  const classes = await Classroom.find(filter).populate('teacherId', 'name').sort({ createdAt: -1 });
  res.json(classes.map((c) => {
    const manage = canManage(c, req.user);
    return { id: c.id, name: c.name, teacher: c.teacherId?.name, studentCount: c.studentIds.length, canManage: manage, code: manage ? c.code : undefined };
  }));
});

export const createClass = asyncHandler(async (req, res) => {
  const code = crypto.randomBytes(3).toString('hex').toUpperCase();
  const classroom = await Classroom.create({ name: req.body.name, teacherId: req.user.id, code });
  res.status(201).json({ id: classroom.id, name: classroom.name, code });
});

export const joinClass = asyncHandler(async (req, res) => {
  const classroom = await Classroom.findOneAndUpdate({ code: req.body.code.toUpperCase() }, { $addToSet: { studentIds: req.user.id } }, { new: true });
  if (!classroom) throw httpError(404, 'קוד כיתה לא נכון');
  res.json({ id: classroom.id, name: classroom.name });
});

/** Progress of every student in the class. */
export const getClassProgress = asyncHandler(async (req, res) => {
  const classroom = await loadManaged(req);
  const [students, totalLessons, stats] = await Promise.all([
    User.find({ _id: { $in: classroom.studentIds } }).sort({ name: 1 }), Lesson.countDocuments(), statsFor(classroom.studentIds),
  ]);
  res.json({
    class: { id: classroom.id, name: classroom.name, code: classroom.code },
    totalLessons,
    students: students.map((u) => {
      const s = stats[u.id] || emptyStats;
      return { id: u.id, name: u.name, phone: u.phone, ...s, percent: totalLessons ? Math.round((100 * s.completed) / totalLessons) : 0 };
    }),
  });
});

export const removeStudent = asyncHandler(async (req, res) => {
  const classroom = await loadManaged(req);
  await classroom.updateOne({ $pull: { studentIds: req.params.sid } });
  res.json({ ok: true });
});

export const deleteClass = asyncHandler(async (req, res) => {
  await (await loadManaged(req)).deleteOne();
  res.json({ ok: true });
});

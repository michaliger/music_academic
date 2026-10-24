import { Category, SubCategory, Lesson, Progress, User } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';
import { statsFor, emptyStats } from '../services/stats.service.js';
import { logActivity, activityFor } from '../services/activity.service.js';

const PASS_SCORE = 60; // % needed to complete a lesson
const byOrder = (a, b) => (a.order ?? 999) - (b.order ?? 999);
const sameId = (a, b) => String(a) === String(b);

async function findLesson(id) {
  const lesson = await Lesson.findById(id);
  if (!lesson) throw httpError(404, 'השיעור לא נמצא');
  return lesson;
}

/** Categories with their sub-categories (used by the AI tutor form). */
export const listCategories = asyncHandler(async (_req, res) => {
  const [cats, subs] = await Promise.all([Category.find(), SubCategory.find()]);
  res.json(cats.sort(byOrder).map((c) => ({
    ...c.toJSON(),
    subCategories: subs.filter((s) => sameId(s.categoryId, c._id)).sort(byOrder).map((s) => s.toJSON()),
  })).filter((c) => c.subCategories.length)); // old categories without units cannot be asked about
});

/** The learning map: course -> unit -> lessons, flagged with the user's progress. */
export const getCourses = asyncHandler(async (req, res) => {
  const [cats, subs, lessons, completed, me, stats] = await Promise.all([
    Category.find(), SubCategory.find(), Lesson.find().select('-blocks -quiz'),
    Progress.find({ userId: req.user.id, completed: true }), User.findById(req.user.id), statsFor([req.user.id]),
  ]);
  const scoreOf = Object.fromEntries(completed.map((p) => [String(p.lessonId), p.bestScore]));
  const courses = cats.sort(byOrder).map((c) => ({
    ...c.toJSON(),
    subCategories: subs.filter((s) => sameId(s.categoryId, c._id)).sort(byOrder).map((s) => ({
      ...s.toJSON(),
      lessons: lessons.filter((l) => sameId(l.subCategoryId, s._id)).sort(byOrder)
        .map((l) => ({ ...l.toJSON(), done: String(l._id) in scoreOf, score: scoreOf[String(l._id)] })),
    })).filter((s) => s.lessons.length),
  })).filter((c) => c.subCategories.length);
  res.json({ courses, lastLessonId: me?.lastLessonId ? String(me.lastLessonId) : null, ...(stats[req.user.id] || emptyStats) });
});

/** Lesson content (quiz answers stripped). Also remembers it as the user's last visited lesson. */
export const getLesson = asyncHandler(async (req, res) => {
  const lesson = await findLesson(req.params.id);
  const unit = await SubCategory.findById(lesson.subCategoryId).populate('categoryId', 'name');
  const [next, progress] = await Promise.all([
    Lesson.findOne({ subCategoryId: lesson.subCategoryId, order: { $gt: lesson.order } }).sort({ order: 1 }).select('_id'),
    Progress.findOneAndUpdate({ userId: req.user.id, lessonId: lesson._id }, { $setOnInsert: { completed: false } }, { upsert: true, new: true }),
  ]);
  await User.updateOne({ _id: req.user.id }, { lastLessonId: lesson._id });
  logActivity(req.user.id, 'lesson', lesson.title);
  res.json({
    ...lesson.toJSON(),
    quiz: lesson.quiz.map(({ q, o, p }) => ({ q, o, p })),
    unit: { id: unit.id, name: unit.name },
    course: { id: unit.categoryId.id, name: unit.categoryId.name },
    nextId: next ? String(next._id) : null,
    progress: { completed: progress.completed, bestScore: progress.bestScore },
  });
});

/** Instant feedback for one answer while the student is taking the quiz. */
export const checkAnswer = asyncHandler(async (req, res) => {
  const question = (await findLesson(req.params.id)).quiz[req.body.index];
  if (!question) throw httpError(404, 'השאלה לא נמצאה');
  res.json({ correct: req.body.answer === question.a, answer: question.a, explain: question.e });
});

/** Grades the whole quiz. XP is awarded once, on the first pass. */
export const submitQuiz = asyncHandler(async (req, res) => {
  const lesson = await findLesson(req.params.id);
  const { answers } = req.body;
  if (answers.length !== lesson.quiz.length) throw httpError(400, 'יש לענות על כל השאלות');

  const results = lesson.quiz.map((q, i) => ({ correct: answers[i] === q.a, answer: q.a, explain: q.e }));
  const score = Math.round((100 * results.filter((r) => r.correct).length) / results.length);
  const progress = (await Progress.findOne({ userId: req.user.id, lessonId: lesson._id })) || new Progress({ userId: req.user.id, lessonId: lesson._id });

  progress.attempts += 1;
  progress.bestScore = Math.max(progress.bestScore, score);
  let xpGained = 0;
  if (score >= PASS_SCORE && !progress.completed) { progress.completed = true; progress.xp = lesson.xp; xpGained = lesson.xp; }
  await progress.save();
  logActivity(req.user.id, 'quiz', lesson.title, { score, xp: xpGained });

  res.json({ score, passed: score >= PASS_SCORE, xpGained, results });
});

/** The student's own activity: streak, totals and a day-by-day log. */
export const myActivity = asyncHandler(async (req, res) => res.json(await activityFor(req.user.id)));

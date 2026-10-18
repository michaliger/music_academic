import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Category, SubCategory, Lesson, Progress, Prompt, User, populatePrompt, shapePrompt } from '../models.js';
import { requireAuth } from '../middleware/auth.js';
import { validate, idParam } from '../middleware/error.js';
import { generateLesson } from '../services/ai.js';
import { statsFor, emptyStats } from '../services/stats.js';

const objectId = z.string().refine(mongoose.isValidObjectId, 'מזהה לא תקין');
const promptSchema = z.object({ categoryId: objectId, subCategoryId: objectId, prompt: z.string().trim().min(3, 'הבקשה קצרה מדי').max(1000) });
const quizSchema = z.object({ answers: z.array(z.number().int().min(0).max(9)).min(1).max(20) });
const byOrder = (a, b) => (a.order ?? 999) - (b.order ?? 999);
const notFound = (m) => Object.assign(new Error(m), { status: 404 });
const r = Router();
r.param('id', idParam);

// כל הקטגוריות (לשאלות ל-AI)
r.get('/categories', async (_req, res, next) => {
  try {
    const [cats, subs] = await Promise.all([Category.find(), SubCategory.find()]);
    res.json(cats.sort(byOrder).map((c) => ({ ...c.toJSON(), subCategories: subs.filter((s) => String(s.categoryId) === String(c._id)).sort(byOrder).map((s) => s.toJSON()) })));
  } catch (e) { next(e); }
});

// מפת הלימוד עם ההתקדמות של המשתמשת
r.get('/courses', requireAuth, async (req, res, next) => {
  try {
    const [cats, subs, lessons, prog, me, stats] = await Promise.all([
      Category.find(), SubCategory.find(), Lesson.find().select('-blocks -quiz'),
      Progress.find({ userId: req.user.id, completed: true }), User.findById(req.user.id), statsFor([req.user.id]),
    ]);
    const done = Object.fromEntries(prog.map((x) => [String(x.lessonId), x.bestScore]));
    const courses = cats.sort(byOrder).map((c) => ({
      ...c.toJSON(),
      subCategories: subs.filter((s) => String(s.categoryId) === String(c._id)).sort(byOrder).map((s) => ({
        ...s.toJSON(),
        lessons: lessons.filter((l) => String(l.subCategoryId) === String(s._id)).sort(byOrder).map((l) => ({ ...l.toJSON(), done: String(l._id) in done, score: done[String(l._id)] })),
      })).filter((s) => s.lessons.length),
    })).filter((c) => c.subCategories.length);
    res.json({ courses, lastLessonId: me?.lastLessonId ? String(me.lastLessonId) : null, ...(stats[req.user.id] || emptyStats) });
  } catch (e) { next(e); }
});

r.get('/lessons/:id', requireAuth, async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) throw notFound('השיעור לא נמצא');
    const unit = await SubCategory.findById(lesson.subCategoryId).populate('categoryId', 'name');
    const [nextL, progress] = await Promise.all([
      Lesson.findOne({ subCategoryId: lesson.subCategoryId, order: { $gt: lesson.order } }).sort({ order: 1 }).select('_id'),
      Progress.findOneAndUpdate({ userId: req.user.id, lessonId: lesson._id }, { $setOnInsert: { completed: false } }, { upsert: true, new: true }),
    ]);
    await User.updateOne({ _id: req.user.id }, { lastLessonId: lesson._id });
    res.json({
      ...lesson.toJSON(), quiz: lesson.quiz.map(({ q, o }) => ({ q, o })),
      unit: { id: unit.id, name: unit.name }, course: { id: unit.categoryId.id, name: unit.categoryId.name },
      nextId: nextL ? String(nextL._id) : null,
      progress: { completed: progress.completed, bestScore: progress.bestScore },
    });
  } catch (e) { next(e); }
});

// בדיקת החידון בצד השרת; 60% ומעלה משלים את השיעור ומעניק XP (פעם אחת)
r.post('/lessons/:id/quiz', requireAuth, validate(quizSchema), async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) throw notFound('השיעור לא נמצא');
    const { answers } = req.body;
    if (answers.length !== lesson.quiz.length) throw Object.assign(new Error('יש לענות על כל השאלות'), { status: 400 });
    const results = lesson.quiz.map((qz, i) => ({ correct: answers[i] === qz.a, answer: qz.a, explain: qz.e }));
    const score = Math.round((100 * results.filter((x) => x.correct).length) / results.length);
    const prog = (await Progress.findOne({ userId: req.user.id, lessonId: lesson._id })) || new Progress({ userId: req.user.id, lessonId: lesson._id });
    prog.attempts += 1; prog.bestScore = Math.max(prog.bestScore, score);
    let xpGained = 0;
    if (score >= 60 && !prog.completed) { prog.completed = true; prog.xp = lesson.xp; xpGained = lesson.xp; }
    await prog.save();
    res.json({ score, passed: score >= 60, xpGained, results });
  } catch (e) { next(e); }
});

r.post('/prompts', requireAuth, validate(promptSchema), async (req, res, next) => {
  try {
    const { categoryId, subCategoryId, prompt } = req.body;
    const sub = await SubCategory.findOne({ _id: subCategoryId, categoryId }).populate('categoryId', 'name');
    if (!sub) throw notFound('קטגוריה או תת-קטגוריה לא קיימות');
    const response = await generateLesson({ category: sub.categoryId.name, subCategory: sub.name, summary: sub.summary, prompt });
    const saved = await Prompt.create({ userId: req.user.id, categoryId, subCategoryId, prompt, response });
    res.status(201).json(shapePrompt(await saved.populate(populatePrompt)));
  } catch (e) { next(e); }
});

r.get('/prompts/me', requireAuth, async (req, res, next) => {
  try {
    res.json((await Prompt.find({ userId: req.user.id }).sort({ createdAt: -1 }).populate(populatePrompt)).map(shapePrompt));
  } catch (e) { next(e); }
});

export default r;

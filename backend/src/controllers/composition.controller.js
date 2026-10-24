import { logActivity } from '../services/activity.service.js';
import { Composition } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';
import { generateLyrics } from '../services/song.service.js';
import { analyzeComposition } from '../services/harmony.service.js';
import { mentorFeedback } from '../services/composition.service.js';

const mine = (req) => ({ _id: req.params.id, userId: req.user.id });

/** AI (or demo) lyrics for a theme. Nothing is saved: the student decides what to keep. */
export const getLyrics = asyncHandler(async (req, res) => res.json(await generateLyrics(req.body)));

/** Checks the student's chords against the chosen key. ?ai=1 adds a short mentor comment. */
export const analyze = asyncHandler(async (req, res) => {
  const result = analyzeComposition(req.body);
  if (req.query.ai === '1') result.mentor = await mentorFeedback(result);
  res.json(result);
});

export const createComposition = asyncHandler(async (req, res) => {
  const doc = await Composition.create({ ...req.body, userId: req.user.id });
  logActivity(req.user.id, 'song', doc.title);
  res.status(201).json(doc.toJSON());
});

export const listCompositions = asyncHandler(async (req, res) => {
  const list = await Composition.find({ userId: req.user.id }).sort({ updatedAt: -1 }).select('title key mode updatedAt');
  res.json(list.map((c) => c.toJSON()));
});

export const getComposition = asyncHandler(async (req, res) => {
  const composition = await Composition.findOne(mine(req));
  if (!composition) throw httpError(404, 'השיר לא נמצא');
  res.json(composition.toJSON());
});

export const updateComposition = asyncHandler(async (req, res) => {
  const composition = await Composition.findOneAndUpdate(mine(req), req.body, { new: true, runValidators: true });
  if (!composition) throw httpError(404, 'השיר לא נמצא');
  res.json(composition.toJSON());
});

export const deleteComposition = asyncHandler(async (req, res) => {
  await Composition.deleteOne(mine(req));
  res.json({ ok: true });
});

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { Song } from '../models.js';
import { requireAuth } from '../middleware/auth.js';
import { validate, idParam } from '../middleware/error.js';
import { generateSong, MOODS, GENRES } from '../services/songs.js';

const schema = z.object({
  mood: z.enum(Object.keys(MOODS)), genre: z.enum(Object.keys(GENRES)),
  theme: z.string().trim().min(2, 'כתבי נושא לשיר').max(120),
  key: z.string().regex(/^[A-G][#b]?$/, 'סולם לא תקין').optional(),
});
const r = Router();
r.use(requireAuth);
r.param('id', idParam);

r.post('/generate', rateLimit({ windowMs: 60_000, limit: 8, message: { error: 'יותר מדי בקשות, נסי שוב בעוד דקה' } }), validate(schema), async (req, res, next) => {
  try {
    const data = await generateSong(req.body);
    const song = await Song.create({ userId: req.user.id, title: data.title, params: req.body, data });
    res.status(201).json(song.toJSON());
  } catch (e) { next(e); }
});

r.get('/', async (req, res, next) => {
  try { res.json((await Song.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(30)).map((s) => s.toJSON())); } catch (e) { next(e); }
});

r.delete('/:id', async (req, res, next) => {
  try { await Song.deleteOne({ _id: req.params.id, userId: req.user.id }); res.json({ ok: true }); } catch (e) { next(e); }
});

export default r;

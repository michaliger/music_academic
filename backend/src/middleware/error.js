import mongoose from 'mongoose';
import { ZodError } from 'zod';

export const validate = (schema) => (req, _res, next) => {
  try { req.body = schema.parse(req.body); next(); } catch (e) { next(e); }
};
// לשימוש: router.param('id', idParam)
export const idParam = (_req, _res, next, v) =>
  mongoose.isValidObjectId(v) ? next() : next(Object.assign(new Error('מזהה לא תקין'), { status: 400 }));

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'קלט לא תקין', details: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })) });
  }
  if (err.code === 11000) return res.status(409).json({ error: 'הערך כבר קיים במערכת' });
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ error: status === 500 ? 'שגיאת שרת' : err.message });
}

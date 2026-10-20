import mongoose from 'mongoose';
import { httpError } from '../utils/httpError.js';

/** Validates (and replaces) req.body with the parsed Zod result. ZodErrors go to the error middleware. */
export const validate = (schema) => (req, _res, next) => {
  try { req.body = schema.parse(req.body); next(); } catch (e) { next(e); }
};

/** For router.param('id', idParam): rejects malformed ObjectIds with 400. */
export const idParam = (_req, _res, next, value) =>
  mongoose.isValidObjectId(value) ? next() : next(httpError(400, 'מזהה לא תקין'));

import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { User } from '../models/index.js';
import { httpError } from '../utils/httpError.js';

export const signToken = (user) => jwt.sign({ id: String(user._id) }, config.jwtSecret, { expiresIn: '7d' });

/** Verifies the JWT and loads the CURRENT role from the DB, so role changes apply immediately. */
export async function requireAuth(req, _res, next) {
  try {
    const { id } = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), config.jwtSecret);
    const user = await User.findById(id).select('role');
    if (!user) throw new Error('unknown user');
    req.user = { id: String(user._id), role: user.role };
    next();
  } catch {
    next(httpError(401, 'נדרשת התחברות'));
  }
}

export const requireRole = (...roles) => (req, _res, next) =>
  roles.includes(req.user?.role) ? next() : next(httpError(403, 'אין הרשאה'));
export const requireAdmin = requireRole('admin');

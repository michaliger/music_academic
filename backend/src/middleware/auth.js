import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { User } from '../models.js';

export const signToken = (u) => jwt.sign({ id: String(u._id) }, config.jwtSecret, { expiresIn: '7d' });
const fail = (status, msg) => Object.assign(new Error(msg), { status });

// התפקיד נטען מה-DB בכל בקשה, כך ששינוי תפקיד ע"י מנהלת נכנס לתוקף מיד
export async function requireAuth(req, _res, next) {
  try {
    const { id } = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), config.jwtSecret);
    const u = await User.findById(id).select('role');
    if (!u) throw new Error('no user');
    req.user = { id: String(u._id), role: u.role };
    next();
  } catch { next(fail(401, 'נדרשת התחברות')); }
}

export const requireRole = (...roles) => (req, _res, next) =>
  roles.includes(req.user?.role) ? next() : next(fail(403, 'אין הרשאה'));
export const requireAdmin = requireRole('admin');

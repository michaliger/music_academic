import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../models.js';
import { signToken } from '../middleware/auth.js';
import { validate } from '../middleware/error.js';

const phone = z.string().regex(/^0\d{8,9}$/, 'מספר טלפון ישראלי לא תקין');
const registerSchema = z.object({ name: z.string().trim().min(2, 'שם קצר מדי').max(100), phone, password: z.string().min(6, 'סיסמה של 6 תווים לפחות') });
const loginSchema = z.object({ phone, password: z.string().min(1) });
const r = Router();

r.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { name, phone, password } = req.body;
    const user = await User.create({ name, phone, passwordHash: await bcrypt.hash(password, 10) });
    res.status(201).json({ token: signToken(user), user: user.toJSON() });
  } catch (e) { next(e); }
});

r.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const user = await User.findOne({ phone: req.body.phone });
    if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) {
      const e = new Error('טלפון או סיסמה שגויים'); e.status = 401; throw e;
    }
    res.json({ token: signToken(user), user: user.toJSON() });
  } catch (e) { next(e); }
});

export default r;

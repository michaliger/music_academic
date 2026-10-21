import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import { signToken } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';

const session = (user) => ({ token: signToken(user), user: user.toJSON() });

export const register = asyncHandler(async (req, res) => {
  const { name, phone, email, password } = req.body;
  const user = await User.create({ name, phone, email, passwordHash: await bcrypt.hash(password, 10) });
  res.status(201).json(session(user));
});

export const login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ phone: req.body.phone });
  if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) throw httpError(401, 'טלפון או סיסמה שגויים');
  res.json(session(user));
});

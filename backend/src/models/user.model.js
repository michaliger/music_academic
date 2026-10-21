import mongoose from 'mongoose';
import { ROLES } from '../utils/constants.js';
import { options } from './shared.js';

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  phone: { type: String, required: true, unique: true, trim: true },
  email: { type: String, trim: true, lowercase: true, unique: true, sparse: true }, // used to find friends
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ROLES, default: 'student' },
  lastLessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }, // "continue where I stopped"
}, options('users', { timestamps: true }));

export const User = mongoose.model('User', schema);

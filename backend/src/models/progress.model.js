import mongoose from 'mongoose';
import { options, ref } from './shared.js';

// One document per (user, lesson).
const schema = new mongoose.Schema({
  userId: ref('User'),
  lessonId: ref('Lesson'),
  completed: { type: Boolean, default: false },
  bestScore: { type: Number, default: 0 },
  attempts: { type: Number, default: 0 },
  xp: { type: Number, default: 0 },
}, options('progress', { timestamps: true }));
schema.index({ userId: 1, lessonId: 1 }, { unique: true });

export const Progress = mongoose.model('Progress', schema);

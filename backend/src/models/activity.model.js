import mongoose from 'mongoose';
import { options, ref } from './shared.js';

// One document per thing a student did (opened a lesson, took a quiz, asked the teacher, saved a song): the "my activity" page is built from these.
const schema = new mongoose.Schema({
  userId: ref('User'),
  type: { type: String, enum: ['lesson', 'quiz', 'question', 'song'], required: true },
  title: { type: String, default: '' },
  score: Number,
  xp: Number,
}, options('activities', { timestamps: { createdAt: true, updatedAt: false } }));
schema.index({ userId: 1, createdAt: -1 });

export const Activity = mongoose.model('Activity', schema);

import mongoose from 'mongoose';
import { options, ref } from './shared.js';

// Lesson content (blocks) and quiz live in the DB; correct answers never leave the server.
const schema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  subCategoryId: ref('SubCategory'),
  title: { type: String, required: true },
  order: { type: Number, default: 0 },
  minutes: { type: Number, default: 8 },
  xp: { type: Number, default: 10 },
  blocks: [mongoose.Schema.Types.Mixed],
  quiz: [mongoose.Schema.Types.Mixed],
}, options('lessons'));

export const Lesson = mongoose.model('Lesson', schema);

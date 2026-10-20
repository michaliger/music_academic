import mongoose from 'mongoose';
import { options, ref } from './shared.js';

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  summary: String,
  order: Number,
  categoryId: ref('Category'),
}, options('sub_categories'));
schema.index({ categoryId: 1, name: 1 }, { unique: true });

export const SubCategory = mongoose.model('SubCategory', schema);

import mongoose from 'mongoose';
import { options } from './shared.js';

const schema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  order: Number,
}, options('categories'));

export const Category = mongoose.model('Category', schema);

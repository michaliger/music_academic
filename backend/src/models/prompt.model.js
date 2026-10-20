import mongoose from 'mongoose';
import { options, ref } from './shared.js';

// Learning history: one document per question sent to the AI tutor.
const schema = new mongoose.Schema({
  userId: ref('User'),
  categoryId: ref('Category'),
  subCategoryId: ref('SubCategory'),
  prompt: { type: String, required: true, maxlength: 1000 },
  response: { type: String, required: true },
}, options('prompts', { timestamps: { createdAt: true, updatedAt: false } }));
schema.index({ userId: 1, createdAt: -1 });

export const Prompt = mongoose.model('Prompt', schema);

export const PROMPT_POPULATE = [{ path: 'categoryId', select: 'name' }, { path: 'subCategoryId', select: 'name' }];

/** Populated prompt -> API shape with `category` / `subCategory` objects. */
export const toPromptDto = (doc) => {
  const { categoryId, subCategoryId, ...rest } = doc.toJSON();
  return { ...rest, category: categoryId, subCategory: subCategoryId };
};

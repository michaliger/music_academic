import { SubCategory, Prompt, PROMPT_POPULATE, toPromptDto } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';
import { logActivity } from '../services/activity.service.js';
import { answerPrompt, isAiEnabled } from '../services/ai.service.js';

/** Sends the user's prompt to the AI tutor and stores prompt + response in the learning history. */
export const createPrompt = asyncHandler(async (req, res) => {
  const { categoryId, subCategoryId, prompt } = req.body;
  const sub = await SubCategory.findOne({ _id: subCategoryId, categoryId }).populate('categoryId', 'name');
  if (!sub) throw httpError(404, 'קטגוריה או תת-קטגוריה לא קיימות');

  const engine = isAiEnabled() ? 'ai' : 'demo';
  const response = await answerPrompt({ category: sub.categoryId.name, subCategory: sub.name, summary: sub.summary, prompt });
  const saved = await Prompt.create({ userId: req.user.id, categoryId, subCategoryId, prompt, response });
  logActivity(req.user.id, 'question', sub.name);
  res.status(201).json({ ...toPromptDto(await saved.populate(PROMPT_POPULATE)), engine });
});

export const listMyPrompts = asyncHandler(async (req, res) => {
  const prompts = await Prompt.find({ userId: req.user.id }).sort({ createdAt: -1 }).populate(PROMPT_POPULATE);
  res.json(prompts.map(toPromptDto));
});

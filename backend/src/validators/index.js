// Zod request schemas, grouped by feature.
import mongoose from 'mongoose';
import { z } from 'zod';
import { MODES, MOODS, GENRES, ROLES } from '../utils/constants.js';

// spaces, dashes and +972 are accepted and normalised to 05XXXXXXXX
const cleanPhone = (v) => (typeof v === 'string' ? v.replace(/[\s\-().]/g, '').replace(/^\+?972/, '0') : v);
const phone = z.preprocess(cleanPhone, z.string().regex(/^0\d{8,9}$/, 'מספר טלפון ישראלי לא תקין'));
const objectId = z.string().refine(mongoose.isValidObjectId, 'מזהה לא תקין');
const noteName = z.string().regex(/^[A-G][#b]?$/, 'סולם לא תקין');

// auth
const email = z.string().trim().toLowerCase().email('כתובת מייל לא תקינה').max(120);
export const registerSchema = z.object({ name: z.string().trim().min(2, 'שם קצר מדי').max(100), phone, email, password: z.string().min(6, 'סיסמה של 6 תווים לפחות') });
export const loginSchema = z.object({ phone, password: z.string().min(1) });

// learning
export const promptSchema = z.object({ categoryId: objectId, subCategoryId: objectId, prompt: z.string().trim().min(3, 'הבקשה קצרה מדי').max(1000) });
export const answerCheckSchema = z.object({ index: z.number().int().min(0).max(30), answer: z.number().int().min(0).max(9) });
export const quizSchema = z.object({ answers: z.array(z.number().int().min(0).max(9)).min(1).max(20) });

// social
export const friendRequestSchema = z.object({ email });
export const createClassSchema = z.object({ name: z.string().trim().min(2, 'שם קצר מדי').max(80) });
export const joinClassSchema = z.object({ code: z.string().trim().min(4).max(12) });
export const roleSchema = z.object({ role: z.enum(ROLES) });

// AI studio
export const songRequestSchema = z.object({
  mood: z.enum(Object.keys(MOODS)), genre: z.enum(Object.keys(GENRES)),
  theme: z.string().trim().min(2, 'כתבי נושא לשיר').max(120), key: noteName.optional(),
});

// composition room
export const lyricsRequestSchema = z.object({ theme: z.string().trim().min(2, 'כתבי נושא לשיר').max(120), mood: z.enum(Object.keys(MOODS)) });
// A chord on a lyric line: its symbol, the word it sits above (`at`, 0-based) and how many beats it lasts.
// Plain strings (older clients/saved songs) are accepted and converted, so the database always stores objects.
const chordSchema = z.preprocess(
  (v) => (typeof v === 'string' ? { symbol: v } : v),
  z.object({ symbol: z.string().trim().min(1).max(12), at: z.number().int().min(0).max(60).default(0), beats: z.number().int().min(1).max(8).default(4) }),
);
const lineSchema = z.object({ text: z.string().max(200).default(''), chords: z.array(chordSchema).max(16) });
const sectionSchema = z.object({ name: z.string().trim().min(1).max(30), lines: z.array(lineSchema).max(20) });
export const analyzeSchema = z.object({ key: noteName, mode: z.enum(MODES), beatsPerBar: z.number().int().min(2).max(6).default(4), sections: z.array(sectionSchema).min(1).max(12) });
export const compositionSchema = analyzeSchema.extend({ title: z.string().trim().min(1, 'כתבי שם לשיר').max(100), tempo: z.number().int().min(40).max(220) });

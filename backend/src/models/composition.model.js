import mongoose from 'mongoose';
import { MODES } from '../utils/constants.js';
import { options, ref } from './shared.js';

const { Schema } = mongoose;

// A lyric line with the chords the student placed on it.
const lineSchema = new Schema({ text: { type: String, default: '', maxlength: 200 }, chords: [String] }, { _id: false });
const sectionSchema = new Schema({ name: { type: String, required: true, maxlength: 30 }, lines: [lineSchema] }, { _id: false });

const schema = new Schema({
  userId: ref('User'),
  title: { type: String, required: true, maxlength: 100 },
  key: { type: String, required: true },
  mode: { type: String, enum: MODES, required: true },
  tempo: { type: Number, min: 40, max: 220, default: 100 },
  sections: [sectionSchema],
}, options('compositions', { timestamps: true }));
schema.index({ userId: 1, updatedAt: -1 });

export const Composition = mongoose.model('Composition', schema);

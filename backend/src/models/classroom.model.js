import mongoose from 'mongoose';
import { options, ref } from './shared.js';

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  teacherId: ref('User'),
  code: { type: String, required: true, unique: true }, // join code shared with students
  studentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, options('classrooms', { timestamps: true }));

export const Classroom = mongoose.model('Classroom', schema);

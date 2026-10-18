import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const toJSON = { transform: (_d, ret) => { ret.id = String(ret._id); delete ret._id; delete ret.__v; delete ret.passwordHash; return ret; } };
const opts = (extra = {}) => ({ toJSON, ...extra });
const ref = (name) => ({ type: Schema.Types.ObjectId, ref: name, required: true });

export const ROLES = ['student', 'teacher', 'admin'];

export const User = model('User', new Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  phone: { type: String, required: true, unique: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ROLES, default: 'student' },
  lastLessonId: { type: Schema.Types.ObjectId, ref: 'Lesson' },
}, opts({ timestamps: true })));

export const Category = model('Category', new Schema({
  name: { type: String, required: true, unique: true, trim: true },
  order: Number,
}, opts()));

const subSchema = new Schema({
  name: { type: String, required: true, trim: true },
  summary: String, order: Number,
  categoryId: ref('Category'),
}, opts());
subSchema.index({ categoryId: 1, name: 1 }, { unique: true });
export const SubCategory = model('SubCategory', subSchema);

// שיעור: בלוקים של תוכן + חידון. התשובות הנכונות נשארות בשרת.
export const Lesson = model('Lesson', new Schema({
  slug: { type: String, required: true, unique: true },
  subCategoryId: ref('SubCategory'),
  title: { type: String, required: true },
  order: { type: Number, default: 0 },
  minutes: { type: Number, default: 8 },
  xp: { type: Number, default: 10 },
  blocks: [Schema.Types.Mixed],
  quiz: [Schema.Types.Mixed],
}, opts()));

const progressSchema = new Schema({
  userId: ref('User'), lessonId: ref('Lesson'),
  completed: { type: Boolean, default: false },
  bestScore: { type: Number, default: 0 },
  attempts: { type: Number, default: 0 },
  xp: { type: Number, default: 0 },
}, opts({ timestamps: true }));
progressSchema.index({ userId: 1, lessonId: 1 }, { unique: true });
export const Progress = model('Progress', progressSchema);

const friendSchema = new Schema({
  fromId: ref('User'), toId: ref('User'),
  status: { type: String, enum: ['pending', 'accepted'], default: 'pending' },
}, opts({ timestamps: true }));
friendSchema.index({ fromId: 1, toId: 1 }, { unique: true });
export const Friendship = model('Friendship', friendSchema);

export const Classroom = model('Classroom', new Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  teacherId: ref('User'),
  code: { type: String, required: true, unique: true },
  studentIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
}, opts({ timestamps: true })));

const promptSchema = new Schema({
  userId: ref('User'), categoryId: ref('Category'), subCategoryId: ref('SubCategory'),
  prompt: { type: String, required: true, maxlength: 1000 },
  response: { type: String, required: true },
}, opts({ timestamps: { createdAt: true, updatedAt: false } }));
promptSchema.index({ userId: 1, createdAt: -1 });
export const Prompt = model('Prompt', promptSchema);

export const populatePrompt = [{ path: 'categoryId', select: 'name' }, { path: 'subCategoryId', select: 'name' }];
export const shapePrompt = (p) => {
  const o = p.toJSON();
  o.category = o.categoryId; o.subCategory = o.subCategoryId;
  delete o.categoryId; delete o.subCategoryId;
  return o;
};

import bcrypt from 'bcryptjs';
import { Category, SubCategory, Lesson, User } from '../models/index.js';
import { COURSES } from '../data/curriculum/index.js';
import { config } from '../config/index.js';

/** Upserts the curriculum (course -> category, unit -> sub-category, lesson). Safe to run on every start. */
async function seedCurriculum() {
  for (const [ci, course] of COURSES.entries()) {
    const category = await Category.findOneAndUpdate({ name: course.name }, { name: course.name, order: ci }, { upsert: true, new: true });
    for (const [si, unit] of course.subs.entries()) {
      const sub = await SubCategory.findOneAndUpdate(
        { name: unit.name, categoryId: category._id },
        { name: unit.name, summary: unit.summary, categoryId: category._id, order: si },
        { upsert: true, new: true },
      );
      for (const [li, lesson] of unit.lessons.entries()) {
        await Lesson.findOneAndUpdate({ slug: lesson.slug }, { ...lesson, subCategoryId: sub._id, order: li }, { upsert: true });
      }
    }
  }
}

/** Creates the admin account from .env on first start. */
async function seedAdmin() {
  if (await User.exists({ phone: config.adminPhone })) return;
  await User.create({ name: 'מנהלת מערכת', phone: config.adminPhone, role: 'admin', passwordHash: await bcrypt.hash(config.adminPassword, 10) });
}

export async function seed() {
  await User.updateMany({ role: 'user' }, { role: 'student' }); // legacy role name from an early version
  await seedCurriculum();
  await seedAdmin();
}

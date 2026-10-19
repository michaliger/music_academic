import bcrypt from 'bcryptjs';
import { Category, SubCategory, Lesson, User } from './models.js';
import { COURSES } from './content.js';
import './content2.js';
import { config } from './config.js';

export async function seed() {
  await User.updateMany({ role: 'user' }, { role: 'student' }); // מיגרציה מגרסה קודמת
  for (const [ci, c] of COURSES.entries()) {
    const cat = await Category.findOneAndUpdate({ name: c.name }, { name: c.name, order: ci }, { upsert: true, new: true });
    for (const [si, s] of c.subs.entries()) {
      const sub = await SubCategory.findOneAndUpdate({ name: s.name, categoryId: cat._id }, { name: s.name, summary: s.summary, categoryId: cat._id, order: si }, { upsert: true, new: true });
      for (const [li, l] of s.lessons.entries()) {
        await Lesson.findOneAndUpdate({ slug: l.slug }, { ...l, subCategoryId: sub._id, order: li }, { upsert: true });
      }
    }
  }
  if (!(await User.exists({ phone: config.adminPhone }))) {
    await User.create({ name: 'מנהלת מערכת', phone: config.adminPhone, role: 'admin', passwordHash: await bcrypt.hash(config.adminPassword, 10) });
  }
}

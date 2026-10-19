import { COURSES } from '../src/content.js';
import '../src/content2.js';

const lessons = COURSES.flatMap((c) => c.subs.flatMap((s) => s.lessons));

test('every lesson has a unique slug, content and a valid quiz', () => {
  expect(new Set(lessons.map((l) => l.slug)).size).toBe(lessons.length);
  for (const l of lessons) {
    expect(l.blocks.length).toBeGreaterThan(2);
    for (const q of l.quiz) {
      expect(q.o.length).toBeGreaterThanOrEqual(2);
      expect(q.a).toBeGreaterThanOrEqual(0);
      expect(q.a).toBeLessThan(q.o.length);
    }
  }
});

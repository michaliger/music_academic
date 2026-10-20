import { COURSES } from '../src/data/curriculum/index.js';

const lessons = COURSES.flatMap((c) => c.subs.flatMap((s) => s.lessons));

test('lesson slugs are unique and every lesson has content', () => {
  expect(new Set(lessons.map((l) => l.slug)).size).toBe(lessons.length);
  for (const l of lessons) expect(l.blocks.length).toBeGreaterThan(2);
});

test('every quiz question has a valid correct answer and an explanation', () => {
  for (const l of lessons) {
    for (const q of l.quiz) {
      expect(q.o.length).toBeGreaterThanOrEqual(2);
      expect(q.a).toBeGreaterThanOrEqual(0);
      expect(q.a).toBeLessThan(q.o.length);
      expect(q.e).toBeTruthy();
    }
  }
});

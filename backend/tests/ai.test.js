import { mockLesson } from '../src/services/ai.js';

test('mock lesson includes subcategory and the user prompt', () => {
  const out = mockLesson({ category: 'הרמוניה', subCategory: 'אקורדים', summary: 'x', prompt: 'מהו אקורד מז׳ור?' });
  expect(out).toContain('אקורדים');
  expect(out).toContain('מהו אקורד מז׳ור?');
});

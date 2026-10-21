import { registerSchema, compositionSchema, songRequestSchema } from '../src/validators/index.js';

const validComposition = { title: 'שיר', key: 'C', mode: 'major', tempo: 100, sections: [{ name: 'בית', lines: [{ text: 'שלום', chords: ['C', 'G'] }] }] };

test('register accepts a valid user', () => {
  expect(registerSchema.safeParse({ name: 'דנה', phone: '0501234567', password: 'secret1' }).success).toBe(true);
});

test('register rejects a bad phone and a short password, reporting the fields', () => {
  const result = registerSchema.safeParse({ name: 'דנה', phone: '12', password: '1' });
  expect(result.success).toBe(false);
  expect(result.error.issues.map((i) => i.path[0])).toEqual(expect.arrayContaining(['phone', 'password']));
});

test('composition accepts a valid payload and rejects an out-of-range tempo', () => {
  expect(compositionSchema.safeParse(validComposition).success).toBe(true);
  expect(compositionSchema.safeParse({ ...validComposition, tempo: 999 }).success).toBe(false);
});

test('composition rejects an invalid key and too many chords on a line', () => {
  expect(compositionSchema.safeParse({ ...validComposition, key: 'H' }).success).toBe(false);
  const tooMany = { ...validComposition, sections: [{ name: 'בית', lines: [{ text: '', chords: Array(17).fill('C') }] }] };
  expect(compositionSchema.safeParse(tooMany).success).toBe(false);
});

test('song request rejects an unknown mood', () => {
  expect(songRequestSchema.safeParse({ mood: 'angry', genre: 'pop', theme: 'ים' }).success).toBe(false);
});

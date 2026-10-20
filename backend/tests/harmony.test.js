import { analyzeComposition } from '../src/services/harmony.service.js';

const song = (key, mode, ...lines) => analyzeComposition({ key, mode, sections: [{ name: 'בית', lines: lines.map((chords) => ({ text: '', chords })) }] });

test('I-V-vi-IV in C major is fully in key and recognised as the pop progression', () => {
  const r = song('C', 'major', ['C', 'G', 'Am', 'F']);
  expect(r.chords.map((c) => c.status)).toEqual(['in', 'in', 'in', 'in']);
  expect(r.chords.map((c) => c.roman)).toEqual(['I', 'V', 'vi', 'IV']);
  expect(r.sections[0].pattern).toBe('מהלך הפופ הקלאסי');
  expect(r.score).toBeGreaterThanOrEqual(85);
});

test('seventh chords keep their extension in the numeral', () => {
  expect(song('C', 'major', ['Dm7', 'G7', 'Cmaj7']).chords.map((c) => c.roman)).toEqual(['ii7', 'V7', 'Imaj7']);
});

test('classifies colourful and outside chords', () => {
  const r = song('C', 'major', ['C', 'D', 'Bb', 'F#']);
  expect(r.chords.map((c) => c.status)).toEqual(['in', 'color', 'color', 'out']);
  expect(r.chords[1].roman).toBe('V/V');
  expect(r.chords[2].roman).toBe('♭VII');
  expect(r.chords[3].note).toContain('נסי אחד מאקורדי הסולם');
});

test('unknown symbols are reported as invalid', () => {
  const r = song('C', 'major', ['H7', '']);
  expect(r.chords.every((c) => c.status === 'invalid')).toBe(true);
  expect(r.tips.length).toBeGreaterThan(0);
});

test('minor key: harmonic V is colour, andalusian cadence is recognised', () => {
  const r = song('A', 'minor', ['Am', 'G', 'F', 'E']);
  expect(r.chords.map((c) => c.status)).toEqual(['in', 'in', 'in', 'color']);
  expect(r.sections[0].pattern).toBe('קדנצה אנדלוסית');
});

test('cadence detection: authentic and half', () => {
  expect(song('C', 'major', ['F', 'G', 'C']).sections[0].cadence).toContain('אותנטית');
  expect(song('C', 'major', ['C', 'Am', 'G']).sections[0].cadence).toContain('חצי קדנצה');
});

test('empty composition gets score 0 and a hint', () => {
  const r = song('C', 'major', []);
  expect(r.score).toBe(0);
  expect(r.tips[0].type).toBe('idea');
});

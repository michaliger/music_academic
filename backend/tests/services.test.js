import { demoAnswer } from '../src/services/ai.service.js';
import { demoSong, demoLyrics } from '../src/services/song.service.js';
import { parseChordSymbol } from '../src/utils/music.js';
import { analyzeComposition } from '../src/services/harmony.service.js';

test('demo tutor answer mentions the sub-category and the prompt', () => {
  const out = demoAnswer({ category: 'הרמוניה', subCategory: 'אקורדים', summary: 'x', prompt: 'מהו אקורד?' });
  expect(out).toContain('אקורדים');
  expect(out).toContain('מהו אקורד?');
});

test('chord parser accepts supported symbols and rejects the rest', () => {
  expect(parseChordSymbol('F#m7')).toMatchObject({ rootPc: 6, suffix: 'm7' });
  expect(parseChordSymbol('Bbmaj7').rootPc).toBe(10);
  expect(parseChordSymbol('H')).toBeNull();
  expect(parseChordSymbol('Cconstructor')).toBeNull();
});

test('every demo song only uses chords the analyzer understands, in its own key', () => {
  for (const mood of ['happy', 'sad', 'dreamy', 'epic', 'calm', 'jazzy']) {
    const song = demoSong({ mood, theme: 'ים' });
    const mode = song.key.endsWith('m') ? 'minor' : 'major';
    const sections = song.sections.map((s) => ({ name: s.name, lines: [{ chords: s.chords }] }));
    const result = analyzeComposition({ key: song.key.replace(/m$/, ''), mode, sections });
    expect(result.chords.every((c) => c.valid)).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(60);
  }
});

test('demo lyrics have three sections', () => {
  expect(demoLyrics('ים').map((s) => s.name)).toEqual(['בית', 'פזמון', 'גשר']);
});

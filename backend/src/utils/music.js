// Shared music-theory tables (backend side).
export const NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
export const KEY_PC = {
  C: 0, 'B#': 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, Fb: 4, F: 5, 'E#': 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11, Cb: 11,
};

// Chord suffix -> semitone distances from the root.
export const CHORD_TYPES = {
  '': [0, 4, 7], m: [0, 3, 7], dim: [0, 3, 6], aug: [0, 4, 8], sus2: [0, 2, 7], sus4: [0, 5, 7],
  maj7: [0, 4, 7, 11], 7: [0, 4, 7, 10], m7: [0, 3, 7, 10], m7b5: [0, 3, 6, 10], dim7: [0, 3, 6, 9], mMaj7: [0, 3, 7, 11], '7sus4': [0, 5, 7, 10],
  6: [0, 4, 7, 9], m6: [0, 3, 7, 9], add9: [0, 4, 7, 14], 9: [0, 4, 7, 10, 14], maj9: [0, 4, 7, 11, 14], m9: [0, 3, 7, 10, 14],
};

/** "F#m7" -> { rootPc: 6, suffix: 'm7', iv: [...] }, or null when the symbol is not supported. */
export function parseChordSymbol(symbol) {
  const m = /^([A-G][#b]?)(.*)$/.exec(symbol || '');
  if (!m || !Object.hasOwn(CHORD_TYPES, m[2])) return null;
  return { rootPc: KEY_PC[m[1]], suffix: m[2], iv: CHORD_TYPES[m[2]] };
}

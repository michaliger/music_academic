// Helpers for the chords-for-a-song screen: data shape, lyric text <-> sections, chord sheet text, playback.
// A chord is { symbol, at (index of the word it sits above), beats }. Chords of a line are kept sorted by `at`.
import { playSteps } from '../../music/audio.js';
import { NOTE_ASCII, voicingOf } from '../../music/theory.js';

export const newLine = () => ({ text: '', chords: [] });
export const EMPTY = { title: '', key: 'C', mode: 'major', tempo: 100, beatsPerBar: 4, sections: [] };
export const wordsOf = (text) => text.split(/\s+/).filter(Boolean);
export const hasLyrics = (sections) => sections.some((s) => s.lines.some((l) => l.text.trim()));

/** Older songs stored chords as plain strings; always work with { symbol, at, beats } objects. */
export const normalize = (c) => ({
  ...EMPTY, ...c, beatsPerBar: c.beatsPerBar || 4,
  sections: c.sections.map((s) => ({ ...s, lines: s.lines.map((l) => ({ ...l, chords: l.chords.map((x) => (typeof x === 'string' ? { symbol: x, at: 0, beats: c.beatsPerBar || 4 } : x)) })) })),
});

/** "Am" -> { key: 'A', mode: 'minor' }. Unknown roots fall back to C. */
export function parseKeyName(name = '') {
  const m = /^([A-G][#b]?)(m?)$/.exec(name);
  return { key: m && NOTE_ASCII.includes(m[1]) ? m[1] : 'C', mode: m?.[2] ? 'minor' : 'major' };
}

/** A song from the studio -> composition with lyrics only (the studio's chords are not copied). */
export const fromSong = (song) => ({
  ...EMPTY, ...parseKeyName(song.key), title: song.title, tempo: song.tempo || 100,
  sections: song.sections.filter((s) => s.lyrics.length).map((s) => ({ name: s.name, lines: s.lyrics.map((text) => ({ text, chords: [] })) })),
});

/** Sections -> editable text: "[name]" starts a section, every other line is a lyric line. */
export const toRaw = (sections) => sections.map((s) => `[${s.name}]\n${s.lines.map((l) => l.text).join('\n')}`).join('\n\n');

/** Editable text -> sections. Chords stay on the lines that keep their position (same section and line number). */
export function fromRaw(text, old = []) {
  const sections = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    const header = /^\[(.+)\]$/.exec(line);
    if (header) sections.push({ name: header[1].slice(0, 30), lines: [] });
    else if (line) {
      if (!sections.length) sections.push({ name: 'בית', lines: [] });
      sections.at(-1).lines.push({ text: line.slice(0, 200), chords: [] });
    }
  }
  const kept = sections.filter((s) => s.lines.length).slice(0, 12);
  kept.forEach((s, si) => { s.lines = s.lines.slice(0, 20); s.lines.forEach((l, li) => { l.chords = (old[si]?.lines[li]?.chords || []).map((c) => ({ ...c })); }); });
  return kept;
}

/** Plain-text chord sheet: every chord is placed exactly above its word. */
export function chordSheet(c) {
  const lineText = (l) => {
    if (!l.chords.length) return l.text;
    const starts = [...l.text.matchAll(/\S+/g)].map((m) => m.index);
    let top = '';
    for (const ch of l.chords) {
      const col = Math.max(top.length ? top.length + 1 : 0, starts[Math.min(ch.at, starts.length - 1)] ?? 0);
      top = top.padEnd(col) + ch.symbol;
    }
    return `${top}\n${l.text}`;
  };
  return `${c.title}\nסולם: ${c.key}${c.mode === 'minor' ? 'm' : ''}\n\n` + c.sections.map((s) => `[${s.name}]\n${s.lines.map(lineText).join('\n')}`).join('\n\n');
}

/** Plays the chord alone. */
export function playChord(symbol, onNotes) {
  const notes = voicingOf(symbol);
  if (!notes) return false;
  onNotes?.(notes);
  playSteps([notes.map((n) => n + 12)], { dur: 1.5 });
  return true;
}

/** Plays the whole song: a chord rings for its number of beats (one beat = 60 / tempo seconds). Returns false if there is nothing to play. */
export function playSong(comp, onNotes) {
  const chords = comp.sections.flatMap((s) => s.lines.flatMap((l) => l.chords)).filter((c) => voicingOf(c.symbol));
  if (!chords.length) return false;
  const beat = 60 / comp.tempo;
  const steps = [], durs = [];
  for (const c of chords) {
    steps.push(voicingOf(c.symbol).map((n) => n + 12)); durs.push(c.beats * beat * 0.95);
    for (let i = 1; i < c.beats; i++) { steps.push([]); durs.push(0); } // the held beats
  }
  playSteps(steps, { gap: beat, durs, onStep: (n) => onNotes?.(n.map((x) => x - 12)) });
  return true;
}

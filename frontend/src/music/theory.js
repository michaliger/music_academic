// ספריית תאוריה: אקורדים, סולמות ופונקציות עזר
export const PC = ['דו', 'דו♯', 'רה', 'רה♯', 'מי', 'פה', 'פה♯', 'סול', 'סול♯', 'לה', 'לה♯', 'סי'];
export const PC_EN = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
export const INV_LABEL = ['מצב יסוד', 'היפוך ראשון', 'היפוך שני', 'היפוך שלישי', 'היפוך רביעי'];
export const NOTE_ASCII = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']; // ASCII names, used in chord symbols
export const BASE = 48;

// iv = מרחקים בחצאי טון מהשורש, f = נוסחת הדרגות
export const CHORDS = [
  { id: 'maj', sym: '', name: `מז'ור`, grp: 'טריאדות', iv: [0, 4, 7], f: '1 3 5', desc: `בהיר, יציב ופתוח.` },
  { id: 'min', sym: 'm', name: 'מינור', grp: 'טריאדות', iv: [0, 3, 7], f: '1 ♭3 5', desc: `כהה ורגשי יותר.` },
  { id: 'dim', sym: 'dim', name: 'מופחת', grp: 'טריאדות', iv: [0, 3, 6], f: '1 ♭3 ♭5', desc: `מתוח ולא יציב, רוצה להיפתר.` },
  { id: 'aug', sym: 'aug', name: 'מוגדל', grp: 'טריאדות', iv: [0, 4, 8], f: '1 3 ♯5', desc: `מרחף ומוזר, מחכה להמשך.` },
  { id: 'sus2', sym: 'sus2', name: 'סוס 2', grp: 'טריאדות', iv: [0, 2, 7], f: '1 2 5', desc: `פתוח ומרחף, בלי מז'ור או מינור.` },
  { id: 'sus4', sym: 'sus4', name: 'סוס 4', grp: 'טריאדות', iv: [0, 5, 7], f: '1 4 5', desc: `תלוי באוויר ומבקש להיפתר לטרצה.` },
  { id: 'maj7', sym: 'maj7', name: `מז'ור 7`, grp: 'ספטימות', iv: [0, 4, 7, 11], f: '1 3 5 7', desc: `חלומי ורך.` },
  { id: 'dom7', sym: '7', name: 'דומיננטה 7', grp: 'ספטימות', iv: [0, 4, 7, 10], f: '1 3 5 ♭7', desc: `בלוזי ומתוח, רוצה להיפתר.` },
  { id: 'min7', sym: 'm7', name: 'מינור 7', grp: 'ספטימות', iv: [0, 3, 7, 10], f: '1 ♭3 5 ♭7', desc: `חם, רגוע וג'אזי.` },
  { id: 'm7b5', sym: 'm7b5', name: 'מינור 7♭5', grp: 'ספטימות', iv: [0, 3, 6, 10], f: '1 ♭3 ♭5 ♭7', desc: `כהה ומתוח (מופחת למחצה).` },
  { id: 'dim7', sym: 'dim7', name: 'מופחת 7', grp: 'ספטימות', iv: [0, 3, 6, 9], f: '1 ♭3 ♭5 ♭♭7', desc: `דרמטי מאוד וסימטרי: כולו טרצות קטנות.` },
  { id: 'mMaj7', sym: 'mMaj7', name: `מינור-מז'ור 7`, grp: 'ספטימות', iv: [0, 3, 7, 11], f: '1 ♭3 5 7', desc: `מסתורי, כמו בסרטי ריגול.` },
  { id: '7sus4', sym: '7sus4', name: '7 סוס 4', grp: 'ספטימות', iv: [0, 5, 7, 10], f: '1 4 5 ♭7', desc: `פתוח וגולמי, נפוץ בפופ ובפאנק.` },
  { id: '6', sym: '6', name: '6', grp: 'צבעים', iv: [0, 4, 7, 9], f: '1 3 5 6', desc: `ידידותי ונוסטלגי.` },
  { id: 'm6', sym: 'm6', name: 'מינור 6', grp: 'צבעים', iv: [0, 3, 7, 9], f: '1 ♭3 5 6', desc: `ג'אזי וקצת מסתורי.` },
  { id: 'add9', sym: 'add9', name: 'add9', grp: 'צבעים', iv: [0, 4, 7, 14], f: '1 3 5 9', desc: `ברק של פופ, בלי ספטימה.` },
  { id: '9', sym: '9', name: '9', grp: 'צבעים', iv: [0, 4, 7, 10, 14], f: '1 3 5 ♭7 9', desc: `פאנק ובלוז עשירים.` },
  { id: 'maj9', sym: 'maj9', name: `מז'ור 9`, grp: 'צבעים', iv: [0, 4, 7, 11, 14], f: '1 3 5 7 9', desc: `עשיר ומרחף.` },
  { id: 'm9', sym: 'm9', name: 'מינור 9', grp: 'צבעים', iv: [0, 3, 7, 10, 14], f: '1 ♭3 5 ♭7 9', desc: `חלק ונעים, צליל של נשמה וג'אז.` },
];

export const SCALES = [
  { id: 'major', name: `מז'ור`, iv: [0, 2, 4, 5, 7, 9, 11], desc: `הסולם הבסיסי: בהיר ושמח.` },
  { id: 'minor', name: 'מינור טבעי', iv: [0, 2, 3, 5, 7, 8, 10], desc: `כהה ורציני.` },
  { id: 'harm', name: 'מינור הרמוני', iv: [0, 2, 3, 5, 7, 8, 11], desc: `צליל מוביל במינור, צבע מזרחי ודרמטי.` },
  { id: 'mel', name: 'מינור מלודי (עולה)', iv: [0, 2, 3, 5, 7, 9, 11], desc: `מינור עם דרגות 6 ו-7 מועלות.` },
  { id: 'dorian', name: 'דוריאן', iv: [0, 2, 3, 5, 7, 9, 10], desc: `מינורי אבל לא עצוב מדי. ג'אז ופאנק.` },
  { id: 'phryg', name: 'פריגי', iv: [0, 1, 3, 5, 7, 8, 10], desc: `ספרדי ודרמטי בזכות ה-♭2.` },
  { id: 'lydian', name: 'לידי', iv: [0, 2, 4, 6, 7, 9, 11], desc: `חולמני ומרחף בזכות ה-♯4.` },
  { id: 'mixo', name: 'מיקסוליד', iv: [0, 2, 4, 5, 7, 9, 10], desc: `בלוזי ורוקי: מז'ור עם ♭7.` },
  { id: 'locr', name: 'לוקרי', iv: [0, 1, 3, 5, 6, 8, 10], desc: `לא יציב, כי הקווינטה מופחתת.` },
  { id: 'pmaj', name: `פנטטוני מז'ורי`, iv: [0, 2, 4, 7, 9], desc: `חמישה צלילים, בלי חצאי טון. פשוט לאלתור.` },
  { id: 'pmin', name: 'פנטטוני מינורי', iv: [0, 3, 5, 7, 10], desc: `בסיס הרוק והבלוז.` },
  { id: 'blues', name: 'בלוז', iv: [0, 3, 5, 6, 7, 10], desc: `פנטטוני מינורי עם בלו נוט (♭5).` },
  { id: 'whole', name: 'סולם שלם', iv: [0, 2, 4, 6, 8, 10], desc: `כולו טונים שלמים: חלומי ובלי כיוון.` },
  { id: 'dimsc', name: 'מופחת (טון-חצי)', iv: [0, 2, 3, 5, 6, 8, 9, 11], desc: `מתחלף טון וחצי: משמש בג'אז על אקורדים מופחתים.` },
];

export const chordNotes = (root, iv, inv = 0, base = BASE) => {
  const n = iv.map((i) => base + root + i);
  for (let k = 0; k < inv; k++) n.push(n.shift() + 12);
  return n;
};
export const scaleNotes = (root, iv, base = BASE) => [...iv.map((i) => base + root + i), base + root + 12];
export const stepPattern = (iv) => iv.map((x, i) => (iv[i + 1] ?? 12) - x).map((d) => (d === 1 ? 'ח' : d === 2 ? 'ט' : d === 3 ? 'ט וחצי' : String(d))).join(' ');

const LET = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
/** "F#m7" => { root: 6, iv, type } או null */
export function parseChord(sym) {
  const m = /^([A-G])([#b]?)(.*)$/.exec(sym || '');
  if (!m) return null;
  const type = CHORDS.find((c) => c.sym === m[3]);
  if (!type) return null;
  return { root: (LET[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + 12) % 12, iv: type.iv, type };
}

/** אקורדי הסולם (טריאדות) לסולמות בני 7 צלילים */
export function diatonic(root, iv) {
  if (iv.length !== 7) return [];
  const ROM = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
  return iv.map((r, i) => {
    const t = (iv[(i + 2) % 7] - r + 12) % 12;
    const f = (iv[(i + 4) % 7] - r + 12) % 12;
    const sym = t === 4 && f === 7 ? '' : t === 3 && f === 7 ? 'm' : t === 3 && f === 6 ? 'dim' : t === 4 && f === 8 ? 'aug' : null;
    if (sym === null) return null;
    const roman = sym === '' ? ROM[i] : sym === 'aug' ? `${ROM[i]}+` : ROM[i].toLowerCase() + (sym === 'dim' ? '°' : '');
    const a = BASE + root + r;
    return { roman, name: PC_EN[(root + r) % 12] + sym, symbol: NOTE_ASCII[(root + r) % 12] + sym, notes: [a, a + t, a + f] };
  }).filter(Boolean);
}

/** Chord symbol -> MIDI notes of its root-position voicing (null when unsupported). */
export const voicingOf = (symbol) => {
  const chord = parseChord(symbol);
  return chord ? chordNotes(chord.root, chord.iv) : null;
};

// Rule-based harmony checker. Deterministic on purpose: theory feedback must be reliable, not guessed by an LLM.
import { NAMES, KEY_PC, parseChordSymbol } from '../utils/music.js';

const SCALES = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10] };
const NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
const OFFSET_NUMERALS = ['I', '♭II', 'II', '♭III', 'III', 'IV', '♯IV', 'V', '♭VI', 'VI', '♭VII', 'VII'];
const FUNCTIONS = ['טוניקה (בית ומנוחה)', 'סובדומיננטה (התרחקות)', 'טוניקה (בית ומנוחה)', 'סובדומיננטה (התרחקות)', 'דומיננטה (מתח)', 'טוניקה (בית ומנוחה)', 'דומיננטה (מתח)'];

// Popular non-diatonic chords: [mode, semitones from tonic, third kind, numeral, explanation].
const BORROWED = [
  ['major', 10, 'maj', '♭VII', `הלוואה מהמינור המקביל: צליל רוק קלאסי`],
  ['major', 8, 'maj', '♭VI', `הלוואה מהמינור המקביל: דרמטי`],
  ['major', 3, 'maj', '♭III', `הלוואה מהמינור המקביל`],
  ['major', 5, 'min', 'iv', `הלוואה מהמינור: צבע נוגה מאוד`],
  ['minor', 7, 'maj', 'V', `דומיננטה הרמונית (מינור הרמוני): מתח חזק לטוניקה`],
  ['minor', 11, 'dim', 'vii°', `צליל מוביל של המינור ההרמוני`],
  ['minor', 5, 'maj', 'IV', `IV מז'ורי: צבע דוריאן`],
];

// Well-known progressions, matched on triad-level numerals.
const KNOWN = {
  'I-V-vi-IV': `מהלך הפופ הקלאסי`, 'vi-IV-I-V': `גרסת הפופ ההפוכה`, 'I-vi-IV-V': `מהלך שנות ה-50`, 'I-IV-V-I': `המהלך הקלאסי: בית, התרחקות, מתח, חזרה`,
  'I-IV-I-V': `מהלך פשוט ויציב`, 'ii-V-I': `מהלך הג'אז הבסיסי`, 'i-VII-VI-V': `קדנצה אנדלוסית`, 'i-VI-III-VII': `מהלך המינור האפי`, 'i-iv-V-i': `מהלך מינורי קלאסי`,
};

const CADENCES = {
  'V-I': `קדנצה אותנטית (V–I): סיום סופי ומשכנע`,
  'IV-I': `קדנצה פלגאלית (IV–I): סיום רך, כמו "אמן"`,
  'V-VI': `קדנצה מרומה (V–vi): מפתיעה, כי מצפים לטוניקה`,
};

/** Third kind of a chord: 'maj' | 'min' | 'dim' | 'aug' | 'sus'. */
function thirdKind(iv) {
  if (iv.includes(3)) return iv.includes(6) ? 'dim' : 'min';
  if (iv.includes(4)) return iv.includes(8) ? 'aug' : 'maj';
  return 'sus';
}

/** "ii", "V7", "vii°", "Imaj7"... from a base numeral and the parsed chord. */
function formatNumeral(base, { iv, suffix }) {
  const kind = thirdKind(iv);
  const ext = suffix === 'm7b5' ? '7' : suffix.replace(/^(m(?!aj)|dim|aug)/, '');
  const mark = suffix === 'm7b5' ? 'ø' : kind === 'dim' ? '°' : kind === 'aug' ? '+' : '';
  return (kind === 'min' || kind === 'dim' ? base.toLowerCase() : base) + mark + ext;
}
const stripExtension = (numeral) => numeral.replace(/(sus|add|maj|Maj)?\d.*$/, '');

/** Quality of the triad built on a scale degree. */
function triadKind(scale, degree) {
  const third = (scale[(degree + 2) % 7] - scale[degree] + 12) % 12;
  const fifth = (scale[(degree + 4) % 7] - scale[degree] + 12) % 12;
  return third === 3 ? (fifth === 6 ? 'dim' : 'min') : 'maj';
}

/** The seven chords of the key: [{ numeral, symbol }]. */
function diatonicTriads(keyPc, mode) {
  const scale = SCALES[mode];
  return scale.map((offset, d) => {
    const kind = triadKind(scale, d);
    return {
      numeral: kind === 'maj' ? NUMERALS[d] : NUMERALS[d].toLowerCase() + (kind === 'dim' ? '°' : ''),
      symbol: NAMES[(keyPc + offset) % 12] + (kind === 'maj' ? '' : kind === 'min' ? 'm' : 'dim'),
    };
  });
}

/** Classifies one chord against the key: in key / colourful / outside / unrecognised. */
function analyzeChord(symbol, keyPc, mode, palette) {
  const chord = parseChordSymbol(symbol);
  if (!chord) return { symbol, valid: false, status: 'invalid', note: 'לא זיהיתי את האקורד. אפשר לכתוב למשל: C, Am, G7, Fmaj7, Dsus4' };

  const scale = SCALES[mode];
  const offset = (chord.rootPc - keyPc + 12) % 12;
  const degree = scale.indexOf(offset);
  const outside = chord.iv.map((i) => (offset + i) % 12).filter((t) => !scale.includes(t));
  const base = { symbol, valid: true };

  // 1. Every chord tone belongs to the scale.
  if (degree >= 0 && !outside.length) {
    const roman = formatNumeral(NUMERALS[degree], chord);
    return { ...base, status: 'in', roman, romanBase: stripExtension(roman), note: `${roman}: ${FUNCTIONS[degree]}` };
  }
  // 2. Secondary dominant: a major chord a fifth above a diatonic (non-tonic, non-diminished) target.
  const kind = thirdKind(chord.iv);
  const target = scale.indexOf((offset + 5) % 12);
  if (kind === 'maj' && target > 0 && triadKind(scale, target) !== 'dim') {
    const roman = `${formatNumeral('V', chord)}/${palette[target].numeral}`;
    return { ...base, status: 'color', roman, romanBase: stripExtension(roman), note: `דומיננטה משנית: מושכת חזק אל ${palette[target].symbol}` };
  }
  // 3. Popular borrowed chords.
  const borrowed = BORROWED.find(([m, o, k]) => m === mode && o === offset && k === kind);
  if (borrowed) return { ...base, status: 'color', roman: borrowed[3], romanBase: stripExtension(borrowed[3]), note: borrowed[4] };
  // 4. Outside the key.
  const roman = formatNumeral(OFFSET_NUMERALS[offset], chord);
  const names = outside.map((t) => NAMES[(keyPc + t) % 12]).join(', ');
  return { ...base, status: 'out', roman, romanBase: stripExtension(roman), note: `הצלילים ${names} מחוץ לסולם. נסי אחד מאקורדי הסולם: ${palette.map((p) => p.symbol).join(' · ')}` };
}

/** Cadence and known-progression summary for one section. */
function reportSection(name, chords) {
  const bases = chords.filter((c) => c.valid).map((c) => c.romanBase);
  const last2 = bases.slice(-2).map((b) => b.toUpperCase()).join('-');
  let pattern = null;
  for (const size of [4, 3]) {
    for (let i = 0; i + size <= bases.length && !pattern; i++) pattern = KNOWN[bases.slice(i, i + size).join('-')] || null;
  }
  const cadence = bases.length >= 2 ? CADENCES[last2] || (bases.at(-1).toUpperCase() === 'V' ? `חצי קדנצה (נגמר על V): המשפט נשאר פתוח ומחכה להמשך` : null) : null;
  return { name, romans: chords.filter((c) => c.valid).map((c) => c.roman), cadence, pattern };
}

/** Score (0-100) and human tips for the whole song. */
function evaluate(chords, sections, palette, keyName) {
  const valid = chords.filter((c) => c.valid);
  if (!valid.length) return { score: 0, tips: [{ type: 'idea', text: `עוד לא כתבת אקורדים. התחילי מ-${palette[0].symbol}, האקורד של הבית, ובחרי עוד שלושה.` }] };

  const inKey = valid.filter((c) => c.status === 'in').length;
  const colour = valid.filter((c) => c.status === 'color');
  const bad = chords.filter((c) => c.status === 'out' || c.status === 'invalid');
  const isHome = (c) => c.romanBase.toUpperCase() === 'I';
  const startsHome = isHome(valid[0]);
  const endsHome = isHome(valid.at(-1));
  const distinct = new Set(valid.map((c) => c.symbol)).size;

  const score = Math.min(100, Math.round((70 * (inKey + 0.8 * colour.length)) / chords.length) + (startsHome ? 5 : 0) + (endsHome ? 15 : 0) + (distinct >= 3 ? 10 : 0));

  const tips = [];
  if (bad.length) tips.push({ type: 'warn', text: `האקורדים ${[...new Set(bad.map((c) => c.symbol))].join(', ')} לא מתאימים לסולם ${keyName}. אם זה לא מכוון, החליפי באקורד מהסולם.` });
  else tips.push({ type: 'good', text: `כל האקורדים נשמעים טוב ב${keyName}: בסיס הרמוני יציב.` });
  if (colour.length) tips.push({ type: 'good', text: `יש לך ${colour.length} אקורדים צבעוניים מחוץ לסולם (למשל ${colour[0].symbol}: ${colour[0].note}). זה מעניין כשזה מכוון.` });
  tips.push(endsHome ? { type: 'good', text: 'השיר נגמר על הטוניקה: תחושת בית וסיום.' } : { type: 'idea', text: `נסי לסיים על ${palette[0].symbol}: חזרה לטוניקה נותנת תחושת סיום.` });
  if (distinct < 3) tips.push({ type: 'idea', text: 'הוסיפי אקורד שלישי שונה כדי ליצור תנועה במהלך.' });
  for (const s of sections) {
    if (s.pattern) tips.push({ type: 'good', text: `ב"${s.name}" זיהיתי: ${s.pattern}.` });
    if (s.cadence) tips.push({ type: 'good', text: `ב"${s.name}": ${s.cadence}.` });
  }
  return { score, tips };
}

/** Entry point: sections -> lines -> chords are analysed in order; each chord reports its position. */
export function analyzeComposition({ key, mode, sections }) {
  const keyPc = KEY_PC[key];
  const keyName = key + (mode === 'minor' ? 'm' : '');
  const palette = diatonicTriads(keyPc, mode);
  const chords = [];
  const reports = sections.map((section, s) => {
    const own = [];
    section.lines.forEach((line, l) => line.chords.forEach((chord, index) => {
      const symbol = typeof chord === 'string' ? chord : chord.symbol; // chords are { symbol, at, beats } (strings still accepted)
      const info = { ...analyzeChord(symbol, keyPc, mode, palette), section: s, line: l, index };
      chords.push(info); own.push(info);
    }));
    return reportSection(section.name, own);
  });
  return { key: { name: keyName, mode }, chords, sections: reports, ...evaluate(chords, reports, palette, keyName) };
}

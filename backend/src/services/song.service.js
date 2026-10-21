import { z } from 'zod';
import { MOODS, GENRES } from '../utils/constants.js';
import { NAMES, KEY_PC } from '../utils/music.js';
import { askModel, isAiEnabled } from './ai.service.js';

// Mood templates: [semitones from tonic, chord suffix, roman numeral].
const MOOD = {
  happy: { minor: false, tonic: 0, tempo: 120, prog: [[0, '', 'I'], [7, '', 'V'], [9, 'm', 'vi'], [5, '', 'IV']], why: 'מהלך הפופ הקלאסי: מרגיש בהיר, זורם וקל לשיר מעליו.' },
  sad: { minor: true, tonic: 9, tempo: 72, prog: [[0, 'm', 'i'], [8, '', 'VI'], [3, '', 'III'], [10, '', 'VII']], why: 'המינור נותן את הצבע הכהה, והירידה לאקורדים הגבוהים יותר יוצרת געגוע.' },
  dreamy: { minor: false, tonic: 0, tempo: 84, prog: [[0, 'maj7', 'Imaj7'], [4, 'm7', 'iii7'], [5, 'maj7', 'IVmaj7'], [7, '', 'V']], why: 'אקורדי ה-maj7 וה-m7 רכים ומרחפים, ללא מתח חד.' },
  epic: { minor: true, tonic: 9, tempo: 96, prog: [[0, 'm', 'i'], [10, '', 'VII'], [8, '', 'VI'], [7, '', 'V']], why: 'ירידה מדורגת עד ל-V המז\'ורי יוצרת מתח דרמטי שחוזר לטוניקה.' },
  calm: { minor: false, tonic: 7, tempo: 88, prog: [[0, '', 'I'], [5, '', 'IV'], [0, '', 'I'], [7, '', 'V']], why: 'מהלך פשוט ויציב שחוזר הביתה לעתים קרובות, ולכן נשמע שליו.' },
  jazzy: { minor: false, tonic: 0, tempo: 110, prog: [[2, 'm7', 'ii7'], [7, '7', 'V7'], [0, 'maj7', 'Imaj7'], [9, 'm7', 'vi7']], why: 'מהלך ii–V–I הוא הלב של הג\'אז, וה-vi7 מחזיר אותו לתחילת הסבב.' },
};
const rotate = (list, n) => list.slice(n).concat(list.slice(0, n));

/** Canned lyrics around a theme (demo mode). */
export const demoLyrics = (theme) => [
  { name: 'בית', lines: [`בלילות כאלה אני חושבת על ${theme}`, 'והצלילים מתחילים לספר', 'כל אקורד פותח עוד דלת', 'ואני הולכת אחריהם'] },
  { name: 'פזמון', lines: [`${theme}, ${theme}, זה השיר שלי`, 'כל הלב נכנס למנגינה', `${theme}, ${theme}, לא אעצור`, 'עד שהשמיים ישמעו'] },
  { name: 'גשר', lines: ['ואולי לרגע הכול נעצר', 'ורק הדממה שרה', 'ואז הכול חוזר'] },
];

/** Demo song: chord progression from the mood template + canned lyrics. */
export function demoSong({ mood, theme, key }) {
  const m = MOOD[mood];
  const tonic = key && KEY_PC[key] !== undefined ? KEY_PC[key] : m.tonic;
  const keyName = NAMES[tonic] + (m.minor ? 'm' : '');
  const chords = m.prog.map(([offset, suffix]) => NAMES[(tonic + offset) % 12] + suffix);
  const chordsFor = { 'בית': chords, 'פזמון': rotate(chords, 3), 'גשר': rotate(chords, 2) };
  return {
    title: theme.slice(0, 40), key: keyName, tempo: m.tempo, timeSignature: '4/4',
    explanation: `המהלך ${m.prog.map((p) => p[2]).join(' – ')} ב${keyName}. ${m.why} הפזמון משתמש באותם אקורדים בסדר אחר כדי ליצור חידוש בלי להתרחק מהבית.`,
    sections: [{ name: 'פתיחה', chords, lyrics: [] }, ...demoLyrics(theme).map((s) => ({ name: s.name, chords: chordsFor[s.name], lyrics: s.lines }))],
  };
}

// Shapes we accept back from the model.
const songSchema = z.object({
  title: z.string().max(100), key: z.string().max(20), tempo: z.number().int().min(40).max(220), timeSignature: z.string().max(5), explanation: z.string().max(1500),
  sections: z.array(z.object({ name: z.string().max(30), chords: z.array(z.string().max(12)).min(1).max(8), lyrics: z.array(z.string().max(200)).max(10) })).min(1).max(8),
});
const lyricsSchema = z.object({
  title: z.string().max(100),
  sections: z.array(z.object({ name: z.string().max(30), lines: z.array(z.string().max(200)).min(1).max(10) })).min(1).max(6),
});

const SONG_SYSTEM = `את/ה מלחין/ה ומורה לתאוריה מוזיקלית. החזר/י אובייקט JSON בלבד עם השדות:
title, key (למשל "C" או "Am"), tempo (מספר שלם), timeSignature (למשל "4/4"), explanation (הסבר קצר בעברית על המהלך עם ספרות רומיות), sections (מערך של {name, chords, lyrics}).
חובה לכלול את החלקים: פתיחה, בית, פזמון, גשר. לכל חלק 4 אקורדים. lyrics הם שורות בעברית (4 שורות בבית ובפזמון, ריק בפתיחה).
בסימוני האקורדים מותר להשתמש רק בסיומות: ללא (מז'ור), m, 7, maj7, m7, dim, aug, sus2, sus4, add9, 6, m7b5, ושמות שורש עם # או b (למשל F#m7, Bbmaj7).`;

const LYRICS_SYSTEM = `את/ה כותב/ת מילים לשירים בעברית. החזר/י אובייקט JSON בלבד: {"title": string, "sections": [{"name": string, "lines": string[]}]}.
המילים חייבות להיות מקוריות לגמרי: אל תצטט/י ואל תשחזר/י מילים של שירים קיימים, גם אם הנושא מזכיר שיר מוכר.
שלושה חלקים: בית, פזמון, גשר. 4 שורות בכל חלק. שורות קצרות וקלות לשירה, עם חרוזים עדינים. בלי אקורדים ובלי הסברים.`;

/** Runs a JSON-mode model call and validates the result; null means "fall back to demo". */
async function askJson(system, user, schema) {
  if (!isAiEnabled()) return null;
  try { return schema.parse(JSON.parse(await askModel({ system, user, json: true, temperature: 0.9 }))); }
  catch (e) { console.error('AI call failed, using demo:', e.message); return null; }
}

/** Full song (chords + structure + lyrics): AI when configured, demo otherwise. */
export async function generateSong(p) {
  const ai = await askJson(SONG_SYSTEM, `מצב רוח: ${MOODS[p.mood]}\nז'אנר: ${GENRES[p.genre]}\nנושא: ${p.theme}\nסולם: ${p.key || 'לבחירתך'}`, songSchema);
  return ai ? { ...ai, engine: 'ai' } : { ...demoSong(p), engine: 'demo' };
}

/** Lyrics only: the student writes the chords herself in the composition room. */
export async function generateLyrics({ theme, mood }) {
  const ai = await askJson(LYRICS_SYSTEM, `נושא: ${theme}\nמצב רוח: ${MOODS[mood]}`, lyricsSchema);
  return ai ? { ...ai, engine: 'ai' } : { title: theme.slice(0, 40), sections: demoLyrics(theme), engine: 'demo' };
}

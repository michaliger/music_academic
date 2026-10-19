import { z } from 'zod';
import { config } from '../config.js';

export const MOODS = { happy: 'שמח', sad: 'עצוב', dreamy: 'חולמני', epic: 'אפי ודרמטי', calm: 'רגוע', jazzy: 'ג\'אזי' };
export const GENRES = { pop: 'פופ', ballad: 'בלדה', rock: 'רוק', folk: 'פולק', jazz: 'ג\'אז' };

const NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const KEYS = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };

// תבנית לכל מצב רוח: [היסט בחצאי טון מהטוניקה, סיומת האקורד, ספרה רומית]
const MOOD = {
  happy: { minor: false, tonic: 0, tempo: 120, prog: [[0, '', 'I'], [7, '', 'V'], [9, 'm', 'vi'], [5, '', 'IV']], why: 'מהלך הפופ הקלאסי: מרגיש בהיר, זורם וקל לשיר מעליו.' },
  sad: { minor: true, tonic: 9, tempo: 72, prog: [[0, 'm', 'i'], [8, '', 'VI'], [3, '', 'III'], [10, '', 'VII']], why: 'המינור נותן את הצבע הכהה, והירידה לאקורדים הגבוהים יותר יוצרת געגוע.' },
  dreamy: { minor: false, tonic: 0, tempo: 84, prog: [[0, 'maj7', 'Imaj7'], [4, 'm7', 'iii7'], [5, 'maj7', 'IVmaj7'], [7, '', 'V']], why: 'אקורדי ה-maj7 וה-m7 רכים ומרחפים, ללא מתח חד.' },
  epic: { minor: true, tonic: 9, tempo: 96, prog: [[0, 'm', 'i'], [10, '', 'VII'], [8, '', 'VI'], [7, '', 'V']], why: 'ירידה מדורגת עד ל-V המז\'ורי יוצרת מתח דרמטי שחוזר לטוניקה.' },
  calm: { minor: false, tonic: 7, tempo: 88, prog: [[0, '', 'I'], [5, '', 'IV'], [0, '', 'I'], [7, '', 'V']], why: 'מהלך פשוט ויציב שחוזר הביתה לעתים קרובות, ולכן נשמע שליו.' },
  jazzy: { minor: false, tonic: 0, tempo: 110, prog: [[2, 'm7', 'ii7'], [7, '7', 'V7'], [0, 'maj7', 'Imaj7'], [9, 'm7', 'vi7']], why: 'מהלך ii–V–I הוא הלב של הג\'אז, וה-vi7 מחזיר אותו לתחילת הסבב.' },
};

const rot = (a, n) => a.slice(n).concat(a.slice(0, n));

export function demoSong({ mood, theme, key }) {
  const m = MOOD[mood];
  const tonic = key && KEYS[key] !== undefined ? KEYS[key] : m.tonic;
  const keyName = NAMES[tonic] + (m.minor ? 'm' : '');
  const chords = m.prog.map(([off, suf]) => NAMES[(tonic + off) % 12] + suf);
  const romans = m.prog.map((x) => x[2]);
  const verse = [`בלילות כאלה אני חושבת על ${theme}`, 'והצלילים מתחילים לספר', 'כל אקורד פותח עוד דלת', 'ואני הולכת אחריהם'];
  const chorus = [`${theme}, ${theme}, זה השיר שלי`, 'כל הלב נכנס למנגינה', `${theme}, ${theme}, לא אעצור`, 'עד שהשמיים ישמעו'];
  const bridge = ['ואולי לרגע הכול נעצר', 'ורק הדממה שרה', 'ואז הכול חוזר'];
  return {
    title: theme.slice(0, 40), key: keyName, tempo: m.tempo, timeSignature: '4/4',
    explanation: `המהלך ${romans.join(' – ')} ב${keyName}. ${m.why} הפזמון משתמש באותם אקורדים בסדר אחר כדי ליצור חידוש בלי להתרחק מהבית.`,
    sections: [
      { name: 'פתיחה', chords, lyrics: [] },
      { name: 'בית', chords, lyrics: verse },
      { name: 'פזמון', chords: rot(chords, 3), lyrics: chorus },
      { name: 'גשר', chords: rot(chords, 2), lyrics: bridge },
    ],
  };
}

const songSchema = z.object({
  title: z.string().max(100), key: z.string().max(20), tempo: z.number().int().min(40).max(220), timeSignature: z.string().max(5),
  explanation: z.string().max(1500),
  sections: z.array(z.object({ name: z.string().max(30), chords: z.array(z.string().max(12)).min(1).max(8), lyrics: z.array(z.string().max(200)).max(10) })).min(1).max(8),
});

const SYSTEM = `את/ה מלחין/ה ומורה לתאוריה מוזיקלית. החזר/י אובייקט JSON בלבד, בלי טקסט נוסף, עם השדות:
title, key (למשל "C" או "Am"), tempo (מספר שלם), timeSignature (למשל "4/4"), explanation (הסבר קצר בעברית על המהלך עם ספרות רומיות ולמה הוא מתאים), sections (מערך של {name, chords, lyrics}).
חובה לכלול את החלקים: פתיחה, בית, פזמון, גשר. לכל חלק 4 אקורדים. lyrics הם שורות בעברית (4 שורות בבית ובפזמון, ריק בפתיחה).
בסימוני האקורדים מותר להשתמש רק בסיומות: ללא (מז'ור), m, 7, maj7, m7, dim, aug, sus2, sus4, add9, 6, m7b5, ושמות שורש עם # או b (למשל F#m7, Bbmaj7).`;

async function aiSong(p) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.openaiKey}` },
    body: JSON.stringify({
      model: config.openaiModel, temperature: 0.9, response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: `מצב רוח: ${MOODS[p.mood]}\nז'אנר: ${GENRES[p.genre]}\nנושא: ${p.theme}\nסולם: ${p.key || 'לבחירתך'}` }],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const data = await res.json();
  return songSchema.parse(JSON.parse(data.choices[0].message.content));
}

/** ממשק אחיד: generateSong({mood, genre, theme, key}) => song. עם מפתח OpenAI משתמש ב-GPT, אחרת (או בכשל) מחזיר שיר הדגמה. */
export async function generateSong(p) {
  if (config.openaiKey) {
    try { return { ...(await aiSong(p)), engine: 'ai' }; } catch (e) { console.error('AI song failed, using demo:', e.message); }
  }
  return { ...demoSong(p), engine: 'demo' };
}

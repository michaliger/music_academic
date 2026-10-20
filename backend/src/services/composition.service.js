import { askModel, isAiEnabled } from './ai.service.js';

const SYSTEM = `את/ה מורה למוזיקה מעודד/ת. קיבלת ניתוח הרמוני אוטומטי של שיר שתלמידה כתבה.
כתוב/י 3 עד 4 משפטים בעברית: מה עובד, מה אפשר לשפר, ורעיון אחד לניסוי. אל תמציא/י אקורדים שלא מופיעים בניתוח.`;

/** Short encouraging comment on top of the rule-based analysis. Returns null when AI is unavailable. */
export async function mentorFeedback(analysis) {
  if (!isAiEnabled()) return null;
  const summary = {
    key: analysis.key.name, score: analysis.score,
    sections: analysis.sections.map((s) => ({ name: s.name, numerals: s.romans, cadence: s.cadence, pattern: s.pattern })),
    tips: analysis.tips.map((t) => t.text),
  };
  try { return (await askModel({ system: SYSTEM, user: JSON.stringify(summary), temperature: 0.6 })) || null; }
  catch (e) { console.error('Mentor feedback failed:', e.message); return null; }
}

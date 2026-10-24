import { Activity } from '../models/index.js';

const TZ = 'Asia/Jerusalem';
const dayOf = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d); // YYYY-MM-DD
const shift = (day, n) => { const d = new Date(`${day}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

/** Records an event. Never blocks or breaks the request it belongs to. */
export const logActivity = (userId, type, title, extra = {}) => Activity.create({ userId, type, title, ...extra }).catch(() => {});

/** Everything the "my activity" page shows: streak, totals and a day-by-day log of the last 60 days. */
export async function activityFor(userId) {
  const since = new Date(Date.now() - 60 * 864e5);
  const events = await Activity.find({ userId, createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(1000);
  const byDay = new Map();
  for (const e of events) {
    const day = dayOf(e.createdAt);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day).push({ type: e.type, title: e.title, score: e.score, xp: e.xp, at: e.createdAt });
  }
  const today = dayOf(new Date());
  let cursor = byDay.has(today) ? today : shift(today, -1); // today may still be empty without breaking the streak
  let streak = 0;
  while (byDay.has(cursor)) { streak += 1; cursor = shift(cursor, -1); }
  const days = [...byDay.entries()].map(([date, items]) => {
    const quizzes = items.filter((i) => i.type === 'quiz');
    return { date, items, xp: items.reduce((n, i) => n + (i.xp || 0), 0), passed: quizzes.filter((q) => q.score >= 60).length };
  });
  const last14 = Array.from({ length: 14 }, (_, i) => { const date = shift(today, i - 13); return { date, count: byDay.get(date)?.length || 0 }; });
  const count = (t) => events.filter((e) => e.type === t).length;
  return { streak, activeDays: byDay.size, today: byDay.has(today), totals: { lessons: count('lesson'), quizzes: count('quiz'), questions: count('question'), songs: count('song') }, last14, days };
}

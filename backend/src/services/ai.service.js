import { config } from '../config/index.js';
import { httpError } from '../utils/httpError.js';

/**
 * AI integration interface. Every AI feature goes through askModel(); without an API key the
 * callers fall back to deterministic demo content, so the app works fully offline.
 */
export const isAiEnabled = () => Boolean(config.openaiKey);

/** One chat-completion call. Returns the message text (a JSON string when json = true). */
export async function askModel({ system, user, json = false, temperature = 0.7 }) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.openaiKey}` },
    body: JSON.stringify({
      model: config.openaiModel, temperature,
      ...(json && { response_format: { type: 'json_object' } }),
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    }),
  });
  if (!res.ok) throw httpError(502, 'שירות ה-AI אינו זמין כרגע');
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

/** Demo tutor answer, used when no API key is configured. */
export function demoAnswer({ category, subCategory, summary, prompt }) {
  return [
    `🎼 שיעור: ${subCategory} (${category})`, '',
    `שאלתך: "${prompt}"`, '',
    `רקע קצר: ${summary || subCategory}`, '',
    'מה חשוב לדעת:',
    `1. התחילי מהמושג הבסיסי של "${subCategory}" ונגני אותו על כלי כדי לשמוע אותו.`,
    '2. חפשי את הדפוס: כמעט כל כלל בתאוריה נולד מצליל שנשמע טוב.',
    '3. נסי ליישם: מצאי שיר שאת אוהבת וזהי בו את הנושא.', '',
    'תרגיל: כתבי מנגינה של 4 תיבות המדגימה את הנושא, ונגני אותה לאט עם מטרונום.', '',
    '(תשובה זו נוצרה במנוע ההדגמה. הגדירי OPENAI_API_KEY לקבלת שיעורים מלאים מ-GPT.)',
  ].join('\n');
}

/** Free-form question from the "ask the teacher" screen. */
export async function answerPrompt(ctx) {
  if (!isAiEnabled()) return demoAnswer(ctx);
  const answer = await askModel({
    system: 'את/ה מורה למוזיקה מקצועי. כתוב/י שיעור ברור בעברית: הסבר, דוגמאות מוזיקליות, ותרגיל קצר בסוף.',
    user: `קטגוריה: ${ctx.category}\nתת-קטגוריה: ${ctx.subCategory}\nבקשה: ${ctx.prompt}`,
  });
  return answer || demoAnswer(ctx);
}

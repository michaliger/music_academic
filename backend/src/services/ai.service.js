import { config } from '../config/index.js';
import { httpError } from '../utils/httpError.js';

/**
 * AI integration interface. Every AI feature goes through askModel(); without an API key the
 * callers fall back to deterministic demo content, so the app works fully offline.
 * Providers: Google Gemini (GEMINI_API_KEY) is preferred, OpenAI (OPENAI_API_KEY) is the alternative.
 */
export const aiProvider = () => (config.geminiKey ? 'gemini' : config.openaiKey ? 'openai' : null);
export const isAiEnabled = () => aiProvider() !== null;

/** Gemini generateContent call. Tries the configured model first, then a few fallbacks (renamed model, busy model, quota). */
async function askGemini({ system, user, json, temperature }) {
  const call = (model) => fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': config.geminiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: { temperature, ...(json && { responseMimeType: 'application/json' }) },
    }),
  });
  const models = [...new Set([config.geminiModel, 'gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash', 'gemini-flash-latest'])];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  let last = '';
  // "high demand" (503) is temporary: go through the models, and if all are busy wait a moment and go through them again
  for (let round = 0; round < 3; round++) {
    let transient = false;
    for (const model of models) {
      const res = await call(model);
      if (res.ok) {
        const data = await res.json();
        return (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim();
      }
      last = `Gemini ${res.status} (${model}): ${(await res.text()).slice(0, 300)}`;
      if (![404, 429, 503].includes(res.status)) throw new Error(last); // a bad key or bad request will not improve with another model
      if (res.status !== 404) transient = true;
    }
    if (!transient) break;
    await wait(1500 * (round + 1));
  }
  throw new Error(last);
}

/** OpenAI chat-completions call. */
async function askOpenAI({ system, user, json, temperature }) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.openaiKey}` },
    body: JSON.stringify({
      model: config.openaiModel, temperature,
      ...(json && { response_format: { type: 'json_object' } }),
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

/** One model call. Returns the text (a JSON string when json = true). The real reason of a failure is logged, the client gets a 502. */
export async function askModel({ system, user, json = false, temperature = 0.7 }) {
  try {
    const args = { system, user, json, temperature };
    return aiProvider() === 'gemini' ? await askGemini(args) : await askOpenAI(args);
  } catch (e) {
    console.error('AI request failed:', e.message);
    const err = httpError(502, 'שירות ה-AI אינו זמין כרגע');
    err.detail = e.message; // kept for the diagnostics route, never sent with normal responses
    throw err;
  }
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
    'תרגיל: כתבי מנגינה של 4 תיבות המדגימה את הנושא, ונגני אותה לאט עם מטרונום.',
  ].join('\n');
}

/** Free-form question from the "ask the teacher" screen. */
export async function answerPrompt(ctx) {
  if (!isAiEnabled()) return demoAnswer(ctx);
  try {
    const answer = await askModel({
      system: 'את/ה מורה למוזיקה מקצועי. כתוב/י שיעור ברור בעברית: הסבר, דוגמאות מוזיקליות, ותרגיל קצר בסוף.',
      user: `קטגוריה: ${ctx.category}\nתת-קטגוריה: ${ctx.subCategory}\nבקשה: ${ctx.prompt}`,
    });
    return answer || demoAnswer(ctx);
  } catch { return demoAnswer(ctx); } // the student still gets an answer if the AI service is down
}

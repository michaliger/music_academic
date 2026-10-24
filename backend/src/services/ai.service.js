import { config } from '../config/index.js';
import { httpError } from '../utils/httpError.js';

/**
 * AI integration interface. Every AI feature goes through askModel(); without an API key the
 * callers fall back to deterministic demo content, so the app works fully offline.
 * Providers: Google Gemini (GEMINI_API_KEY) is preferred, OpenAI (OPENAI_API_KEY) is the alternative.
 */
export const aiProvider = () => (config.geminiKey ? 'gemini' : config.openaiKey ? 'openai' : null);
export const isAiEnabled = () => aiProvider() !== null;

let keyCursor = 0; // spreads the load: each request starts with the next key
const REQUEST_MS = 12000; // one HTTP call never waits longer than this
const TOTAL_MS = 30000; // the whole question gives up after this long, so the student never waits "for hours"

const fetchTimeout = async (url, options) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_MS);
  try { return await fetch(url, { ...options, signal: ctrl.signal }); }
  catch (e) { throw new Error(e.name === 'AbortError' ? `timeout after ${REQUEST_MS / 1000}s (${new URL(url).host})` : e.message); }
  finally { clearTimeout(timer); }
};

/** One pass over the models for a single key. Returns the text, or throws an Error whose `.transient` / `.keyProblem` flags tell the caller what to do next. */
async function geminiWithKey(key, makeBody, deadline) {
  const headers = { 'Content-Type': 'application/json', 'x-goog-api-key': key };
  // Keys that start with "AQ." are Vertex AI express-mode keys; they use a different address than AI Studio ("AIza...") keys.
  const endpoints = (model) => {
    const studio = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    const vertex = `https://aiplatform.googleapis.com/v1/publishers/google/models/${model}:generateContent`;
    return key.startsWith('AQ.') ? [vertex, studio] : [studio];
  };
  const models = [...new Set([config.geminiModel, 'gemini-3.5-flash-lite', 'gemini-flash-latest'])];
  let last = '';
  let transient = false;
  let keyProblem = false;
  for (const model of models) {
    for (const url of endpoints(model)) {
      if (Date.now() > deadline) { const e = new Error(last || 'timeout'); e.transient = false; e.keyProblem = false; throw e; }
      let res;
      try { res = await fetchTimeout(url, { method: 'POST', headers, body: makeBody(model) }); }
      catch (e) { last = `Gemini (${model}): ${e.message}`; console.error(last); transient = true; continue; }
      if (res.ok) {
        const data = await res.json();
        const text = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim();
        if (text) { console.log(`AI answered (${model}, ${new URL(url).host})`); return text; }
        last = `Gemini (${model}): empty answer`;
        continue;
      }
      last = `Gemini ${res.status} (${model} @ ${new URL(url).host}): ${(await res.text()).slice(0, 300)}`;
      console.error(last);
      if (res.status === 400 && /API key|API_KEY/i.test(last)) { const e = new Error(last); e.keyProblem = true; throw e; } // a bad key will not work with any model: next key at once
      if (res.status === 401 || res.status === 403) { const e = new Error(last); e.keyProblem = true; throw e; }
      if (res.status === 503) transient = true;
      else if (res.status === 429) { transient = true; keyProblem = true; } // quota used up: another key may still have some
      // 418 = blocked by a content filter (e.g. NetFree) on that address; 400/404 = model or address not usable: try the next one
      else if (![404, 400, 418].includes(res.status)) throw new Error(last);
    }
  }
  const err = new Error(last);
  err.transient = transient;
  err.keyProblem = keyProblem;
  throw err;
}

/** Gemini generateContent. Several keys are tried in turn (a key without quota or a rejected key is skipped); busy models are retried once after a short wait. */
async function askGemini({ system, user, json, temperature }) {
  const makeBody = (model) => JSON.stringify({
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts: [{ text: user }] }],
    generationConfig: {
      temperature,
      ...(json && { responseMimeType: 'application/json' }),
      ...(/^gemini-2\.5-flash$/.test(model) && { thinkingConfig: { thinkingBudget: 0 } }), // no hidden "thinking" time: much faster answers
    },
  });
  const keys = config.geminiKeys;
  const deadline = Date.now() + TOTAL_MS;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  let last = new Error('no Gemini key');
  for (let pass = 0; pass < 2; pass++) {
    let transient = false;
    for (let i = 0; i < keys.length; i++) {
      const key = keys[(keyCursor + i) % keys.length];
      try {
        const text = await geminiWithKey(key, makeBody, deadline);
        if (keys.length > 1) keyCursor = (keyCursor + 1) % keys.length;
        return text;
      } catch (e) {
        last = e;
        if (e.transient) transient = true;
        if (e.keyProblem === undefined && !e.transient) throw e; // a real request error: another key will not help
        if (keys.length > 1) console.error(`Gemini key #${((keyCursor + i) % keys.length) + 1} did not work, trying the next one`);
      }
      if (Date.now() > deadline) throw last;
    }
    if (!transient || Date.now() + 2000 > deadline) break;
    await wait(1500);
  }
  throw last;
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
      system: [
        'את מורה למוזיקה מקצועית וחמה, שמלמדת תלמידות בעברית ברורה ופשוטה (פנייה בלשון נקבה).',
        'ענִי רק על השאלה ובקצרה: עד כ-250 מילים. מבנה: הסבר קצר, שתי דוגמאות מוזיקליות, ותרגיל אחד קטן בסוף.',
        'דיוק הוא קודם כול: כל תו, אינטרוול ואקורד חייבים להיות נכונים. אם את לא בטוחה בעובדה, אל תכתבי אותה. בדקי כל דוגמה לפני שאת כותבת אותה.',
        'עיצוב: טקסט פשוט עם כותרות קצרות (שורה שמתחילה ב-##), רשימות עם מקף, ו-**הדגשה** במשורה. בלי תגיות HTML, בלי טבלאות ובלי בלוקי קוד.',
        'אל תכללי את התשובות לתרגיל באותה תשובה; כתבי "נסי לענות בעצמך" ותני רמז אחד בלבד.',
        'בלי פתיחות ארוכות ובלי דימויים מוזרים. השתמשי בשמות התווים העבריים (דו, רה, מי) וליד כל אחד את האות הלועזית בסוגריים רק כשצריך.',
      ].join('\n'),
      user: `קטגוריה: ${ctx.category}\nתת-קטגוריה: ${ctx.subCategory}\nבקשה: ${ctx.prompt}`,
    });
    return answer || demoAnswer(ctx);
  } catch { return demoAnswer(ctx); } // the student still gets an answer if the AI service is down
}

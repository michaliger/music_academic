import { config } from '../config.js';

/** ממשק אחיד: generateLesson({category, subCategory, summary, prompt}) => string */
export function mockLesson({ category, subCategory, summary, prompt }) {
  return [
    `🎼 שיעור: ${subCategory} (${category})`,
    '',
    `שאלתך: "${prompt}"`,
    '',
    `רקע קצר: ${summary || subCategory}`,
    '',
    'מה חשוב לדעת:',
    `1. התחילי מהמושג הבסיסי של "${subCategory}" ונגני אותו על כלי כדי לשמוע אותו.`,
    '2. חפשי את הדפוס: כמעט כל כלל בתאוריה נולד מצליל שנשמע טוב.',
    '3. נסי ליישם: מצאי שיר שאת אוהבת וזהי בו את הנושא.',
    '',
    'תרגיל: כתבי מנגינה של 4 תיבות המדגימה את הנושא, ונגני אותה לאט עם מטרונום.',
    '',
    '(תשובה זו נוצרה במנוע ההדגמה. הגדירי OPENAI_API_KEY לקבלת שיעורים מלאים מ-GPT.)',
  ].join('\n');
}

export async function generateLesson(ctx) {
  if (!config.openaiKey) return mockLesson(ctx);
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.openaiKey}` },
    body: JSON.stringify({
      model: config.openaiModel,
      messages: [
        { role: 'system', content: 'את/ה מורה למוזיקה מקצועי. כתוב/י שיעור ברור בעברית: הסבר, דוגמאות מוזיקליות, ותרגיל קצר בסוף.' },
        { role: 'user', content: `קטגוריה: ${ctx.category}\nתת-קטגוריה: ${ctx.subCategory}\nבקשה: ${ctx.prompt}` },
      ],
    }),
  });
  if (!res.ok) { const e = new Error('שירות ה-AI אינו זמין כרגע'); e.status = 502; throw e; }
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || mockLesson(ctx);
}

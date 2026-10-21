// Shows whether the AI is connected (an API key is configured on the server).
import useLoad from '../hooks/useLoad.js';

export default function AiBadge({ compact = false }) {
  const [s] = useLoad('/ai/status');
  if (!s) return null;
  return s.enabled
    ? <span className="aibadge on" title={`מחובר: ${s.provider} (${s.model})`}>{compact ? '✨ AI' : `✨ AI מחובר · ${s.provider === 'gemini' ? 'Gemini' : 'OpenAI'}`}</span>
    : <span className="aibadge" title="לא נמצא מפתח בקובץ backend/.env">{compact ? 'AI כבוי' : 'מצב הדגמה · ה-AI לא מחובר'}</span>;
}

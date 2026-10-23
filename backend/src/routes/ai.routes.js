import { Router } from 'express';
import { aiProvider, askModel } from '../services/ai.service.js';
import { config } from '../config/index.js';

const router = Router();
const hideKeys = (text = '') => [...config.geminiKeys, config.openaiKey].filter(Boolean).reduce((t, k) => t.split(k).join('***'), text);

/**
 * Is an AI key configured? Open /api/ai/status?test=1 in the browser to also send one real test question
 * and see the exact reason if it fails. The key itself is never returned.
 */
router.get('/status', async (req, res) => {
  const provider = aiProvider();
  const status = { enabled: provider !== null, provider, keys: provider === 'gemini' ? config.geminiKeys.length : provider === 'openai' ? 1 : 0, model: provider === 'gemini' ? config.geminiModel : provider === 'openai' ? config.openaiModel : null };
  if (req.query.test && provider) {
    try { status.ok = Boolean(await askModel({ system: 'ענה במילה אחת.', user: 'כתוב: שלום', temperature: 0 })); }
    catch (e) { status.ok = false; status.error = hideKeys(e.detail || e.message); }
  }
  // ?keys=1 checks every configured Gemini key separately (only the last 4 characters are shown), to find the one that does not work
  if (req.query.keys && provider === 'gemini') {
    status.keyChecks = [];
    for (const [i, key] of config.geminiKeys.entries()) {
      const label = `#${i + 1} ...${key.slice(-4)}`;
      try {
        const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=1', { headers: { 'x-goog-api-key': key } });
        const reason = r.ok ? 'ok' : r.status === 400 ? 'key rejected (not valid)' : r.status === 403 ? 'key blocked or API not enabled' : r.status === 429 ? 'quota used up' : `HTTP ${r.status}`;
        status.keyChecks.push({ key: label, status: r.status, result: reason });
      } catch (e) { status.keyChecks.push({ key: label, result: hideKeys(e.message) }); }
    }
  }
  res.json(status);
});

export default router;

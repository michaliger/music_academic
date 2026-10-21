import { Router } from 'express';
import { aiProvider, askModel } from '../services/ai.service.js';
import { config } from '../config/index.js';

const router = Router();
const hideKeys = (text = '') => [config.geminiKey, config.openaiKey].filter(Boolean).reduce((t, k) => t.split(k).join('***'), text);

/**
 * Is an AI key configured? Open /api/ai/status?test=1 in the browser to also send one real test question
 * and see the exact reason if it fails. The key itself is never returned.
 */
router.get('/status', async (req, res) => {
  const provider = aiProvider();
  const status = { enabled: provider !== null, provider, model: provider === 'gemini' ? config.geminiModel : provider === 'openai' ? config.openaiModel : null };
  if (req.query.test && provider) {
    try { status.ok = Boolean(await askModel({ system: 'ענה במילה אחת.', user: 'כתוב: שלום', temperature: 0 })); }
    catch (e) { status.ok = false; status.error = hideKeys(e.detail || e.message); }
  }
  res.json(status);
});

export default router;

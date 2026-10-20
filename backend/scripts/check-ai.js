// Quick check that the AI key works: `npm run ai:check`
import { aiProvider, askModel } from '../src/services/ai.service.js';

const provider = aiProvider();
if (!provider) {
  console.log('No key found. Put GEMINI_API_KEY=... (no quotes, no spaces) in backend/.env and run again.');
  process.exit(1);
}
console.log(`Provider: ${provider}. Sending a test question...`);
try {
  console.log('Answer:', await askModel({ system: 'ענה במשפט אחד בעברית.', user: 'מהו אקורד מז׳ור?' }));
  console.log('OK: the AI works.');
} catch (e) { console.log('FAILED. See the "AI request failed" line above for the exact reason.'); process.exit(1); }

import { createApp } from './app.js';
import { connectDb } from './config/db.js';
import { aiProvider } from './services/ai.service.js';
import { config } from './config/index.js';
import { seed } from './seed/index.js';

try {
  await connectDb();
  await seed();
  createApp().listen(config.port, () => console.log(`API: http://localhost:${config.port}  |  Docs: /api/docs  |  AI: ${aiProvider() ?? 'demo mode (no key found)'}`));
} catch (e) {
  console.error('Startup failed. Check MONGODB_URI and that your IP is allowed in Atlas (Network Access).\n', e.message);
  process.exit(1);
}

import mongoose from 'mongoose';
import { createApp } from './app.js';
import { seed } from './seed.js';
import { config } from './config.js';

try {
  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 8000 });
  await seed();
  createApp().listen(config.port, () => console.log(`API: http://localhost:${config.port}  |  Docs: /api/docs`));
} catch (e) {
  console.error('Startup failed. בדקי MONGODB_URI וש-IP שלך מאושר ב-Atlas (Network Access).\n', e.message);
  process.exit(1);
}

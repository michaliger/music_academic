import 'dotenv/config';

const clean = (v) => (v || '').trim().replace(/^['"]|['"]$/g, '').trim();

/** Single place where environment variables are read. */
export const config = {
  port: process.env.PORT || 4000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/music_academy',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  // Keys are trimmed and stripped of quotes: a stray space or quote in .env is the most common reason a key "is not picked up".
  geminiKey: clean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
  geminiModel: clean(process.env.GEMINI_MODEL) || 'gemini-2.5-flash',
  openaiKey: clean(process.env.OPENAI_API_KEY),
  openaiModel: clean(process.env.OPENAI_MODEL) || 'gpt-4o-mini',
  adminPhone: process.env.ADMIN_PHONE || '0500000000',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin1234',
};

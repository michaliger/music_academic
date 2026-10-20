import 'dotenv/config';

/** Single place where environment variables are read. */
export const config = {
  port: process.env.PORT || 4000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/music_academy',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  openaiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  adminPhone: process.env.ADMIN_PHONE || '0500000000',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin1234',
};

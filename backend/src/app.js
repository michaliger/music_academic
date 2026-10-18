import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import auth from './routes/auth.js';
import learning from './routes/learning.js';
import social from './routes/social.js';
import classes from './routes/classes.js';
import admin from './routes/admin.js';
import { errorHandler } from './middleware/error.js';

const EP = [
  ['post', '/auth/register', 'הרשמה'], ['post', '/auth/login', 'התחברות (JWT)'],
  ['get', '/categories', 'קטגוריות ותת-קטגוריות', 0], ['get', '/courses', 'מפת הלימוד + התקדמות'],
  ['get', '/lessons/{id}', 'שיעור'], ['post', '/lessons/{id}/quiz', 'שליחת חידון'],
  ['post', '/prompts', 'שאלה למורה ה-AI'], ['get', '/prompts/me', 'היסטוריית שאלות'],
  ['get', '/friends', 'חברות ולוח דירוג'], ['post', '/friends', 'שליחת בקשת חברות'],
  ['post', '/friends/{id}/accept', 'אישור בקשה'], ['delete', '/friends/{id}', 'הסרה/ביטול'],
  ['get', '/classes', 'הכיתות שלי'], ['post', '/classes', 'יצירת כיתה (מורה)'], ['post', '/classes/join', 'הצטרפות עם קוד'],
  ['get', '/classes/{id}/progress', 'התקדמות תלמידות הכיתה (מורה)'],
  ['get', '/admin/overview', 'סיכום מערכת (מנהלת)'], ['get', '/admin/users', 'משתמשות עם עימוד, חיפוש וסינון (מנהלת)'],
  ['patch', '/admin/users/{id}/role', 'שינוי תפקיד (מנהלת)'], ['get', '/admin/classes', 'כל הכיתות (מנהלת)'],
];
const paths = {};
for (const [m, p, summary, secured = 1] of EP) {
  const id = p.includes('{id}') ? [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }] : [];
  (paths['/api' + p] ||= {})[m] = { summary, parameters: id, ...(secured && !p.startsWith('/auth') ? { security: [{ bearer: [] }] } : {}), responses: { 200: { description: 'OK' } } };
}
const spec = { openapi: '3.0.0', info: { title: 'Music Academy API', version: '2.0.0' }, components: { securitySchemes: { bearer: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } }, paths };

export function createApp() {
  const app = express();
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors());
  app.use(express.json({ limit: '50kb' }));
  app.use('/api', rateLimit({ windowMs: 60_000, limit: 200 }));
  app.use('/api/auth', rateLimit({ windowMs: 60_000, limit: 20 }), auth);
  app.use('/api/friends', social);
  app.use('/api/classes', classes);
  app.use('/api/admin', admin);
  app.use('/api', learning);
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(spec));
  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use((_req, res) => res.status(404).json({ error: 'לא נמצא' }));
  app.use(errorHandler);
  return app;
}

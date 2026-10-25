import { ZodError } from 'zod';

export const notFound = (_req, res) => res.status(404).json({ error: 'לא נמצא' });

/** Central error handler: validation -> 400, duplicate key -> 409, otherwise the error's own status. */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'קלט לא תקין', details: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })) });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0];
    return res.status(409).json({ error: field === 'phone' ? 'מספר הטלפון הזה כבר רשום. אפשר להתחבר, או להירשם עם מספר אחר' : field === 'email' ? 'המייל הזה כבר רשום. אפשר להתחבר, או להירשם עם מייל אחר' : 'הערך כבר קיים במערכת' });
  }
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ error: status === 500 ? 'שגיאת שרת' : err.message });
}

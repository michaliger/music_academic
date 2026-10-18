# 🎼 Music Academy – פלטפורמת למידה של תאוריה מוזיקלית עם AI

מיני-MVP מלא: משתמשים נרשמים, בוחרים קטגוריה ותת-קטגוריה, שולחים בקשה ל-AI וקוראים שיעור, ומחזיקים היסטוריית למידה. כולל דשבורד מנהל.

## טכנולוגיות
- **Backend:** Node.js 18+, Express, **MongoDB Atlas + Mongoose**, JWT, bcrypt, Zod (ולידציה), Helmet, Rate-limit, Swagger UI, Jest
- **Frontend:** React 18 + Vite (RTL, עיצוב פסטלי)
- **AI:** OpenAI GPT (או מנוע Mock מובנה אם אין מפתח), עם ממשק אחיד ב-`backend/src/services/ai.js`

## מבנה הפרויקט
```
backend/src
  config.js          ניהול קונפיגורציה (dotenv)
  models.js          סכמות Mongoose: users, categories, sub_categories, prompts
  routes/            auth, learning, admin
  middleware/        auth (JWT, תפקידים), error (טיפול שגיאות מרכזי)
  services/ai.js     אינטגרציית AI
  seed.js            קטגוריות מוזיקה + משתמש מנהל
frontend/src         App.jsx, api.js, styles.css
```

## הרצה מקומית
1. **Atlas:** צרי Cluster חינמי ← Database Access (משתמש+סיסמה) ← Network Access (הוסיפי את ה-IP שלך) ← Connect ← Drivers, והעתיקי את המחרוזת.
   *(חלופה מקומית: `docker compose up -d` והשתמשי ב-`mongodb://localhost:27017/music_academy`)*
2. `cp .env.example backend/.env` ומלאי `MONGODB_URI` ו-`JWT_SECRET` (אופציונלי: `OPENAI_API_KEY`).
3. Backend:
   ```bash
   cd backend && npm install && npm run dev      # http://localhost:4000
   ```
4. Frontend (בטרמינל נוסף):
   ```bash
   cd frontend && npm install && npm run dev     # http://localhost:5173
   ```
5. התחברות מנהל: הטלפון והסיסמה מתוך `ADMIN_PHONE` / `ADMIN_PASSWORD` (ברירת מחדל `0500000000` / `admin1234`) – **שני אותם לפני פרודקשן**.

Swagger: http://localhost:4000/api/docs · בדיקות: `cd backend && npm test`

## API
| Method | Path | תיאור |
|---|---|---|
| POST | /api/auth/register, /login | הרשמה והתחברות (JWT) |
| GET | /api/categories | קטגוריות + תת-קטגוריות |
| POST | /api/prompts | שליחת בקשה ושמירת השיעור |
| GET | /api/prompts/me | היסטוריית למידה |
| GET | /api/admin/users?page&limit&search | משתמשים עם עימוד וחיפוש (מנהל) |
| GET | /api/admin/users/:id/prompts | היסטוריית משתמש (מנהל) |

## הנחות
- התחברות לפי טלפון + סיסמה (נוספה סיסמה כי נדרש JWT).
- שדות ה-id ב-API מוחזרים כ-`id` (מקור: `_id` של Mongo).
- ללא מפתח OpenAI מוחזר שיעור הדגמה, והממשק זהה.
- Atlas מחליף את ה-Docker; `docker-compose.yml` מיועד רק לפיתוח מקומי.

## פריסה (בונוס)
Backend ב-Render/Railway עם משתני ה-`.env`, Frontend ב-Vercel/Netlify עם `VITE_API_URL=https://<your-api>/api`.
"# music_academic" 

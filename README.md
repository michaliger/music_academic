# 🎼 Music Academy — AI-Driven Music Theory Learning Platform

A full-stack learning platform: structured music-theory courses with quizzes and progress tracking, an AI tutor, a song chord room,
a **composition room** where students write chords over lyrics and get theory feedback, friends and leaderboards, classes with teachers,
and an admin dashboard. Built as a production-minded MVP (REST API + MongoDB + React).

## Features
| Area | What it does |
|---|---|
| Learning | 9 courses → units → 73 lessons (232 quiz questions, ~12 hours), including a full course on building chords from intervals and tones, interactive piano examples, short quizzes with instant explanations, XP, "continue where I stopped" |
| Library | Pick a root + chord type (19) or scale/mode (14): the keyboard moves, all inversions, formulas, diatonic chords |
| AI tutor | Prompts by category / sub-category, stored as learning history (task requirement) |
| Chords for a song | Own lyrics or original AI lyrics, chords placed above words, live harmony check |
| **Composition room** | AI writes lyrics (or you write them) → you place chords on every line → listen → **harmony check** (in key / colourful / outside, roman numerals, cadences, known progressions, score) → save, copy chord sheet |
| Social | Friends by phone, XP leaderboard, shareable lesson links |
| Classes | Teachers create classes (join code) and see every student's progress |
| Admin | Users list with pagination / search / role filter, role management, every user's prompt history, system totals |

## Tech stack
- **Backend:** Node.js 18+, Express, MongoDB (Atlas) + Mongoose ODM, JWT, bcrypt, Zod, Helmet, rate limiting, Swagger UI, Jest + Supertest
- **Frontend:** React 18 + Vite, Web Audio API (no audio files)
- **AI:** OpenAI Chat Completions behind a single interface (`services/ai.service.js`) with an automatic demo fallback

## Project structure
```
.
├── docker-compose.yml          # full stack (db + api + web) or just the db
├── render.yaml                 # one-file API deployment on Render
├── .github/workflows/ci.yml    # CI: backend tests + frontend build
├── backend/
│   ├── .env.example, Dockerfile
│   ├── src/
│   │   ├── server.js           # bootstrap: connect DB → seed → listen
│   │   ├── app.js              # Express app (no DB; testable)
│   │   ├── config/             # env config, DB connection, OpenAPI spec
│   │   ├── routes/             # URL → middleware → controller (one file per feature)
│   │   ├── controllers/        # request handling, no business rules
│   │   ├── services/           # business logic: AI, harmony checker, song generation, stats
│   │   ├── models/             # Mongoose schemas (users, categories, sub_categories, prompts, ...)
│   │   ├── validators/         # Zod request schemas
│   │   ├── middleware/         # auth (JWT + roles), validation, rate limits, error handling
│   │   ├── utils/              # constants, music tables, small helpers
│   │   ├── data/curriculum/    # course content as JSON data
│   │   └── seed/               # idempotent seeding (curriculum + admin)
│   └── tests/
└── frontend/
    ├── .env.example
    └── src/
        ├── App.jsx, main.jsx
        ├── pages/              # one file per screen
        ├── components/         # Piano, PromptCard, Bar, composer/*
        ├── hooks/              # useLoad
        ├── music/              # theory tables, Web Audio playback
        ├── api/ , utils/ , styles/
```

## Setup & run locally
**Prerequisites:** Node.js 18+, a MongoDB Atlas free cluster (or Docker for local MongoDB).

1. **Database** — Atlas: create a cluster → *Database Access* (user + password) → *Network Access* (your IP) → *Connect → Drivers* and copy the URI.
   Local alternative: `docker compose up -d` and use `mongodb://localhost:27017/music_academy`.
2. **Backend**
   ```bash
   cd backend
   cp .env.example .env      # Windows PowerShell: Copy-Item .env.example .env
   # edit .env: MONGODB_URI, JWT_SECRET (optionally GEMINI_API_KEY)
   npm install
   npm run dev               # http://localhost:4000  (Swagger: /api/docs)
   ```
   On first start the curriculum and an admin account (`ADMIN_PHONE` / `ADMIN_PASSWORD`) are created automatically.
3. **Frontend** (second terminal)
   ```bash
   cd frontend
   npm install
   npm run dev               # http://localhost:5173
   ```
4. **Tests:** `cd backend && npm test`

### Run everything with Docker (no Node needed)
```bash
docker compose up --build     # app: http://localhost:8080 · API docs: http://localhost:8080/api/docs
```
Optional variables (`JWT_SECRET`, `GEMINI_API_KEY`, `OPENAI_API_KEY`, `ADMIN_PHONE`, `ADMIN_PASSWORD`) are read from your shell or a root `.env` file. Database only: `docker compose up -d mongo`.

> Fresh start recommended: if you ran an earlier version against the same Atlas database, drop the database first (collection names changed to match the task: `users`, `categories`, `sub_categories`, `prompts`).

### Environment variables (`backend/.env`)
| Variable | Purpose |
|---|---|
| `MONGODB_URI` | Atlas or local MongoDB connection string |
| `JWT_SECRET` | Signing key for JWTs (use a long random value) |
| `GEMINI_API_KEY` | Optional. Google Gemini (preferred provider). Verify with `npm run ai:check` |
| `GEMINI_MODEL` | Default `gemini-2.5-flash` |
| `OPENAI_API_KEY` | Optional alternative provider. Without it every AI feature uses the built-in demo engine behind the same interface |
| `OPENAI_MODEL` | Default `gpt-4o-mini` |
| `ADMIN_PHONE`, `ADMIN_PASSWORD` | Admin account created on first start — change before deploying |

## Roles
`student` (default) · `teacher` (creates classes, sees their students' progress) · `admin` (everything + role management in the *Admin* tab).
To make a teacher: sign in as admin → *ניהול* → change the user's role.

## API overview
Interactive docs at **`/api/docs`** (Swagger UI). Main groups: `/auth`, `/categories`, `/courses`, `/lessons`, `/prompts`, `/friends`, `/classes`,
`/songs`, `/compositions` (`/lyrics`, `/analyze`), `/admin`. Protected routes expect `Authorization: Bearer <JWT>`; all errors are JSON `{ error, details? }`.

## Task requirements checklist
| Requirement | Status |
|---|---|
| REST API with structured routes; layers: routes / controllers / models / services | ✅ |
| Database + ORM (MongoDB + Mongoose), relationships and constraints (refs, unique indexes, enums, required) | ✅ |
| Models: `users`, `categories`, `sub_categories`, `prompts` (user, category, sub-category, prompt, response, created at); a user has many prompts | ✅ (camelCase field names, e.g. `userId` ≙ `user_id`) |
| AI integration: OpenAI or mock behind a clear interface | ✅ `ai.service.js` (+ demo fallback) |
| Dashboard: register, select category & sub-category, submit prompt, view response, view history | ✅ |
| Admin dashboard: all users + their prompt history | ✅ |
| README: setup, technologies, assumptions, how to run, `.env` example | ✅ |
| Docker Compose for the database | ✅ DB-only or full stack (db + api + web) |
| dotenv / configuration management | ✅ `config/` |
| Input validation + API error handling | ✅ Zod + central error middleware |
| Clean, documented, modular code | ✅ |
| Public GitHub repo with clear commit history | ⏳ done by the submitter |
| **Bonus:** JWT auth | ✅ |
| **Bonus:** pagination & filtering in admin | ✅ page / limit / search / role |
| **Bonus:** unit / integration tests | ✅ Jest + Supertest (harmony checker, services, validators, curriculum, API guards) |
| Extra: CI pipeline | ✅ GitHub Actions (tests + build on every push) |
| **Bonus:** Swagger / OpenAPI | ✅ |
| **Bonus:** TypeScript | ❌ not used |
| **Bonus:** deployed demo | ⏳ see below |

## Approach (short note for the submission email)
I split the backend into strict layers — routes only wire URLs to middleware and controllers, controllers translate HTTP to service calls, and all
business rules live in services — so every piece can be tested without a database. Everything that can go wrong at the edge (validation, auth, roles,
rate limits, malformed ids) is handled by middleware and one central error handler, and all AI calls pass through a single interface with a deterministic
demo fallback, so the project runs fully without an API key.
Beyond the required prompt/history flow I treated it as a real product: a structured curriculum with graded quizzes, progress and classes for teachers,
and a composition room whose harmony feedback comes from a deterministic theory engine (not an LLM), so the guidance students get is always correct.

## Assumptions
- Phone + password login (a password was added because JWT auth is a bonus requirement).
- Fields use camelCase in the database (`userId`, `categoryId`, `subCategoryId`, `createdAt`) instead of snake_case.
- Chord feedback supports 19 chord types and major / natural-minor keys; the minor harmonic dominant and common borrowed chords count as "colour".
- Quiz answers are revealed per question for instant teaching feedback; XP is awarded once per lesson on the first pass.

## Deployment (bonus)
Backend → Render (`render.yaml` Blueprint included; add `MONGODB_URI` etc. in the dashboard) or Railway (start command `npm start`). Frontend → Vercel / Netlify with `VITE_API_URL=https://<api-host>/api`.


## Content map (curriculum)

Basics → Scales & intervals → Harmony → **Building chords by tones** (intervals, stacking thirds, formulas, sevenths and extensions, inversions, slash chords, voicings) → Advanced harmony → Keys & modes → Songwriting → Rhythm, form & arranging → Ear training.
All lessons are JSON files in `backend/src/data/curriculum/`; the order is set in `index.js`. Restarting the API re-seeds new lessons.

## UI notes

- Landing: realistic piano (mouse or computer keys `A S D F...`), floating notes, optional quiet background music (generated with Web Audio, starts only after a click, volume slider).
- Map: whole-course track with a finish flag, remaining lessons/hours, and every course visible at once.
- Lesson: wide layout with a side panel (facts, outline, lessons in the unit, free piano).

## Composition room

Lyrics come from the AI (original lyrics only) or are pasted by the student. A chord is placed above any word (`{ symbol, at, beats }`), each chord has its own length in beats, the time signature sets the bar length, and the rule-based checker validates the progression against the key. `GET /api/ai/status` tells the UI whether a Gemini/OpenAI key is configured.

## AI diagnostics

Put `GEMINI_API_KEY=your_key` (no quotes, no spaces) in `backend/.env` and restart the API. The start-up line shows `AI: gemini`. Run `npm run ai:check` in `backend`, or open `http://localhost:4000/api/ai/status?test=1` to send one real test question and see the exact reason if it fails. A Gemini key written by mistake in `OPENAI_API_KEY` is detected automatically.

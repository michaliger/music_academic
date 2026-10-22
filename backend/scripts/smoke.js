// End-to-end smoke test against a RUNNING API: `npm run smoke` (default http://localhost:4000/api, or pass a URL).
// Registers a throw-away user, then walks through the main features and prints ✓ / ✗ for each step.
const BASE = (process.argv[2] || process.env.API_URL || 'http://localhost:4000/api').replace(/\/$/, '');
const stamp = Date.now();
const phone = `05${String(stamp).slice(-8)}`;
const email = `smoke${stamp}@example.com`;
let token = '';
let failures = 0;

async function call(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }
  return { status: res.status, data };
}

async function step(name, fn) {
  try {
    const note = await fn();
    console.log(`✓ ${name}${note ? ` — ${note}` : ''}`);
  } catch (e) {
    failures += 1;
    console.log(`✗ ${name} — ${e.message}`);
  }
}
const expect = (cond, msg) => { if (!cond) throw new Error(msg); };

let courses, lesson, categories;

await step('API is up', async () => { const r = await call('GET', '/health'); expect(r.status === 200, `status ${r.status}`); });
await step('register (name, phone, e-mail, password)', async () => {
  const r = await call('POST', '/auth/register', { name: 'בדיקה אוטומטית', phone, email, password: 'secret123' });
  expect(r.status === 201 && r.data?.token, `status ${r.status} ${JSON.stringify(r.data)}`);
  token = r.data.token;
});
await step('register rejects bad input', async () => {
  const r = await call('POST', '/auth/register', { name: 'a', phone: '1', email: 'x', password: '1' });
  expect(r.status === 400, `expected 400, got ${r.status}`);
});
await step('login', async () => {
  const r = await call('POST', '/auth/login', { phone, password: 'secret123' });
  expect(r.status === 200 && r.data?.token, `status ${r.status}`);
});
await step('login rejects a wrong password', async () => {
  const r = await call('POST', '/auth/login', { phone, password: 'wrong-password' });
  expect(r.status === 401, `expected 401, got ${r.status}`);
});
await step('courses and lessons are seeded', async () => {
  const r = await call('GET', '/courses');
  expect(r.status === 200 && r.data?.courses?.length >= 9, `status ${r.status}`);
  courses = r.data.courses;
  const count = courses.flatMap((c) => c.subCategories.flatMap((s) => s.lessons)).length;
  expect(count >= 70, `only ${count} lessons`);
  return `${courses.length} courses, ${count} lessons`;
});
await step('open a lesson and pass its quiz', async () => {
  const first = courses[0].subCategories[0].lessons[0];
  const r = await call('GET', `/lessons/${first.id}`);
  expect(r.status === 200 && r.data?.quiz?.length, `status ${r.status}`);
  lesson = r.data;
  const answers = [];
  for (let i = 0; i < lesson.quiz.length; i += 1) {
    // the instant-feedback endpoint returns the right answer
    const c = await call('POST', `/lessons/${first.id}/check`, { index: i, answer: 0 });
    expect(c.status === 200, `check ${c.status}`);
    answers.push(c.data.answer);
  }
  const q = await call('POST', `/lessons/${first.id}/quiz`, { answers });
  expect(q.status === 200 && q.data?.passed, `quiz result ${JSON.stringify(q.data)?.slice(0, 120)}`);
  return `score ${q.data.score}%`;
});
await step('categories for the AI teacher', async () => {
  const r = await call('GET', '/categories');
  expect(r.status === 200 && r.data?.length && r.data[0].subCategories?.length, `status ${r.status}`);
  categories = r.data;
});
await step('ask the AI teacher (saved to history)', async () => {
  const cat = categories[0];
  const r = await call('POST', '/prompts', { categoryId: cat.id, subCategoryId: cat.subCategories[0].id, prompt: 'מה זה סולם מז׳ור?' });
  expect(r.status === 201 || r.status === 200, `status ${r.status} ${JSON.stringify(r.data)}`);
  expect(r.data?.response?.length > 20, 'empty answer');
  return `${r.data.response.length} characters (check the server log: "AI answered" = real AI, "using demo" = fallback)`;
});
await step('prompt history', async () => {
  const r = await call('GET', '/prompts/me');
  expect(r.status === 200 && r.data.length >= 1, `status ${r.status}`);
});
await step('harmony check of a progression', async () => {
  const r = await call('POST', '/compositions/analyze', { key: 'C', mode: 'major', beatsPerBar: 4, sections: [{ name: 'בית', lines: [{ text: 'שלום עולם יפה', chords: [{ symbol: 'C', at: 0, beats: 4 }, { symbol: 'F', at: 1, beats: 4 }, { symbol: 'G', at: 2, beats: 4 }] }] }] });
  expect(r.status === 200, `status ${r.status} ${JSON.stringify(r.data)?.slice(0, 120)}`);
});
await step('save, list and delete a song', async () => {
  const body = { title: 'שיר בדיקה', key: 'C', mode: 'major', tempo: 100, beatsPerBar: 4, sections: [{ name: 'בית', lines: [{ text: 'שלום עולם', chords: [{ symbol: 'C', at: 0, beats: 4 }] }] }] };
  const c = await call('POST', '/compositions', body);
  expect(c.status === 201, `create ${c.status} ${JSON.stringify(c.data)?.slice(0, 150)}`);
  const l = await call('GET', '/compositions');
  expect(l.status === 200 && l.data.length >= 1, 'list failed');
  const d = await call('DELETE', `/compositions/${c.data.id}`);
  expect(d.status === 200 || d.status === 204, `delete ${d.status}`);
});
await step('friends: unknown e-mail is a clear 404', async () => {
  const r = await call('POST', '/friends', { email: `nobody${stamp}@example.com` });
  expect(r.status === 404, `expected 404, got ${r.status}`);
});
await step('friends screen data', async () => {
  const r = await call('GET', '/friends');
  expect(r.status === 200 && r.data.leaderboard?.length >= 1, `status ${r.status}`);
});
await step('admin routes are closed to a student', async () => {
  const r = await call('GET', '/admin/users');
  expect(r.status === 403, `expected 403, got ${r.status}`);
});
await step('protected routes need a token', async () => {
  const saved = token; token = '';
  const r = await call('GET', '/courses');
  token = saved;
  expect(r.status === 401, `expected 401, got ${r.status}`);
});
await step('admin login and dashboard data', async () => {
  const phoneAdmin = process.env.ADMIN_PHONE;
  const passAdmin = process.env.ADMIN_PASSWORD;
  if (!phoneAdmin || !passAdmin) return 'skipped (run with ADMIN_PHONE and ADMIN_PASSWORD set to include it)';
  const saved = token;
  const l = await call('POST', '/auth/login', { phone: phoneAdmin, password: passAdmin });
  expect(l.status === 200, `admin login ${l.status}`);
  token = l.data.token;
  const u = await call('GET', '/admin/users?page=1&limit=5');
  const o = await call('GET', '/admin/overview');
  token = saved;
  expect(u.status === 200 && o.status === 200, `users ${u.status}, overview ${o.status}`);
  return `${u.data.total} users in total`;
});
await step('AI status route', async () => {
  const r = await call('GET', '/ai/status');
  expect(r.status === 200, `status ${r.status}`);
  return JSON.stringify(r.data);
});

console.log(failures ? `\n${failures} step(s) failed.` : '\nAll steps passed. The server side is working.');
process.exit(failures ? 1 : 0);

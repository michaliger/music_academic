import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

test('health check', async () => {
  const res = await request(app).get('/api/health');
  expect(res.status).toBe(200);
});

test('unknown route returns 404 JSON', async () => {
  const res = await request(app).get('/api/nope');
  expect(res.status).toBe(404);
});

test('register validates input before touching the DB', async () => {
  const res = await request(app).post('/api/auth/register').send({ name: 'a', phone: '123', password: '1' });
  expect(res.status).toBe(400);
  expect(res.body.details.length).toBeGreaterThan(0);
});

test.each(['/api/courses', '/api/prompts/me', '/api/friends', '/api/classes', '/api/songs', '/api/compositions', '/api/admin/users'])(
  '%s requires a JWT',
  async (path) => {
    expect((await request(app).get(path)).status).toBe(401);
  },
);

test('swagger docs are served', async () => {
  const res = await request(app).get('/api/docs/');
  expect(res.status).toBe(200);
});

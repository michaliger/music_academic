// OpenAPI spec, generated from a compact endpoint list: [method, path, summary, requiresAuth].
const ENDPOINTS = [
  ['post', '/auth/register', 'Register', false], ['post', '/auth/login', 'Log in (returns JWT)', false],
  ['get', '/categories', 'Categories with sub-categories', false], ['get', '/courses', 'Learning map with my progress'],
  ['get', '/lessons/{id}', 'Lesson content'], ['post', '/lessons/{id}/check', 'Check one quiz answer'],
  ['post', '/lessons/{id}/quiz', 'Submit a quiz (grades, awards XP)'],
  ['post', '/prompts', 'Send a prompt to the AI tutor'], ['get', '/prompts/me', 'My learning history'],
  ['get', '/friends', 'Friends and leaderboard'], ['post', '/friends', 'Send a friend request by phone'],
  ['post', '/friends/{id}/accept', 'Accept a request'], ['delete', '/friends/{id}', 'Remove or cancel'],
  ['get', '/classes', 'My classes'], ['post', '/classes', 'Create a class (teacher)'], ['post', '/classes/join', 'Join with a code'],
  ['get', '/classes/{id}/progress', 'Class progress (teacher)'],
  ['post', '/songs/generate', 'AI song: chords, structure and lyrics'], ['get', '/songs', 'My generated songs'], ['delete', '/songs/{id}', 'Delete a song'],
  ['post', '/compositions/lyrics', 'AI lyrics for a theme'], ['post', '/compositions/analyze', 'Check chords against the key (?ai=1 adds a mentor comment)'],
  ['get', '/compositions', 'My compositions'], ['post', '/compositions', 'Create a composition'],
  ['get', '/compositions/{id}', 'Get a composition'], ['put', '/compositions/{id}', 'Update a composition'], ['delete', '/compositions/{id}', 'Delete a composition'],
  ['get', '/admin/overview', 'System totals (admin)'], ['get', '/admin/users', 'Users: pagination, search, role filter (admin)'],
  ['patch', '/admin/users/{id}/role', 'Change role (admin)'], ['get', '/admin/users/{id}/prompts', 'A user\'s prompt history (admin)'],
  ['get', '/admin/classes', 'All classes (admin)'],
];

const paths = {};
for (const [method, path, summary, secured = true] of ENDPOINTS) {
  (paths[`/api${path}`] ||= {})[method] = {
    summary,
    parameters: path.includes('{id}') ? [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }] : [],
    ...(secured && { security: [{ bearer: [] }] }),
    responses: { 200: { description: 'OK' } },
  };
}

export const swaggerSpec = {
  openapi: '3.0.0',
  info: { title: 'Music Academy API', version: '2.0.0' },
  components: { securitySchemes: { bearer: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } },
  paths,
};

// Thin fetch wrapper: adds the JWT, parses JSON and turns API errors into Error(message).
const BASE = import.meta.env.VITE_API_URL || '/api';

export async function api(path, { method = 'GET', body } = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) { localStorage.clear(); location.reload(); } // expired session
    throw new Error(data.details?.map((d) => d.message).join(' · ') || data.error || 'שגיאה לא צפויה');
  }
  return data;
}

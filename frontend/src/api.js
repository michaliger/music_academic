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
    if (res.status === 401 && token) { localStorage.clear(); location.reload(); }
    throw new Error(data.details?.map((d) => d.message).join(' · ') || data.error || 'שגיאה לא צפויה');
  }
  return data;
}

export const fmt = (d) => new Date(d).toLocaleString('he-IL', { dateStyle: 'medium', timeStyle: 'short' });
export const daysAgo = (d) => {
  if (!d) return 'עוד לא התחילה';
  const n = Math.floor((Date.now() - new Date(d)) / 864e5);
  return n === 0 ? 'היום' : n === 1 ? 'אתמול' : `לפני ${n} ימים`;
};
export const ROLE_LABEL = { student: 'תלמידה', teacher: 'מורה', admin: 'מנהלת' };

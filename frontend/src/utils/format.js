export const fmt = (date) => new Date(date).toLocaleString('he-IL', { dateStyle: 'medium', timeStyle: 'short' });

/** "היום" / "אתמול" / "לפני N ימים" for a last-activity date. */
export const daysAgo = (date) => {
  if (!date) return 'עוד לא התחילה';
  const n = Math.floor((Date.now() - new Date(date)) / 864e5);
  return n === 0 ? 'היום' : n === 1 ? 'אתמול' : `לפני ${n} ימים`;
};

export const ROLE_LABEL = { student: 'תלמידה', teacher: 'מורה', admin: 'מנהלת' };

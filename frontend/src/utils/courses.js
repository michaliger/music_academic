// Presentation info per course (icon + one-line description). New courses fall back to a generic icon.
export const COURSE_INFO = {
  'יסודות המוזיקה': ['𝄞', 'מקלדת, תווים, קצב וסימני הבעה: הבסיס של הכול'],
  'סולמות ואינטרוולים': ['♯', 'איך בנויים סולמות ומודים, והמרחקים בין צלילים'],
  'הרמוניה': ['♫', 'אקורדים, ספטימות וקדנצות: איך צלילים עובדים יחד'],
  'בניית אקורדים לפי טונים': ['♩', 'מרווחים, הערמת טרצות, נוסחאות, היפוכים והעמדות'],
  'הרמוניה מתקדמת': ['♬', 'דומיננטות משניות, שאילה, מודולציה ומהלכי פופ וג׳אז'],
  'מפתחות ומודים': ['♮', 'מעגל הקווינטות, סימני סולם ושבעת המודים'],
  'הלחנה ויצירה': ['♪', 'מבנה שיר, מלודיה וליווי עד לשיר הראשון שלך'],
  'קצב, מבנה ועיבוד': ['♭', 'סינקופה, משקלים, צורות שיר, עיבוד והפקה'],
  'חוש שמיעה': ['♫', 'מזהים אינטרוולים, אקורדים ומהלכים באוזן'],
};
export const infoOf = (name) => COURSE_INFO[name] || ['♪', ''];

/** Flat list of all lessons in a /courses response, plus totals used by the landing page and the map. */
export function summarize(courses) {
  const lessons = courses.flatMap((c) => c.subCategories.flatMap((s) => s.lessons));
  return { lessons, minutes: lessons.reduce((n, l) => n + (l.minutes || 0), 0) };
}

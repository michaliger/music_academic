// Landing page: a playable piano that releases floating notes, what the site offers, and the full course path.
import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import HeroPiano from '../components/HeroPiano.jsx';
import MusicToggle from '../components/MusicToggle.jsx';
import { infoOf, summarize } from '../utils/courses.js';

const FEATURES = [
  { tab: 'map', icon: '𝄞', title: 'מפת לימוד', text: 'עשרות שיעורים קצרים בתשעה קורסים, עם דוגמאות שאפשר לשמוע. האתר זוכר איפה עצרת.' },
  { tab: 'library', icon: '♯', title: 'ספריית אקורדים וסולמות', text: 'בוחרים אקורד או סולם והמקלדת מראה אותו מיד, כולל כל ההיפוכים.' },
  { tab: 'practice', icon: '♫', title: 'אימון שמיעה', text: 'מזהים אינטרוולים ואקורדים באוזן ומשפרים ניקוד אחרי ניקוד.' },
  { tab: 'compose', icon: '♪', title: 'אקורדים לשיר', text: 'כותבות או מקבלות מילים מוכנות, מניחות אקורדים מעל המילים, שומעות ובודקות אם זה מתאים.' },
  { tab: 'friends', icon: '♬', title: 'חברות וכיתות', text: 'לוח דירוג בין חברות, וכיתות שבהן המורה רואה את ההתקדמות של כולן.' },
];

const STEPS = [
  ['1', 'לומדות', 'שיעור קצר עם הסבר ודוגמה שאפשר לשמוע'],
  ['2', 'בוחנות את עצמן', 'בוחן של שאלה אחת בכל פעם, עם הסבר אחרי כל תשובה'],
  ['3', 'יוצרות', 'כותבות שיר משלהן ומקבלות משוב מקצועי'],
];

export default function Landing({ user, go }) {
  const [data, setData] = useState(null);
  useEffect(() => { api('/courses').then((d) => setData(d?.courses ? d : null)).catch(() => setData(null)); }, []);
  const total = data ? summarize(data.courses) : null;

  return (
    <>
      <section className="hero-panel fullbleed">
        <div className="hero-top"><MusicToggle /></div>
        <div className="hero-text">
          <small>שלום, {user.name}</small>
          <h1>מוזיקה שלומדים באוזן, בעיניים ובלב</h1>
          <p>תאוריה מוזיקלית מהצליל הראשון ועד שיר משלך: שומעים, מנגנים, נבחנים ומלחינים. הכול במקום אחד, בקצב שלך.</p>
          <div className="row">
            <button className="cta-gold" onClick={() => go('map')}>התחילי ללמוד ←</button>
            <button className="cta-line" onClick={() => go('library')}>לספריית האקורדים</button>
          </div>
        </div>
        <HeroPiano />
      </section>

      <div className="homebody">
      {total && (
        <section className="statband">
          <div><b>{total.lessons.length}</b><span>שיעורים</span></div>
          <div><b>{data.courses.length}</b><span>קורסים</span></div>
          <div><b>{Math.round(total.minutes / 60)}</b><span>שעות לימוד</span></div>
          <div><b>{data.completed}</b><span>שיעורים שהשלמת</span></div>
        </section>
      )}

      {data && (
        <section>
          <h2 className="sect-title">כל המסלול במבט אחד</h2>
          <p className="muted center">מהצליל הראשון ועד לשיר מלא. לחצי על קורס כדי לראות את כל השיעורים שלו.</p>
          <ol className="path">
            {data.courses.map((c, i) => {
              const all = c.subCategories.flatMap((s) => s.lessons);
              const done = all.filter((l) => l.done).length;
              return (
                <li key={c.id}>
                  <button className={`pathcard c${i % 5}`} onClick={() => go('map')}>
                    <span className="pnum">{i + 1}</span>
                    <span className="picon">{infoOf(c.name)[0]}</span>
                    <b>{c.name}</b>
                    <small>{all.length} שיעורים · {c.subCategories.length} יחידות</small>
                    <span className="pbar"><i style={{ width: `${all.length ? (100 * done) / all.length : 0}%` }} /></span>
                  </button>
                </li>
              );
            })}
            <li className="pathend"><span>♬</span><b>שיר משלך</b><small>סוף המסלול</small></li>
          </ol>
        </section>
      )}

      <section>
        <h2 className="sect-title">מה יש באתר?</h2>
        <div className="features">
          {FEATURES.map((f) => (
            <button key={f.tab} className="feature" onClick={() => go(f.tab)}>
              <span className="ficon">{f.icon}</span>
              <b>{f.title}</b>
              <span>{f.text}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="card steps">
        <h2 className="sect-title">איך זה עובד?</h2>
        <div className="stepgrid">
          {STEPS.map(([n, title, text]) => (
            <div key={n} className="step"><span className="stepnum">{n}</span><b>{title}</b><span className="muted">{text}</span></div>
          ))}
        </div>
      </section>

      <section className="endcta">
        <h2>מוכנה להתחיל?</h2>
        <button className="cta-gold" onClick={() => go('map')}>לשיעור הראשון ←</button>
      </section>
      </div>
    </>
  );
}

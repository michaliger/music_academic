// Landing page: a playable piano that releases floating notes, then what the site offers.
import HeroPiano from '../components/HeroPiano.jsx';

const FEATURES = [
  { tab: 'map', icon: '🗺️', title: 'מפת לימוד', text: '24 שיעורים קצרים בחמישה קורסים, עם דוגמאות שאפשר לשמוע. האתר זוכר איפה עצרת.' },
  { tab: 'library', icon: '🎹', title: 'ספריית אקורדים וסולמות', text: 'בוחרים אקורד או סולם והמקלדת מראה אותו מיד, כולל כל ההיפוכים.' },
  { tab: 'practice', icon: '👂', title: 'אימון שמיעה', text: 'מזהים אינטרוולים ואקורדים באוזן ומשפרים ניקוד אחרי ניקוד.' },
  { tab: 'studio', icon: '✨', title: 'סטודיו שירים עם AI', text: 'מצב רוח, סגנון ונושא, וה-AI בונה מהלך אקורדים, מבנה ומילים.' },
  { tab: 'compose', icon: '🎼', title: 'חדר הלחנה', text: 'כותבות אקורדים על מילים, שומעות, ומקבלות בדיקה אם זה מתאים לסולם.' },
  { tab: 'friends', icon: '👭', title: 'חברות וכיתות', text: 'לוח דירוג בין חברות, וכיתות שבהן המורה רואה את ההתקדמות של כולן.' },
];

const STEPS = [
  ['1', 'לומדות', 'שיעור קצר עם הסבר ודוגמה שאפשר לשמוע'],
  ['2', 'בוחנות את עצמן', 'בוחן של שאלה אחת בכל פעם, עם הסבר אחרי כל תשובה'],
  ['3', 'יוצרות', 'כותבות שיר משלהן ומקבלות משוב מקצועי'],
];

export default function Landing({ user, go }) {
  return (
    <>
      <section className="hero-panel">
        <div className="hero-text">
          <small>שלום, {user.name} 👋</small>
          <h1>מוזיקה שלומדים באוזן, בעיניים ובלב</h1>
          <p>תאוריה מוזיקלית צעד אחר צעד: שומעים, מנגנים, נבחנים ולבסוף מלחינים שיר משלכם. לחצי על הקלידים ותראי.</p>
          <div className="row">
            <button className="cta-gold" onClick={() => go('map')}>התחילי ללמוד ←</button>
            <button className="cta-line" onClick={() => go('library')}>לספריית האקורדים</button>
          </div>
        </div>
        <HeroPiano />
      </section>

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
    </>
  );
}

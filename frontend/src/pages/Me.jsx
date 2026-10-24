// "My area": streak, totals and a day-by-day log of what the student did.
import useLoad from '../hooks/useLoad.js';

const LABEL = { lesson: 'למדה שיעור', quiz: 'עשתה בוחן', question: 'שאלה את המורה', song: 'שמרה שיר' };
const fmtDay = (d) => new Intl.DateTimeFormat('he-IL', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Jerusalem' }).format(new Date(`${d}T12:00:00Z`));
const fmtTime = (t) => new Intl.DateTimeFormat('he-IL', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jerusalem' }).format(new Date(t));

export default function Me({ user, go }) {
  const [data, err] = useLoad('/me/activity');
  if (err) return <div className="error">{err}</div>;
  if (!data) return <p className="muted">טוען...</p>;
  const max = Math.max(1, ...data.last14.map((d) => d.count));
  return (
    <>
      <section className="card mapbar">
        <div className="mb-title"><small className="muted">האזור של {user.name}</small><h2>מה עשיתי עד עכשיו</h2></div>
        <div className="statnums">
          <div><b>{data.streak}</b><small>ימים ברצף</small></div>
          <div><b>{data.activeDays}</b><small>ימים פעילים (60 יום)</small></div>
          <div><b>{data.totals.quizzes}</b><small>בחנים</small></div>
          <div><b>{data.totals.questions}</b><small>שאלות למורה</small></div>
        </div>
        <p className="muted">{data.streak >= 3 ? `מתמידה! ${data.streak} ימים ברצף.` : data.today ? 'היום כבר למדת. כל הכבוד.' : 'עוד לא למדת היום. שיעור קצר אחד מספיק כדי להמשיך ברצף.'}</p>
        <div className="row"><button onClick={() => go('map')}>להמשך הלימוד</button></div>
      </section>
      <section className="card">
        <h3>14 הימים האחרונים</h3>
        <div className="mebars" aria-label="פעילות לפי יום">
          {data.last14.map((d) => <div key={d.date} className="mebar" title={`${fmtDay(d.date)}: ${d.count} פעולות`}><i style={{ height: `${d.count ? 12 + (88 * d.count) / max : 4}%` }} className={d.count ? 'on' : ''} /><small>{Number(d.date.slice(8))}</small></div>)}
        </div>
      </section>
      <section className="card">
        <h3>יומן יום אחר יום</h3>
        {data.days.length ? data.days.map((d) => (
          <div key={d.date} className="meday">
            <h4>{fmtDay(d.date)} <small className="muted">· {d.items.length} פעולות{d.xp ? ` · ${d.xp} XP` : ''}</small></h4>
            <ul>{d.items.map((i, k) => <li key={k}><span className="muted">{fmtTime(i.at)}</span> {LABEL[i.type]}: <b>{i.title}</b>{i.type === 'quiz' && <> · ציון {i.score}%{i.xp ? ` · +${i.xp} XP` : ''}</>}</li>)}</ul>
          </div>
        )) : <p className="muted">עוד אין פעילות. פתחי שיעור במפת הלימוד והיומן יתחיל להתמלא.</p>}
      </section>
    </>
  );
}

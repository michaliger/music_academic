// Learning map: progress summary, "continue where you stopped" and all lessons.
import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

export default function Home({ user, go }) {
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { api('/courses').then(setD).catch((e) => setErr(e.message)); }, []);
  if (err) return <div className="error">{err}</div>;
  if (!d) return <p className="muted">טוען...</p>;

  const all = d.courses.flatMap((c) => c.subCategories.flatMap((s) => s.lessons));
  const pct = all.length ? Math.round((100 * d.completed) / all.length) : 0;
  const last = all.find((l) => l.id === d.lastLessonId);
  const cont = last && !last.done ? last : all.find((l) => !l.done);

  return (
    <>
      <section className="card stats">
        <div><small className="muted">שלום, {user.name}</small><h2>ההתקדמות שלך</h2></div>
        <div className="statnums"><div><b>{d.xp}</b><small>XP</small></div><div><b>{d.completed}/{all.length}</b><small>שיעורים</small></div></div>
        <div className="bar"><i style={{ width: `${pct}%` }} /></div>
      </section>
      {cont ? (
        <section className="card cont">
          <div><small className="muted">{last && !last.done ? 'המשיכי מהמקום שעצרת' : 'השיעור הבא שלך'}</small><h3>{cont.title}</h3></div>
          <button onClick={() => go('lesson', cont.id)}>המשך ▶</button>
        </section>
      ) : <section className="card">🎉 סיימת את כל השיעורים הקיימים! אפשר להתאמן באימון השמיעה או לשאול את המורה.</section>}
      {d.courses.map((c) => (
        <section className="card" key={c.id}>
          <h2>{c.name}</h2>
          {c.subCategories.map((s) => (
            <div key={s.id} className="unit">
              <h4>{s.name}</h4>
              {s.lessons.map((l, i) => (
                <button key={l.id} className={`lrow ${l.done ? 'done' : ''}`} onClick={() => go('lesson', l.id)}>
                  <span className="num">{l.done ? '✓' : i + 1}</span><span className="lt">{l.title}</span>
                  <small>{l.done ? `${l.score}%` : `${l.minutes} דק׳ · ${l.xp} XP`}</small>
                </button>
              ))}
            </div>
          ))}
        </section>
      ))}
    </>
  );
}

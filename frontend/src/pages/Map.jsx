// Learning map: progress summary, "continue where you stopped", and every course as a card in a full-width grid.
import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import Bar from '../components/Bar.jsx';
import { infoOf, summarize } from '../utils/courses.js';

export default function LearningMap({ user, go }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { api('/courses').then(setData).catch((e) => setErr(e.message)); }, []);
  if (err) return <div className="error">{err}</div>;
  if (!data) return <p className="muted">טוען...</p>;

  const { lessons, minutes } = summarize(data.courses);
  const leftMinutes = lessons.filter((l) => !l.done).reduce((n, l) => n + (l.minutes || 0), 0);
  const percent = lessons.length ? Math.round((100 * data.completed) / lessons.length) : 0;
  const last = lessons.find((l) => l.id === data.lastLessonId);
  const next = last && !last.done ? last : lessons.find((l) => !l.done); // where to continue

  return (
    <>
      <section className="card mapbar">
        <div className="mb-title"><small className="muted">שלום, {user.name}</small><h2>מפת הלימוד</h2></div>
        <div className="statnums">
          <div><b>{data.xp}</b><small>נקודות XP</small></div>
          <div><b>{data.completed}/{lessons.length}</b><small>שיעורים הושלמו</small></div>
          <div><b>{percent}%</b><small>מהקורס</small></div>
        </div>
        {next ? (
          <div className="mb-next">
            <div><small className="muted">{last && !last.done ? 'המשיכי מהמקום שעצרת' : 'השיעור הבא שלך'}</small><b>{next.title}</b></div>
            <button onClick={() => go('lesson', next.id)}>המשך ▶</button>
          </div>
        ) : <div className="mb-next">🎉 סיימת את כל השיעורים! אפשר להתאמן באימון השמיעה או להלחין.</div>}
      </section>

      <section className="card track" aria-label="מסלול הלימוד כולו">
        <div className="track-head">
          <h3>המסלול כולו: {lessons.length} שיעורים, כ-{Math.round(minutes / 60)} שעות</h3>
          <span className="muted">{lessons.length - data.completed ? `נשארו ${lessons.length - data.completed} שיעורים (כ-${Math.max(1, Math.round(leftMinutes / 60))} שעות) עד הסוף` : 'סיימת את כל המסלול!'}</span>
        </div>
        <div className="track-line">
          {data.courses.map((c, i) => {
            const all = c.subCategories.flatMap((u) => u.lessons);
            const done = all.filter((l) => l.done).length;
            return (
              <a key={c.id} href={`#course-${c.id}`} className={`tseg c${i % 5}`} style={{ flexGrow: all.length }} title={`${c.name}: ${done}/${all.length}`}
                onClick={(e) => { e.preventDefault(); document.getElementById(`course-${c.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>
                <i style={{ width: `${(100 * done) / all.length}%` }} />
                <span>{infoOf(c.name)[0]} <b>{c.name}</b> <small>{done}/{all.length}</small></span>
              </a>
            );
          })}
          <span className="flag" title="סוף המסלול">🏁</span>
        </div>
      </section>

      <div className="legend" aria-label="מקרא">
        <span><i className="dot done">✓</i> הושלם (עם הציון)</span>
        <span><i className="dot next">▶</i> השיעור הבא</span>
        <span><i className="dot">·</i> עוד לא התחלת</span>
        <span>נקודות <bdi>XP</bdi> מקבלים על כל שיעור שעוברים בבוחן</span>
      </div>

      <div className="coursegrid">
        {data.courses.map((course, ci) => {
          const all = course.subCategories.flatMap((s) => s.lessons);
          const done = all.filter((l) => l.done).length;
          const [icon, blurb] = infoOf(course.name);
          return (
            <section key={course.id} id={`course-${course.id}`} className={`card course c${ci % 5}`}>
              <div className="course-head">
                <span className="cicon">{icon}</span>
                <div><h3>{course.name}</h3><small className="muted">{blurb}</small></div>
                <span className="cdone">{done}/{all.length}</span>
              </div>
              <Bar pct={all.length ? (100 * done) / all.length : 0} />
              {course.subCategories.map((unit) => (
                <div key={unit.id} className="unit">
                  <h4>{unit.name}</h4>
                  {unit.lessons.map((l, i) => (
                    <button key={l.id} className={`lrow ${l.done ? 'done' : ''} ${next?.id === l.id ? 'next' : ''}`} onClick={() => go('lesson', l.id)}>
                      <span className="num">{l.done ? '✓' : next?.id === l.id ? '▶' : i + 1}</span>
                      <span className="lt">{l.title}</span>
                      <small>{l.done ? `${l.score}%` : <>{l.minutes} דק׳ · <bdi>{l.xp} XP</bdi></>}</small>
                    </button>
                  ))}
                </div>
              ))}
            </section>
          );
        })}
      </div>
    </>
  );
}

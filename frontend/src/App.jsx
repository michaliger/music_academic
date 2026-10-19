import { useEffect, useState } from 'react';
import { api, ROLE_LABEL } from './api.js';
import { PlayBlock } from './Piano.jsx';
import { playSteps } from './audio.js';
import Library from './library.jsx';
import Studio from './studio.jsx';
import { Practice, Friends, Classes, Ask, Admin } from './pages.jsx';

function Auth({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ name: '', phone: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const body = mode === 'login' ? { phone: f.phone, password: f.password } : f;
      const { token, user } = await api(`/auth/${mode}`, { method: 'POST', body });
      localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(user)); onAuth(user);
    } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  }
  return (
    <div className="hero">
      <div className="card auth">
        <div className="logo">♪</div>
        <h1>אקדמיית המוזיקה</h1>
        <p className="muted">לומדות תאוריה מוזיקלית צעד אחר צעד, עם חברות ועם מורה</p>
        <form onSubmit={submit}>
          {mode === 'register' && <input placeholder="שם מלא" value={f.name} onChange={set('name')} required />}
          <input placeholder="טלפון (0501234567)" value={f.phone} onChange={set('phone')} inputMode="tel" required />
          <input placeholder="סיסמה" type="password" value={f.password} onChange={set('password')} required />
          {err && <div className="error">{err}</div>}
          <button disabled={busy}>{busy ? '...' : mode === 'login' ? 'התחברות' : 'הרשמה'}</button>
        </form>
        <button className="link" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErr(''); }}>
          {mode === 'login' ? 'אין לך חשבון? להרשמה' : 'יש לך חשבון? להתחברות'}
        </button>
      </div>
    </div>
  );
}

function Home({ user, go }) {
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

function Check({ b }) {
  const [c, setC] = useState(null);
  return (
    <div className="check">
      <b>🧠 בדקי את עצמך</b>
      <p>{b.q}</p>
      {b.p && <button className="play" onClick={() => playSteps(b.p, { gap: 0.7, dur: 1.2 })}>🔊 האזיני</button>}
      {b.o.map((o, i) => <button key={i} disabled={c !== null} className={`opt ${c !== null ? (i === b.a ? 'right' : c === i ? 'wrong' : '') : ''}`} onClick={() => setC(i)}>{o}</button>)}
      {c !== null && <small className="muted">{c === b.a ? '✓ ' : '✗ '}{b.e}</small>}
    </div>
  );
}

// בוחן קצר: שאלה אחת בכל פעם, משוב מיידי עם הסבר, וציון בסוף
function QuizRunner({ lesson, go, onExit }) {
  const n = lesson.quiz.length;
  const [i, setI] = useState(0);
  const [ans, setAns] = useState([]);
  const [fb, setFb] = useState(null);
  const [res, setRes] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const q = lesson.quiz[i];

  async function choose(oi) {
    if (fb || busy) return;
    setBusy(true); setErr('');
    try {
      const r = await api(`/lessons/${lesson.id}/check`, { method: 'POST', body: { index: i, answer: oi } });
      setFb({ ...r, chosen: oi });
      setAns((a) => { const x = [...a]; x[i] = oi; return x; });
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }
  async function next() {
    if (i + 1 < n) { setI(i + 1); setFb(null); return; }
    try { setRes(await api(`/lessons/${lesson.id}/quiz`, { method: 'POST', body: { answers: ans } })); } catch (e) { setErr(e.message); }
  }
  const retry = () => { setI(0); setAns([]); setFb(null); setRes(null); };

  if (res) {
    const right = res.results.filter((x) => x.correct).length;
    return (
      <section className={`card result ${res.passed ? 'ok' : ''}`}>
        <h2>{res.passed ? '🎉 כל הכבוד!' : 'כמעט!'}</h2>
        <p className="big">{right} מתוך {n} ({res.score}%)</p>
        {res.xpGained > 0 && <p>קיבלת {res.xpGained} XP והשיעור הושלם.</p>}
        {!res.passed && <p>צריך 60% כדי להשלים. קראי שוב ונסי עוד פעם, זה חלק מהלמידה.</p>}
        <div className="row">
          <button className="ghost" onClick={retry}>ניסיון נוסף</button>
          {res.passed && <button onClick={() => (lesson.nextId ? go('lesson', lesson.nextId) : go('home'))}>{lesson.nextId ? 'לשיעור הבא ▶' : 'חזרה למפה'}</button>}
          <button className="link" onClick={onExit}>חזרה לשיעור</button>
        </div>
      </section>
    );
  }
  return (
    <section className="card quiz">
      <div className="dots">{Array.from({ length: n }, (_, k) => <i key={k} className={k < i ? 'd done' : k === i ? 'd cur' : 'd'} />)}</div>
      <small className="muted">שאלה {i + 1} מתוך {n}</small>
      <h2>{q.q}</h2>
      {q.p && <button className="play" onClick={() => playSteps(q.p, { gap: 0.8, dur: 1.2 })}>🔊 האזיני</button>}
      <div className="opts">
        {q.o.map((o, oi) => {
          const cls = fb ? (oi === fb.answer ? 'right' : oi === fb.chosen ? 'wrong' : '') : '';
          return <button key={oi} disabled={!!fb} className={`opt ${cls}`} onClick={() => choose(oi)}>{o}</button>;
        })}
      </div>
      {fb && <div className={`tip ${fb.correct ? 'good' : ''}`}><b>{fb.correct ? '✓ נכון! ' : '✗ לא בדיוק. '}</b>{fb.explain}</div>}
      {err && <div className="error">{err}</div>}
      {fb && <button onClick={next}>{i + 1 < n ? 'השאלה הבאה ▶' : 'לסיום ולציון'}</button>}
    </section>
  );
}

function LessonView({ id, go }) {
  const [L, setL] = useState(null);
  const [quiz, setQuiz] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    setL(null); setQuiz(false); setErr(''); setMsg('');
    api(`/lessons/${id}`).then(setL).catch((e) => setErr(e.message));
    window.scrollTo(0, 0);
  }, [id]);

  async function share() {
    const url = `${location.origin}/?lesson=${id}`;
    try {
      if (navigator.share) await navigator.share({ title: L.title, text: `למדתי "${L.title}" באקדמיית המוזיקה. בואי ללמוד איתי!`, url });
      else { await navigator.clipboard.writeText(url); setMsg('הקישור הועתק 📋'); }
    } catch { /* בוטל */ }
  }
  if (err) return <div className="error">{err}</div>;
  if (!L) return <p className="muted">טוען...</p>;

  return (
    <>
      <button className="link" onClick={() => go('home')}>← חזרה למפה</button>
      {!quiz && (
        <article className="card lesson-page">
          <div className="tags"><span>{L.course.name}</span><span className="alt">{L.unit.name}</span><time>{L.minutes} דקות</time></div>
          <h1>{L.title}</h1>
          {L.blocks.map((b, i) => b.t === 'h' ? <h3 key={i}>{b.x}</h3> : b.t === 'p' ? <p key={i}>{b.x}</p>
            : b.t === 'tip' ? <div key={i} className="tip">💡 {b.x}</div> : b.t === 'check' ? <Check key={i} b={b} /> : <PlayBlock key={i} label={b.label} steps={b.steps} />)}
          <div className="row">
            <button className="ghost" onClick={share}>שתפי עם חברה 🔗</button>
            <button className="ghost" onClick={() => go('ask', { categoryId: L.course.id, subCategoryId: L.unit.id })}>שאלי את המורה 💬</button>
            {msg && <small className="muted">{msg}</small>}
          </div>
        </article>
      )}
      {!quiz ? (
        <section className="card cta">
          <div><h2>מוכנה לבחון את עצמך? 🎯</h2><p className="muted">{L.quiz.length} שאלות קצרות, עם הסבר אחרי כל תשובה{L.progress.completed ? ` · הציון הכי טוב שלך: ${L.progress.bestScore}%` : ''}.</p></div>
          <button onClick={() => { setQuiz(true); window.scrollTo(0, 0); }}>{L.progress.completed ? 'בוחן נוסף' : 'התחילי בוחן'} ▶</button>
        </section>
      ) : <QuizRunner lesson={L} go={go} onExit={() => setQuiz(false)} />}
    </>
  );
}

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  const deep = new URLSearchParams(location.search).get('lesson');
  const [view, setView] = useState(deep ? { tab: 'lesson', arg: deep } : { tab: 'home' });
  const go = (tab, arg) => { setView({ tab, arg }); window.scrollTo(0, 0); };
  if (!user) return <Auth onAuth={setUser} />;

  const logout = () => { localStorage.clear(); setUser(null); };
  const tabs = [['home', 'מפת הלימוד'], ['library', 'ספרייה'], ['practice', 'תרגול'], ['studio', 'סטודיו AI'], ['friends', 'חברות'], ['classes', 'כיתות'], ['ask', 'שאלי את המורה'], ...(user.role === 'admin' ? [['admin', 'ניהול']] : [])];
  const active = view.tab === 'lesson' ? 'home' : view.tab;
  return (
    <>
      <header>
        <div className="brand"><span className="logo sm">♪</span> אקדמיית המוזיקה</div>
        <nav>{tabs.map(([k, l]) => <button key={k} className={`tab ${active === k ? 'on' : ''}`} onClick={() => go(k)}>{l}</button>)}</nav>
        <div className="who">{user.name} · {ROLE_LABEL[user.role]} <button className="link" onClick={logout}>יציאה</button></div>
      </header>
      <main>
        {view.tab === 'home' && <Home user={user} go={go} />}
        {view.tab === 'lesson' && <LessonView id={view.arg} go={go} />}
        {view.tab === 'library' && <Library />}
        {view.tab === 'practice' && <Practice />}
        {view.tab === 'studio' && <Studio />}
        {view.tab === 'friends' && <Friends />}
        {view.tab === 'classes' && <Classes user={user} />}
        {view.tab === 'ask' && <Ask preset={view.arg} />}
        {view.tab === 'admin' && user.role === 'admin' && <Admin user={user} />}
      </main>
    </>
  );
}

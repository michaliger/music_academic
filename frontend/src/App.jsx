import { useEffect, useState } from 'react';
import { api, ROLE_LABEL } from './api.js';
import { PlayBlock } from './Piano.jsx';
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

function LessonView({ id, go }) {
  const [L, setL] = useState(null);
  const [ans, setAns] = useState([]);
  const [res, setRes] = useState(null);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    setL(null); setRes(null); setAns([]); setErr(''); setMsg('');
    api(`/lessons/${id}`).then(setL).catch((e) => setErr(e.message));
    window.scrollTo(0, 0);
  }, [id]);

  async function submit() {
    setErr('');
    try { setRes(await api(`/lessons/${id}/quiz`, { method: 'POST', body: { answers: ans } })); }
    catch (e) { setErr(e.message); }
  }
  async function share() {
    const url = `${location.origin}/?lesson=${id}`;
    try {
      if (navigator.share) await navigator.share({ title: L.title, text: `למדתי "${L.title}" באקדמיית המוזיקה. בואי ללמוד איתי!`, url });
      else { await navigator.clipboard.writeText(url); setMsg('הקישור הועתק 📋'); }
    } catch { /* בוטל */ }
  }

  if (err && !L) return <div className="error">{err}</div>;
  if (!L) return <p className="muted">טוען...</p>;
  const ready = ans.length === L.quiz.length && ans.every((a) => a !== undefined);

  return (
    <>
      <button className="link" onClick={() => go('home')}>← חזרה למפה</button>
      <article className="card lesson-page">
        <div className="tags"><span>{L.course.name}</span><span className="alt">{L.unit.name}</span><time>{L.minutes} דקות</time></div>
        <h1>{L.title}</h1>
        {L.blocks.map((b, i) => b.t === 'h' ? <h3 key={i}>{b.x}</h3> : b.t === 'p' ? <p key={i}>{b.x}</p>
          : b.t === 'tip' ? <div key={i} className="tip">💡 {b.x}</div> : <PlayBlock key={i} label={b.label} steps={b.steps} />)}
        <div className="row">
          <button className="ghost" onClick={share}>שתפי עם חברה 🔗</button>
          <button className="ghost" onClick={() => go('ask', { categoryId: L.course.id, subCategoryId: L.unit.id })}>שאלי את המורה 💬</button>
          {msg && <small className="muted">{msg}</small>}
        </div>
      </article>

      <section className="card">
        <h2>חידון סיכום</h2>
        {L.quiz.map((qz, qi) => (
          <div key={qi} className="qz">
            <p><b>{qi + 1}. {qz.q}</b></p>
            {qz.o.map((o, oi) => {
              const r = res?.results[qi];
              const cls = r ? (oi === r.answer ? 'right' : ans[qi] === oi ? 'wrong' : '') : ans[qi] === oi ? 'sel' : '';
              return <button key={oi} disabled={!!res} className={`opt ${cls}`} onClick={() => { const a = [...ans]; a[qi] = oi; setAns(a); }}>{o}</button>;
            })}
            {res && <small className="muted">{res.results[qi].correct ? '✓ ' : '✗ '}{res.results[qi].explain}</small>}
          </div>
        ))}
        {err && <div className="error">{err}</div>}
        {!res ? <button disabled={!ready} onClick={submit}>בדיקה</button> : (
          <div className={`result ${res.passed ? 'ok' : ''}`}>
            <h3>{res.passed ? '🎉 כל הכבוד!' : 'כמעט!'} ציון: {res.score}%</h3>
            {res.xpGained > 0 && <p>קיבלת {res.xpGained} XP והשיעור נשמר כהושלם.</p>}
            {!res.passed && <p>צריך 60% כדי להשלים. אפשר לקרוא שוב ולנסות.</p>}
            <div className="row">
              <button className="ghost" onClick={() => { setRes(null); setAns([]); }}>ניסיון נוסף</button>
              {res.passed && <button onClick={() => (L.nextId ? go('lesson', L.nextId) : go('home'))}>{L.nextId ? 'לשיעור הבא ▶' : 'חזרה למפה'}</button>}
            </div>
          </div>
        )}
      </section>
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
  const tabs = [['home', 'מפת הלימוד'], ['practice', 'תרגול'], ['friends', 'חברות'], ['classes', 'כיתות'], ['ask', 'שאלי את המורה'], ...(user.role === 'admin' ? [['admin', 'ניהול']] : [])];
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
        {view.tab === 'practice' && <Practice />}
        {view.tab === 'friends' && <Friends />}
        {view.tab === 'classes' && <Classes user={user} />}
        {view.tab === 'ask' && <Ask preset={view.arg} />}
        {view.tab === 'admin' && user.role === 'admin' && <Admin user={user} />}
      </main>
    </>
  );
}

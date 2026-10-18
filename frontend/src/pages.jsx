import { useEffect, useState } from 'react';
import { api, fmt, daysAgo, ROLE_LABEL } from './api.js';
import Piano from './Piano.jsx';
import { playSteps } from './audio.js';

const useLoad = (path, deps = []) => {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const reload = () => api(path).then(setData).catch((e) => setErr(e.message));
  useEffect(() => { reload(); }, deps); // eslint-disable-line
  return [data, err, reload];
};
const Bar = ({ pct }) => <div className="bar"><i style={{ width: `${pct}%` }} /></div>;

/* ---------- תרגול: פסנתר חופשי + אימון שמיעה ---------- */
const IV = [[2, 'סקונדה גדולה'], [3, 'טרצה קטנה'], [4, 'טרצה גדולה'], [5, 'קוורטה זכה'], [7, 'קווינטה זכה'], [12, 'אוקטבה']];

function EarTrainer() {
  const [mode, setMode] = useState('intervals');
  const [q, setQ] = useState(null);
  const [fb, setFb] = useState(null);
  const [score, setScore] = useState({ ok: 0, n: 0 });
  const options = mode === 'intervals' ? IV.map(([v, n]) => ({ v, n })) : [{ v: 'maj', n: 'מז\'ור' }, { v: 'min', n: 'מינור' }];

  function next() {
    const root = 55 + Math.floor(Math.random() * 13);
    let a, steps;
    if (mode === 'intervals') { a = IV[Math.floor(Math.random() * IV.length)][0]; steps = [[root], [root + a]]; }
    else { a = Math.random() < 0.5 ? 'maj' : 'min'; steps = [[root, root + (a === 'maj' ? 4 : 3), root + 7]]; }
    setQ({ a, steps }); setFb(null); playSteps(steps, { gap: 0.8, dur: 1.2 });
  }
  function pick(v) {
    if (!q || fb) return;
    const ok = v === q.a;
    setFb(ok ? 'right' : 'wrong'); setScore((s) => ({ ok: s.ok + (ok ? 1 : 0), n: s.n + 1 }));
  }
  const name = options.find((o) => o.v === q?.a)?.n;
  return (
    <section className="card">
      <h2>אימון שמיעה 👂</h2>
      <div className="chips">
        {[['intervals', 'זיהוי אינטרוולים'], ['chords', 'מז\'ור או מינור?']].map(([k, l]) => <button key={k} className={`chip ${mode === k ? 'on' : ''}`} onClick={() => { setMode(k); setQ(null); setFb(null); }}>{l}</button>)}
      </div>
      <div className="row">
        <button onClick={next}>{q ? 'שאלה הבאה' : 'התחילי'}</button>
        {q && <button className="ghost" onClick={() => playSteps(q.steps, { gap: 0.8, dur: 1.2 })}>🔁 שמעי שוב</button>}
        <small className="muted">ניקוד: {score.ok}/{score.n}</small>
      </div>
      {q && <div className="chips">{options.map((o) => <button key={o.v} disabled={!!fb} className={`opt ${fb && o.v === q.a ? 'right' : ''}`} onClick={() => pick(o.v)}>{o.n}</button>)}</div>}
      {fb && <p className={fb === 'right' ? 'okmsg' : 'error'}>{fb === 'right' ? '✓ נכון!' : `✗ התשובה: ${name}`}</p>}
    </section>
  );
}

export function Practice() {
  return (
    <>
      <section className="card"><h2>פסנתר חופשי 🎹</h2><p className="muted">לחצי על הקלידים ונסי לחקות את מה שלמדת בשיעורים.</p><Piano from={48} to={83} /></section>
      <EarTrainer />
    </>
  );
}

/* ---------- חברות ---------- */
export function Friends() {
  const [d, err, reload] = useLoad('/friends');
  const [phone, setPhone] = useState('');
  const [msg, setMsg] = useState('');
  const [e2, setE2] = useState('');
  async function add(e) {
    e.preventDefault(); setMsg(''); setE2('');
    try { setMsg((await api('/friends', { method: 'POST', body: { phone } })).message); setPhone(''); reload(); } catch (x) { setE2(x.message); }
  }
  const act = (path, method) => api(path, { method }).then(reload).catch((x) => setE2(x.message));
  const invite = async () => { await navigator.clipboard?.writeText(location.origin); setMsg('קישור ההזמנה הועתק 📋'); };
  if (err) return <div className="error">{err}</div>;
  if (!d) return <p className="muted">טוען...</p>;
  return (
    <>
      <section className="card">
        <h2>הוספת חברה</h2>
        <form onSubmit={add} className="inline"><input placeholder="טלפון של חברה" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" required /><button>שליחה</button></form>
        {msg && <p className="okmsg">{msg}</p>}{e2 && <div className="error">{e2}</div>}
        <button className="link" onClick={invite}>עוד לא רשומה? הזמיני אותה 🔗</button>
      </section>
      {d.incoming.length > 0 && <section className="card"><h2>בקשות שממתינות לך</h2>{d.incoming.map((f) => (
        <div key={f.friendshipId} className="line"><span>{f.name}</span><span><button onClick={() => act(`/friends/${f.friendshipId}/accept`, 'POST')}>אישור</button> <button className="ghost" onClick={() => act(`/friends/${f.friendshipId}`, 'DELETE')}>דחייה</button></span></div>))}</section>}
      <section className="card">
        <h2>לוח דירוג 🏆</h2>
        {d.leaderboard.length === 1 && <p className="muted">הוסיפי חברות כדי להתחרות ולהתקדם ביחד.</p>}
        {d.leaderboard.map((u, i) => (
          <div key={u.id} className={`line ${u.isMe ? 'me' : ''}`}>
            <span><b>{i + 1}.</b> {u.name}{u.isMe && ' (את)'}</span>
            <span className="muted">{u.completed} שיעורים · <b>{u.xp} XP</b> {!u.isMe && <button className="link" onClick={() => act(`/friends/${u.friendshipId}`, 'DELETE')}>הסרה</button>}</span>
          </div>))}
        {d.outgoing.map((f) => <div key={f.friendshipId} className="line muted"><span>{f.name} (ממתינה לאישור)</span><button className="link" onClick={() => act(`/friends/${f.friendshipId}`, 'DELETE')}>ביטול</button></div>)}
      </section>
    </>
  );
}

/* ---------- כיתות ---------- */
function ClassProgress({ id, onBack }) {
  const [d, err, reload] = useLoad(`/classes/${id}/progress`, [id]);
  if (err) return <div className="error">{err}</div>;
  if (!d) return <p className="muted">טוען...</p>;
  const avg = d.students.length ? Math.round(d.students.reduce((a, s) => a + s.percent, 0) / d.students.length) : 0;
  const idle = d.students.filter((s) => !s.lastActive || Date.now() - new Date(s.lastActive) > 7 * 864e5).length;
  return (
    <>
      <button className="link" onClick={onBack}>← חזרה לכיתות</button>
      <section className="card">
        <h2>{d.class.name}</h2>
        <p className="muted">קוד הצטרפות: <b dir="ltr">{d.class.code}</b></p>
        <div className="statnums"><div><b>{d.students.length}</b><small>תלמידות</small></div><div><b>{avg}%</b><small>התקדמות ממוצעת</small></div><div><b>{idle}</b><small>לא פעילות 7+ ימים</small></div></div>
      </section>
      <section className="card">
        <div className="table-wrap"><table>
          <thead><tr><th>שם</th><th>התקדמות</th><th>XP</th><th>פעילות אחרונה</th><th /></tr></thead>
          <tbody>{d.students.map((s) => (
            <tr key={s.id}><td>{s.name}<br /><small className="muted" dir="ltr">{s.phone}</small></td>
              <td style={{ minWidth: 120 }}><Bar pct={s.percent} /><small>{s.completed}/{d.totalLessons} שיעורים</small></td>
              <td>{s.xp}</td><td>{daysAgo(s.lastActive)}</td>
              <td><button className="link" onClick={() => confirm(`להסיר את ${s.name}?`) && api(`/classes/${id}/students/${s.id}`, { method: 'DELETE' }).then(reload)}>הסרה</button></td></tr>))}</tbody>
        </table></div>
        {!d.students.length && <p className="muted">עוד אין תלמידות. שתפי את קוד הכיתה.</p>}
      </section>
    </>
  );
}

export function Classes({ user }) {
  const [list, err, reload] = useLoad('/classes');
  const [open, setOpen] = useState(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [e2, setE2] = useState('');
  const run = (fn) => async (e) => { e.preventDefault(); setE2(''); try { await fn(); reload(); } catch (x) { setE2(x.message); } };
  if (open) return <ClassProgress id={open} onBack={() => { setOpen(null); reload(); }} />;
  return (
    <>
      {user.role !== 'student' && (
        <section className="card"><h2>יצירת כיתה חדשה</h2>
          <form className="inline" onSubmit={run(async () => { await api('/classes', { method: 'POST', body: { name } }); setName(''); })}><input placeholder="שם הכיתה (למשל: תאוריה א׳)" value={name} onChange={(e) => setName(e.target.value)} required /><button>יצירה</button></form>
        </section>)}
      <section className="card"><h2>הצטרפות לכיתה</h2>
        <form className="inline" onSubmit={run(async () => { await api('/classes/join', { method: 'POST', body: { code } }); setCode(''); })}><input placeholder="קוד מהמורה" value={code} onChange={(e) => setCode(e.target.value)} dir="ltr" required /><button>הצטרפות</button></form>
        {e2 && <div className="error">{e2}</div>}
      </section>
      <section className="card"><h2>הכיתות שלי</h2>
        {err && <div className="error">{err}</div>}
        {list?.length === 0 && <p className="muted">עוד אין כיתות.</p>}
        {list?.map((c) => (
          <div key={c.id} className="line"><span><b>{c.name}</b><br /><small className="muted">מורה: {c.teacher} · {c.studentCount} תלמידות{c.code && <> · קוד: <b dir="ltr">{c.code}</b></>}</small></span>
            {c.canManage && <button onClick={() => setOpen(c.id)}>התקדמות התלמידות</button>}</div>))}
      </section>
    </>
  );
}

/* ---------- שאלה למורה AI + היסטוריה ---------- */
function PromptCard({ p }) {
  return (
    <article className="card lesson">
      <div className="tags"><span>{p.category?.name}</span><span className="alt">{p.subCategory?.name}</span><time>{fmt(p.createdAt)}</time></div>
      <h3>“{p.prompt}”</h3><div className="answer">{p.response}</div>
    </article>
  );
}

export function Ask({ preset }) {
  const [tab, setTab] = useState('new');
  const [cats, setCats] = useState([]);
  const [catId, setCatId] = useState(preset?.categoryId || '');
  const [subId, setSubId] = useState(preset?.subCategoryId || '');
  const [prompt, setPrompt] = useState('');
  const [out, setOut] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [hist, , reloadHist] = useLoad('/prompts/me');
  useEffect(() => { api('/categories').then(setCats).catch((e) => setErr(e.message)); }, []);
  const subs = cats.find((c) => c.id === catId)?.subCategories || [];

  async function submit(e) {
    e.preventDefault(); setErr(''); setBusy(true); setOut(null);
    try { setOut(await api('/prompts', { method: 'POST', body: { categoryId: catId, subCategoryId: subId, prompt } })); reloadHist(); }
    catch (x) { setErr(x.message); } finally { setBusy(false); }
  }
  return (
    <>
      <div className="chips"><button className={`tab ${tab === 'new' ? 'on' : ''}`} onClick={() => setTab('new')}>שאלה חדשה</button><button className={`tab ${tab === 'hist' ? 'on' : ''}`} onClick={() => setTab('hist')}>ההיסטוריה שלי</button></div>
      {tab === 'new' ? (
        <>
          <section className="card"><h2>מה תרצי להבין?</h2>
            <div className="chips">{cats.map((c) => <button key={c.id} className={`chip ${catId === c.id ? 'on' : ''}`} onClick={() => { setCatId(c.id); setSubId(''); }}>{c.name}</button>)}</div>
            {catId && <div className="chips sub">{subs.map((s) => <button key={s.id} className={`chip ${subId === s.id ? 'on' : ''}`} onClick={() => setSubId(s.id)}>{s.name}</button>)}</div>}
            <form onSubmit={submit}>
              <textarea rows="3" maxLength="1000" placeholder="לדוגמה: למה אקורד מינור נשמע עצוב?" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
              {err && <div className="error">{err}</div>}
              <button disabled={busy || !catId || !subId || prompt.trim().length < 3}>{busy ? 'המורה כותבת...' : 'שליחה 🎶'}</button>
            </form>
          </section>
          {out && <PromptCard p={out} />}
        </>
      ) : !hist ? <p className="muted">טוען...</p> : hist.length ? hist.map((p) => <PromptCard key={p.id} p={p} />) : <p className="card muted">עוד לא שאלת כלום.</p>}
    </>
  );
}

/* ---------- ניהול ---------- */
export function Admin({ user }) {
  const [ov] = useLoad('/admin/overview');
  const [classes] = useLoad('/admin/classes');
  const [data, setData] = useState({ users: [], page: 1, pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [sel, setSel] = useState(null);
  const [prompts, setPrompts] = useState([]);
  const [err, setErr] = useState('');
  const load = () => api(`/admin/users?page=${page}&limit=8&search=${encodeURIComponent(search)}&role=${role}`).then(setData).catch((e) => setErr(e.message));
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [page, search, role]); // eslint-disable-line

  async function changeRole(u, r) { try { await api(`/admin/users/${u.id}/role`, { method: 'PATCH', body: { role: r } }); load(); } catch (x) { setErr(x.message); } }
  async function open(u) { setSel(u); setPrompts(await api(`/admin/users/${u.id}/prompts`).catch(() => [])); }

  return (
    <>
      {ov && <section className="card statnums wrap">{[['משתמשות', ov.users], ['מורות', ov.teachers], ['כיתות', ov.classes], ['שיעורים באתר', ov.lessons], ['שיעורים שהושלמו', ov.completions], ['שאלות ל-AI', ov.prompts]].map(([l, v]) => <div key={l}><b>{v}</b><small>{l}</small></div>)}</section>}
      <section className="card">
        <h2>משתמשות ({data.total})</h2>
        <div className="inline"><input placeholder="חיפוש לפי שם או טלפון" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          <select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}><option value="">כל התפקידים</option>{Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        {err && <div className="error">{err}</div>}
        <div className="table-wrap"><table>
          <thead><tr><th>שם</th><th>טלפון</th><th>תפקיד</th><th>שיעורים</th><th>XP</th><th>פעילות</th></tr></thead>
          <tbody>{data.users.map((u) => (
            <tr key={u.id} onClick={() => open(u)} className={sel?.id === u.id ? 'sel' : ''}>
              <td>{u.name}</td><td dir="ltr">{u.phone}</td>
              <td onClick={(e) => e.stopPropagation()}><select disabled={u.id === user.id} value={u.role} onChange={(e) => changeRole(u, e.target.value)}>{Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></td>
              <td>{u.completed}</td><td>{u.xp}</td><td>{daysAgo(u.lastActive)}</td></tr>))}</tbody>
        </table></div>
        <div className="pager"><button className="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>הקודם</button><span>{data.page} / {data.pages || 1}</span><button className="ghost" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>הבא</button></div>
      </section>
      {sel && <><h3>שאלות ל-AI של {sel.name}</h3>{prompts.length ? prompts.map((p) => <PromptCard key={p.id} p={p} />) : <p className="card muted">אין שאלות.</p>}</>}
      <section className="card"><h2>כל הכיתות</h2>{classes?.length ? classes.map((c) => <div key={c.id} className="line"><span>{c.name}</span><span className="muted">מורה: {c.teacher} · {c.studentCount} תלמידות</span></div>) : <p className="muted">אין כיתות עדיין.</p>}</section>
    </>
  );
}

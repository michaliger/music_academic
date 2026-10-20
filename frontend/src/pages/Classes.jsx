// Classes: students join with a code; teachers create classes and follow every student's progress.
import { useState } from 'react';
import { api } from '../api/client.js';
import { daysAgo } from '../utils/format.js';
import useLoad from '../hooks/useLoad.js';
import Bar from '../components/Bar.jsx';

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

export default function Classes({ user }) {
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

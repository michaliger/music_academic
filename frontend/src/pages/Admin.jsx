// Admin dashboard: totals, users (pagination, search, role filter), roles, prompt history, classes.
import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { daysAgo, ROLE_LABEL } from '../utils/format.js';
import useLoad from '../hooks/useLoad.js';
import PromptCard from '../components/PromptCard.jsx';

export default function Admin({ user }) {
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

// Friends: add by e-mail, accept requests, XP leaderboard.
import { useState } from 'react';
import { api } from '../api/client.js';
import useLoad from '../hooks/useLoad.js';

export default function Friends() {
  const [d, err, reload] = useLoad('/friends');
  const [email, setEmail] = useState('');
  const [notFound, setNotFound] = useState('');
  const [msg, setMsg] = useState('');
  const [e2, setE2] = useState('');
  async function add(e) {
    e.preventDefault(); setMsg(''); setE2(''); setNotFound('');
    try { setMsg((await api('/friends', { method: 'POST', body: { email } })).message); setEmail(''); reload(); } catch (x) { if (x.status === 404 || /לא נמצאה/.test(x.message)) setNotFound(email); else setE2(x.message); }
  }
  const act = (path, method) => api(path, { method }).then(reload).catch((x) => setE2(x.message));
  // opens the student's own mail program with a ready invitation to the friend's address
  const inviteMail = (to) => `mailto:${to}?subject=${encodeURIComponent('הצטרפי אליי למלודיה 🎼')}&body=${encodeURIComponent(`היי! אני לומדת מוזיקה באתר מלודיה ונהנית מזה. בואי ללמוד איתי ולהתחרות על הדירוג:\n${location.origin}`)}`;
  if (err) return <div className="error">{err}</div>;
  if (!d) return <p className="muted">טוען...</p>;
  return (
    <div className="pgrid">
      <section className="card">
        <h2>הוספת חברה</h2>
        <form onSubmit={add} className="inline"><input placeholder="אימייל של חברה" type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} required /><button>שליחה</button></form>
        {msg && <p className="okmsg">{msg}</p>}{e2 && <div className="error">{e2}</div>}
        {notFound && <p className="muted">החברה הזאת עוד לא רשומה. <a href={inviteMail(notFound)}>לשליחת הזמנה במייל ✉️</a></p>}
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
    </div>
  );
}

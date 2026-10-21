// Login / registration screen.
import Logo from '../components/Logo.jsx';
import { useState } from 'react';
import { api } from '../api/client.js';

export default function Auth({ onAuth }) {
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
        <div className="auth-logo"><Logo size={72} /><h1 className="auth-name">מלודיה</h1></div>
        <h2 className="auth-sub">אקדמיית המוזיקה</h2>
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

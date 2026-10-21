// Ask the AI teacher by category / sub-category, plus the learning history.
import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import useLoad from '../hooks/useLoad.js';
import PromptCard from '../components/PromptCard.jsx';

export default function Ask({ preset }) {
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
    try { setOut(await api('/prompts', { method: 'POST', body: { categoryId: catId, subCategoryId: subId, prompt } })); reloadHist(); window.scrollTo(0, 0); }
    catch (x) { setErr(x.message); } finally { setBusy(false); }
  }
  return (
    <>
      <div className="chips"><button className={`tab ${tab === 'new' ? 'on' : ''}`} onClick={() => setTab('new')}>שאלה חדשה</button><button className={`tab ${tab === 'hist' ? 'on' : ''}`} onClick={() => setTab('hist')}>ההיסטוריה שלי</button></div>
      {tab === 'new' ? (out ? (
        <>
          <button className="link" onClick={() => { setOut(null); setPrompt(''); window.scrollTo(0, 0); }}>← שאלה חדשה</button>
          <PromptCard p={out} />
          <div className="row"><button onClick={() => { setOut(null); setPrompt(''); window.scrollTo(0, 0); }}>שאלי שאלה נוספת</button><button className="ghost" onClick={() => setTab('hist')}>ההיסטוריה שלי</button></div>
        </>
      ) : (
        <>
          <section className="card"><h2>שאלי את המורה 🎓</h2>
            <p className="muted">בחרי נושא, כתבי שאלה, ותקבלי הסבר של מורה למוזיקה: הסבר, דוגמאות ותרגיל. התשובה נשמרת בהיסטוריה שלך.</p>
            <div className="chips">{cats.map((c) => <button key={c.id} className={`chip ${catId === c.id ? 'on' : ''}`} onClick={() => { setCatId(c.id); setSubId(''); }}>{c.name}</button>)}</div>
            {catId && <div className="chips sub">{subs.map((s) => <button key={s.id} className={`chip ${subId === s.id ? 'on' : ''}`} onClick={() => setSubId(s.id)}>{s.name}</button>)}</div>}
            <form onSubmit={submit}>
              <textarea rows="3" maxLength="1000" placeholder="לדוגמה: למה אקורד מינור נשמע עצוב?" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
              {err && <div className="error">{err}</div>}
              <button disabled={busy || !catId || !subId || prompt.trim().length < 3}>{busy ? 'המורה כותבת...' : 'שליחה 🎶'}</button>
            </form>
          </section>
        </>
      )) : !hist ? <p className="muted">טוען...</p> : hist.length ? hist.map((p) => <PromptCard key={p.id} p={p} />) : <p className="card muted">עוד לא שאלת כלום.</p>}
    </>
  );
}

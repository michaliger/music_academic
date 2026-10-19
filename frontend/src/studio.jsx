import { useEffect, useState } from 'react';
import { api, fmt } from './api.js';
import Piano from './Piano.jsx';
import { playSteps } from './audio.js';
import { parseChord, chordNotes } from './theory.js';

const MOODS = [['happy', 'שמח ☀️'], ['sad', 'עצוב 🌧️'], ['dreamy', 'חולמני ☁️'], ['epic', 'אפי 🔥'], ['calm', 'רגוע 🌿'], ['jazzy', 'ג\'אזי 🎷']];
const GENRES = [['pop', 'פופ'], ['ballad', 'בלדה'], ['rock', 'רוק'], ['folk', 'פולק'], ['jazz', 'ג\'אז']];
const KEYS = ['', 'C', 'D', 'E', 'F', 'G', 'A', 'B', 'Bb', 'Eb'];

const voice = (sym) => { const c = parseChord(sym); return c ? chordNotes(c.root, c.iv, 0) : null; };

function SongView({ song }) {
  const d = song.data;
  const [hl, setHl] = useState([]);
  const playChord = (sym) => { const v = voice(sym); if (!v) return; setHl(v); playSteps([v.map((x) => x + 12)], { dur: 1.5 }); };
  const playProg = (chords) => {
    const steps = chords.map(voice).filter(Boolean);
    const gap = Math.max(0.6, 120 / d.tempo);
    playSteps(steps.map((s) => s.map((x) => x + 12)), { gap, dur: gap * 1.1, onStep: (n) => setHl(n.map((x) => x - 12)) });
  };
  return (
    <section className="card song">
      <div className="tags"><span>{d.key}</span><span className="alt">{d.tempo} BPM · {d.timeSignature}</span>
        <time>{d.engine === 'ai' ? '✨ נוצר ע״י AI' : 'מצב הדגמה (אין מפתח OpenAI)'}</time></div>
      <h2>{d.title}</h2>
      <Piano from={48} to={83} highlight={hl} />
      {d.sections.map((sec, i) => (
        <div key={i} className="sec">
          <div className="row"><h3>{sec.name}</h3><button className="ghost" onClick={() => playProg(sec.chords)}>▶ נגני את המהלך</button></div>
          <div className="chips">{sec.chords.map((c, k) => <button key={k} className="chip g" onClick={() => playChord(c)} disabled={!voice(c)}>{c}</button>)}</div>
          {sec.lyrics.map((l, k) => <p key={k} className="lyric">{l}</p>)}
        </div>
      ))}
      <div className="tip">🎓 {d.explanation}</div>
    </section>
  );
}

export default function Studio() {
  const [mood, setMood] = useState('happy');
  const [genre, setGenre] = useState('pop');
  const [theme, setTheme] = useState('');
  const [key, setKey] = useState('');
  const [song, setSong] = useState(null);
  const [list, setList] = useState([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const loadList = () => api('/songs').then(setList).catch(() => {});
  useEffect(() => { loadList(); }, []);

  async function create(e) {
    e.preventDefault(); setErr(''); setBusy(true);
    try { setSong(await api('/songs/generate', { method: 'POST', body: { mood, genre, theme, ...(key && { key }) } })); loadList(); }
    catch (x) { setErr(x.message); } finally { setBusy(false); }
  }
  const remove = (id) => api(`/songs/${id}`, { method: 'DELETE' }).then(() => { if (song?.id === id) setSong(null); loadList(); });

  return (
    <>
      <section className="card">
        <h2>סטודיו ליצירה עם AI 🎤</h2>
        <p className="muted">ספרי על השיר שאת רוצה, וה-AI יבנה לו מהלך אקורדים, מבנה ומילים. אפשר לשמוע כל אקורד על הפסנתר ולהתחיל לנגן.</p>
        <form onSubmit={create}>
          <b>מצב רוח</b>
          <div className="chips">{MOODS.map(([k, l]) => <button type="button" key={k} className={`chip ${mood === k ? 'on' : ''}`} onClick={() => setMood(k)}>{l}</button>)}</div>
          <b>סגנון</b>
          <div className="chips">{GENRES.map(([k, l]) => <button type="button" key={k} className={`chip g ${genre === k ? 'on' : ''}`} onClick={() => setGenre(k)}>{l}</button>)}</div>
          <div className="inline">
            <input placeholder="על מה השיר? (למשל: געגוע לים בקיץ)" value={theme} onChange={(e) => setTheme(e.target.value)} maxLength={120} required />
            <select value={key} onChange={(e) => setKey(e.target.value)}>{KEYS.map((k) => <option key={k} value={k}>{k ? `סולם ${k}` : 'סולם אוטומטי'}</option>)}</select>
          </div>
          {err && <div className="error">{err}</div>}
          <button disabled={busy || theme.trim().length < 2}>{busy ? 'מלחינה...' : 'צרי שיר 🎶'}</button>
        </form>
      </section>
      {song && <SongView song={song} />}
      {list.length > 0 && (
        <section className="card"><h2>השירים שלי</h2>
          {list.map((s) => (
            <div key={s.id} className="line"><span><b>{s.title}</b><br /><small className="muted">{s.data.key} · {fmt(s.createdAt)}</small></span>
              <span><button className="ghost" onClick={() => { setSong(s); window.scrollTo(0, 0); }}>פתיחה</button> <button className="link" onClick={() => remove(s.id)}>מחיקה</button></span></div>))}
        </section>)}
    </>
  );
}

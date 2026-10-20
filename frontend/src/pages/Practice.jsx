// Practice: free piano and an ear trainer (intervals, major/minor).
import { useState } from 'react';
import Piano from '../components/Piano.jsx';
import { playSteps } from '../music/audio.js';

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

export default function Practice() {
  return (
    <>
      <section className="card"><h2>פסנתר חופשי 🎹</h2><p className="muted">לחצי על הקלידים ונסי לחקות את מה שלמדת בשיעורים.</p><Piano from={48} to={83} /></section>
      <EarTrainer />
    </>
  );
}

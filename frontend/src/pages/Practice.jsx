// Practice: free piano and an ear trainer (intervals, major/minor).
import { useState } from 'react';
import Piano from '../components/Piano.jsx';
import { playSteps } from '../music/audio.js';

const IV = [[2, 'סקונדה גדולה'], [3, 'טרצה קטנה'], [4, 'טרצה גדולה'], [5, 'קוורטה זכה'], [7, 'קווינטה זכה'], [12, 'אוקטבה']];

const NOTE_OPTS = [[0, 'דו'], [2, 'רה'], [4, 'מי'], [5, 'פה'], [7, 'סול'], [9, 'לה'], [11, 'סי']];
const NOTE_BLACK = [[0, 'דו'], [1, 'דו♯'], [2, 'רה'], [3, 'רה♯'], [4, 'מי'], [5, 'פה'], [6, 'פה♯'], [7, 'סול'], [8, 'סול♯'], [9, 'לה'], [10, 'לה♯'], [11, 'סי']];
const nameOf = (semi) => NOTE_BLACK.find(([v]) => v === semi)?.[1];

function EarTrainer() {
  const [mode, setMode] = useState('notes');
  const [q, setQ] = useState(null);
  const [fb, setFb] = useState(null);
  const [score, setScore] = useState({ ok: 0, n: 0 });
  const [picks, setPicks] = useState([]); // pair mode: the notes chosen so far
  const [black, setBlack] = useState(false);
  const noteMode = mode === 'notes' || mode === 'pairs';
  const noteList = black ? NOTE_BLACK : NOTE_OPTS;
  const options = noteMode ? noteList.map(([v, n]) => ({ v, n })) : mode === 'intervals' ? IV.map(([v, n]) => ({ v, n })) : [{ v: 'maj', n: 'מז\'ור' }, { v: 'min', n: 'מינור' }];

  function next() {
    const root = 55 + Math.floor(Math.random() * 13);
    let a, steps;
    if (noteMode) {
      const draw = () => noteList[Math.floor(Math.random() * noteList.length)][0];
      const list = mode === 'notes' ? [draw()] : [draw(), draw()];
      a = list; steps = list.map((n) => [60 + n]); setPicks([]);
    } else if (mode === 'intervals') { a = IV[Math.floor(Math.random() * IV.length)][0]; steps = [[root], [root + a]]; }
    else { a = Math.random() < 0.5 ? 'maj' : 'min'; steps = [[root, root + (a === 'maj' ? 4 : 3), root + 7]]; }
    setQ({ a, steps }); setFb(null); playSteps(steps, { gap: 0.8, dur: 1.2 });
  }
  function pick(v) {
    if (!q || fb) return;
    if (noteMode) {
      playSteps([[60 + v]], { gap: 0.5, dur: 0.8 });
      const got = [...picks, v];
      if (got.length < q.a.length) { setPicks(got); return; }
      setPicks(got);
      const good = got.every((n, i) => n === q.a[i]);
      setFb(good ? 'right' : 'wrong'); setScore((x) => ({ ok: x.ok + (good ? 1 : 0), n: x.n + 1 }));
      return;
    }
    const ok = v === q.a;
    setFb(ok ? 'right' : 'wrong'); setScore((s) => ({ ok: s.ok + (ok ? 1 : 0), n: s.n + 1 }));
  }
  const name = noteMode ? q?.a.map(nameOf).join(' ואז ') : options.find((o) => o.v === q?.a)?.n;
  return (
    <section className="card">
      <h2>אימון שמיעה </h2>
      <div className="chips">
        {[['notes', 'איזה תו?'], ['pairs', 'שני תווים ברצף'], ['intervals', 'זיהוי אינטרוולים'], ['chords', 'מז\'ור או מינור?']].map(([k, l]) => <button key={k} className={`chip ${mode === k ? 'on' : ''}`} onClick={() => { setMode(k); setQ(null); setFb(null); setPicks([]); }}>{l}</button>)}
        {noteMode && <button className={`chip ${black ? 'on' : ''}`} onClick={() => { setBlack(!black); setQ(null); setFb(null); setPicks([]); }}>{black ? 'תווים שחורים: פועל' : 'תווים שחורים: כבוי'}</button>}
      </div>
      <div className="row">
        <button onClick={next}>{q ? 'שאלה הבאה' : 'התחילי'}</button>
        {q && <button className="ghost" onClick={() => playSteps(q.steps, { gap: 0.8, dur: 1.2 })}> שמעי שוב</button>}
        {noteMode && <button className="ghost" onClick={() => playSteps([[60]], { gap: 0.5, dur: 1 })}>שמעי דו להשוואה</button>}
        <small className="muted">ניקוד: {score.ok}/{score.n}</small>
      </div>
      {q && noteMode && q.a.length > 1 && <p className="muted">בחרי את שני התווים לפי הסדר שנשמעו. {picks.length ? `בחרת: ${picks.map(nameOf).join(' ואז ')}` : ''}</p>}
      {q && <div className="chips">{options.map((o) => <button key={o.v} disabled={!!fb} className={`opt ${fb && (noteMode ? q.a.includes(o.v) : o.v === q.a) ? 'right' : ''}`} onClick={() => pick(o.v)}>{o.n}</button>)}</div>}
      {fb && <p className={fb === 'right' ? 'okmsg' : 'error'}>{fb === 'right' ? '✓ נכון!' : `✗ התשובה: ${name}`}</p>}
    </section>
  );
}

export default function Practice() {
  return (
    <div className="practice">
      <EarTrainer />
      <section className="card pianocard"><h2>פסנתר חופשי </h2><Piano from={36} to={95} real namesOnC /></section>
    </div>
  );
}

// Quiz runner: one question at a time with instant feedback, then the graded result.
import { useState } from 'react';
import { api } from '../api/client.js';
import Confetti from '../components/Confetti.jsx';
import { playSteps } from '../music/audio.js';

export default function QuizRunner({ lesson, go, onExit }) {
  const n = lesson.quiz.length;
  const [i, setI] = useState(0);
  const [ans, setAns] = useState([]);
  const [fb, setFb] = useState(null);
  const [res, setRes] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const q = lesson.quiz[i];

  async function choose(oi) {
    if (fb || busy) return;
    setBusy(true); setErr('');
    try {
      const r = await api(`/lessons/${lesson.id}/check`, { method: 'POST', body: { index: i, answer: oi } });
      setFb({ ...r, chosen: oi });
      setAns((a) => { const x = [...a]; x[i] = oi; return x; });
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }
  async function next() {
    if (i + 1 < n) { setI(i + 1); setFb(null); return; }
    try { setRes(await api(`/lessons/${lesson.id}/quiz`, { method: 'POST', body: { answers: ans } })); } catch (e) { setErr(e.message); }
  }
  const retry = () => { setI(0); setAns([]); setFb(null); setRes(null); };

  if (res) {
    const right = res.results.filter((x) => x.correct).length;
    return (
      <section className={`card result ${res.passed ? 'ok' : ''}`}>
        {res.passed && <Confetti />}
        <h2>{res.passed ? '🎉 כל הכבוד!' : 'כמעט!'}</h2>
        <p className="big">{right} מתוך {n} ({res.score}%)</p>
        {res.xpGained > 0 && <p>קיבלת {res.xpGained} XP והשיעור הושלם.</p>}
        {!res.passed && <p>צריך 60% כדי להשלים. קראי שוב ונסי עוד פעם, זה חלק מהלמידה.</p>}
        <div className="row">
          <button className="ghost" onClick={retry}>ניסיון נוסף</button>
          {res.passed && <button onClick={() => (lesson.nextId ? go('lesson', lesson.nextId) : go('map'))}>{lesson.nextId ? 'לשיעור הבא ▶' : 'חזרה למפה'}</button>}
          <button className="link" onClick={onExit}>חזרה לשיעור</button>
        </div>
      </section>
    );
  }
  return (
    <section className="card quiz">
      <div className="dots">{Array.from({ length: n }, (_, k) => <i key={k} className={k < i ? 'd done' : k === i ? 'd cur' : 'd'} />)}</div>
      <small className="muted">שאלה {i + 1} מתוך {n}</small>
      <h2>{q.q}</h2>
      {q.p && <button className="play" onClick={() => playSteps(q.p, { gap: 0.8, dur: 1.2 })}>🔊 האזיני</button>}
      <div className="opts">
        {q.o.map((o, oi) => {
          const cls = fb ? (oi === fb.answer ? 'right' : oi === fb.chosen ? 'wrong' : '') : '';
          return <button key={oi} disabled={!!fb} className={`opt ${cls}`} onClick={() => choose(oi)}>{o}</button>;
        })}
      </div>
      {fb && <div className={`tip ${fb.correct ? 'good' : ''}`}><b>{fb.correct ? '✓ נכון! ' : '✗ לא בדיוק. '}</b>{fb.explain}</div>}
      {err && <div className="error">{err}</div>}
      {fb && <button onClick={next}>{i + 1 < n ? 'השאלה הבאה ▶' : 'לסיום ולציון'}</button>}
    </section>
  );
}

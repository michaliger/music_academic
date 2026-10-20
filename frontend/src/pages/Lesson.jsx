// Lesson page: content blocks, inline self-checks, share, and the quiz entry point.
import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { PlayBlock } from '../components/Piano.jsx';
import { playSteps } from '../music/audio.js';
import QuizRunner from './Quiz.jsx';

function Check({ b }) {
  const [c, setC] = useState(null);
  return (
    <div className="check">
      <b>🧠 בדקי את עצמך</b>
      <p>{b.q}</p>
      {b.p && <button className="play" onClick={() => playSteps(b.p, { gap: 0.7, dur: 1.2 })}>🔊 האזיני</button>}
      {b.o.map((o, i) => <button key={i} disabled={c !== null} className={`opt ${c !== null ? (i === b.a ? 'right' : c === i ? 'wrong' : '') : ''}`} onClick={() => setC(i)}>{o}</button>)}
      {c !== null && <small className="muted">{c === b.a ? '✓ ' : '✗ '}{b.e}</small>}
    </div>
  );
}

export default function LessonView({ id, go }) {
  const [L, setL] = useState(null);
  const [quiz, setQuiz] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    setL(null); setQuiz(false); setErr(''); setMsg('');
    api(`/lessons/${id}`).then(setL).catch((e) => setErr(e.message));
    window.scrollTo(0, 0);
  }, [id]);

  async function share() {
    const url = `${location.origin}/?lesson=${id}`;
    try {
      if (navigator.share) await navigator.share({ title: L.title, text: `למדתי "${L.title}" באקדמיית המוזיקה. בואי ללמוד איתי!`, url });
      else { await navigator.clipboard.writeText(url); setMsg('הקישור הועתק 📋'); }
    } catch { /* בוטל */ }
  }
  if (err) return <div className="error">{err}</div>;
  if (!L) return <p className="muted">טוען...</p>;

  return (
    <>
      <button className="link" onClick={() => go('home')}>← חזרה למפה</button>
      {!quiz && (
        <article className="card lesson-page">
          <div className="tags"><span>{L.course.name}</span><span className="alt">{L.unit.name}</span><time>{L.minutes} דקות</time></div>
          <h1>{L.title}</h1>
          {L.blocks.map((b, i) => b.t === 'h' ? <h3 key={i}>{b.x}</h3> : b.t === 'p' ? <p key={i}>{b.x}</p>
            : b.t === 'tip' ? <div key={i} className="tip">💡 {b.x}</div> : b.t === 'check' ? <Check key={i} b={b} /> : <PlayBlock key={i} label={b.label} steps={b.steps} />)}
          <div className="row">
            <button className="ghost" onClick={share}>שתפי עם חברה 🔗</button>
            <button className="ghost" onClick={() => go('ask', { categoryId: L.course.id, subCategoryId: L.unit.id })}>שאלי את המורה 💬</button>
            {msg && <small className="muted">{msg}</small>}
          </div>
        </article>
      )}
      {!quiz ? (
        <section className="card cta">
          <div><h2>מוכנה לבחון את עצמך? 🎯</h2><p className="muted">{L.quiz.length} שאלות קצרות, עם הסבר אחרי כל תשובה{L.progress.completed ? ` · הציון הכי טוב שלך: ${L.progress.bestScore}%` : ''}.</p></div>
          <button onClick={() => { setQuiz(true); window.scrollTo(0, 0); }}>{L.progress.completed ? 'בוחן נוסף' : 'התחילי בוחן'} ▶</button>
        </section>
      ) : <QuizRunner lesson={L} go={go} onExit={() => setQuiz(false)} />}
    </>
  );
}

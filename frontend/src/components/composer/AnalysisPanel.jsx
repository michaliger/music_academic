import Bar from '../Bar.jsx';

const ICON = { good: '✓', warn: '!', idea: '♪' };
const levelOf = (score) => (score >= 85 ? 'מצוין' : score >= 65 ? 'טוב מאוד' : score >= 40 ? 'בדרך הנכונה' : 'אפשר לשפר');

/** Result of POST /compositions/analyze: score, tips, per-section numerals and the optional AI mentor comment. */
export default function AnalysisPanel({ result }) {
  const { score, tips, sections, mentor } = result;
  return (
    <section className="card analysis">
      <h2>בדיקת ההרמוניה</h2>
      <div className="scorebar"><b>{score}</b><Bar pct={score} /><span>{levelOf(score)}</span></div>
      <ul className="tips">{tips.map((t, i) => <li key={i} className={t.type}><span>{ICON[t.type]}</span>{t.text}</li>)}</ul>
      {sections.filter((s) => s.romans.length).map((s) => (
        <p key={s.name} className="muted"><b>{s.name}:</b> <span dir="ltr">{s.romans.join(' – ')}</span></p>
      ))}
      {mentor && <div className="tip">{mentor}</div>}
    </section>
  );
}

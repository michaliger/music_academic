// Library: pick a root and a chord / scale and watch it move on the keyboard.
import { useState } from 'react';
import Piano from '../components/Piano.jsx';
import { playSteps } from '../music/audio.js';
import { PC, PC_EN, CHORDS, SCALES, INV_LABEL, chordNotes, scaleNotes, diatonic, stepPattern } from '../music/theory.js';

const GROUPS = ['טריאדות', 'ספטימות', 'צבעים'];
const up = (notes) => notes.map((x) => x + 12); // הנגינה גבוהה ב-12 כדי להישמע נעים

export default function Library() {
  const [mode, setMode] = useState('chords');
  const [s, setS] = useState({ root: 0, id: 'maj', inv: 0 });
  const [sc, setSc] = useState({ root: 0, id: 'major' });
  const [active, setActive] = useState([]);

  const ch = CHORDS.find((c) => c.id === s.id);
  const scale = SCALES.find((x) => x.id === sc.id);
  const cNotes = chordNotes(s.root, ch.iv, s.inv);
  const sNotes = scaleNotes(sc.root, scale.iv);

  function chord(p) {
    const n = { ...s, ...p };
    const c = CHORDS.find((x) => x.id === n.id);
    if (n.inv >= c.iv.length) n.inv = 0;
    setS(n); setActive([]);
    playSteps([up(chordNotes(n.root, c.iv, n.inv))], { dur: 1.5 });
  }
  function arpeggio() {
    playSteps(cNotes.map((x) => [x + 12]), { gap: 0.35, dur: 1, onStep: (n) => setActive(n.map((x) => x - 12)) });
  }
  function scl(p) {
    const n = { ...sc, ...p };
    setSc(n); playScale(n);
  }
  function playScale(n = sc) {
    const notes = scaleNotes(n.root, SCALES.find((x) => x.id === n.id).iv);
    const steps = notes.concat(notes.slice(0, -1).reverse()).map((x) => [x + 12]);
    playSteps(steps, { gap: 0.28, dur: 0.6, onStep: (a) => setActive(a.map((x) => x - 12)) });
  }
  function playDia(d) { setActive(d.notes); playSteps([up(d.notes)], { dur: 1.4 }); }

  const cur = mode === 'chords' ? s : sc;
  const dia = diatonic(sc.root, scale.iv);

  return (
    <>
      <div className="chips">
        <button className={`tab ${mode === 'chords' ? 'on' : ''}`} onClick={() => { setMode('chords'); setActive([]); }}>אקורדים</button>
        <button className={`tab ${mode === 'scales' ? 'on' : ''}`} onClick={() => { setMode('scales'); setActive([]); }}>סולמות ומודים</button>
      </div>

      <section className="card">
        <h2>{mode === 'chords' ? 'בחרי שורש וסוג אקורד' : 'בחרי צליל התחלה וסולם'}</h2>
        <p className="muted">לחיצה מזיזה את המקלדת ומנגנת. הצלילים מוצגים בכתיב דיאזי (למשל רה♯ הוא גם מי♭).</p>
        <div className="chips">{PC_EN.map((n, i) => <button key={i} className={`chip ${cur.root === i ? 'on' : ''}`} onClick={() => (mode === 'chords' ? chord({ root: i }) : scl({ root: i }))}>{n}<small>{PC[i]}</small></button>)}</div>
        {mode === 'chords' ? GROUPS.map((g) => (
          <div key={g}><h4 className="grp">{g}</h4>
            <div className="chips">{CHORDS.filter((c) => c.grp === g).map((c) => <button key={c.id} className={`chip g ${s.id === c.id ? 'on' : ''}`} onClick={() => chord({ id: c.id })}>{c.name}<small>{c.sym || 'maj'}</small></button>)}</div>
          </div>
        )) : <div className="chips">{SCALES.map((x) => <button key={x.id} className={`chip g ${sc.id === x.id ? 'on' : ''}`} onClick={() => scl({ id: x.id })}>{x.name}</button>)}</div>}
      </section>

      {mode === 'chords' ? (
        <section className="card">
          <h2>{PC_EN[s.root]}{ch.sym} <small className="muted">{PC[s.root]} {ch.name}</small></h2>
          <p className="muted">{ch.desc}</p>
          <div className="fact"><span>צלילים: <b>{cNotes.map((x) => PC[x % 12]).join(' · ')}</b></span><span>נוסחה: <b dir="ltr">{ch.f}</b></span></div>
          <Piano from={48} to={83} highlight={cNotes} rootPc={s.root} active={active} />
          <div className="row"><button onClick={() => chord({})}>▶ נגני</button><button className="ghost" onClick={arpeggio}>▶ ארפג'ו</button></div>
          <h4 className="grp">כל הצורות של האקורד</h4>
          <div className="invs">{ch.iv.map((_, i) => (
            <button key={i} className={`inv ${s.inv === i ? 'on' : ''}`} onClick={() => chord({ inv: i })}>
              <b>{INV_LABEL[i]}</b><span>{chordNotes(s.root, ch.iv, i).map((x) => PC[x % 12]).join(' · ')}</span>
            </button>))}</div>
        </section>
      ) : (
        <section className="card">
          <h2>{PC_EN[sc.root]} {scale.name} <small className="muted">{PC[sc.root]}</small></h2>
          <p className="muted">{scale.desc}</p>
          <div className="fact"><span>צלילים: <b>{sNotes.map((x) => PC[x % 12]).join(' · ')}</b></span><span>מרווחים: <b>{stepPattern(scale.iv)}</b></span></div>
          <Piano from={48} to={83} highlight={sNotes} rootPc={sc.root} active={active} />
          <div className="row"><button onClick={() => playScale()}>▶ עולה ויורד</button></div>
          {dia.length > 0 && <>
            <h4 className="grp">האקורדים של הסולם (לחצי לשמוע)</h4>
            <div className="chips">{dia.map((d) => <button key={d.roman} className="chip g" onClick={() => playDia(d)}>{d.roman}<small>{d.name}</small></button>)}</div>
          </>}
        </section>
      )}
    </>
  );
}

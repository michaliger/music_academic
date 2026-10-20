// Library: pick a root and a chord / scale and watch it move on the keyboard.
// Layout: picker on one side, keyboard + details on the other, so everything is visible without scrolling.
import { useState } from 'react';
import Piano from '../components/Piano.jsx';
import { playSteps } from '../music/audio.js';
import { PC, PC_EN, CHORDS, SCALES, INV_LABEL, chordNotes, scaleNotes, diatonic, stepPattern } from '../music/theory.js';

const GROUPS = ['טריאדות', 'ספטימות', 'צבעים'];
const up = (notes) => notes.map((x) => x + 12); // play an octave higher so it sounds pleasant
const noteNames = (notes) => notes.map((x) => PC[x % 12]).join(' · ');

export default function Library() {
  const [mode, setMode] = useState('chords');
  const [s, setS] = useState({ root: 0, id: 'maj', inv: 0 });
  const [sc, setSc] = useState({ root: 0, id: 'major' });
  const [active, setActive] = useState([]);

  const chordType = CHORDS.find((c) => c.id === s.id);
  const scale = SCALES.find((x) => x.id === sc.id);
  const cNotes = chordNotes(s.root, chordType.iv, s.inv);
  const sNotes = scaleNotes(sc.root, scale.iv);
  const dia = diatonic(sc.root, scale.iv);
  const isChords = mode === 'chords';
  const currentRoot = isChords ? s.root : sc.root;

  function chord(change) {
    const next = { ...s, ...change };
    const type = CHORDS.find((x) => x.id === next.id);
    if (next.inv >= type.iv.length) next.inv = 0; // the new chord has fewer inversions
    setS(next); setActive([]);
    playSteps([up(chordNotes(next.root, type.iv, next.inv))], { dur: 1.5 });
  }
  const arpeggio = () => playSteps(cNotes.map((x) => [x + 12]), { gap: 0.35, dur: 1, onStep: (n) => setActive(n.map((x) => x - 12)) });

  function playScale(pick = sc) {
    const notes = scaleNotes(pick.root, SCALES.find((x) => x.id === pick.id).iv);
    const steps = notes.concat(notes.slice(0, -1).reverse()).map((x) => [x + 12]); // up and down
    playSteps(steps, { gap: 0.28, dur: 0.6, onStep: (a) => setActive(a.map((x) => x - 12)) });
  }
  function pickScale(change) {
    const next = { ...sc, ...change };
    setSc(next); playScale(next);
  }
  const playDiatonic = (d) => { setActive(d.notes); playSteps([up(d.notes)], { dur: 1.4 }); };
  const switchMode = (m) => { setMode(m); setActive([]); };
  const pickRoot = (i) => (isChords ? chord({ root: i }) : pickScale({ root: i }));

  return (
    <div className="lib">
      <div className="lib-top">
        <div className="seg">
          <button className={`tab ${isChords ? 'on' : ''}`} onClick={() => switchMode('chords')}>אקורדים</button>
          <button className={`tab ${!isChords ? 'on' : ''}`} onClick={() => switchMode('scales')}>סולמות ומודים</button>
        </div>
        <div className="roots" role="group" aria-label="צליל שורש">
          {PC_EN.map((n, i) => <button key={i} className={`root ${currentRoot === i ? 'on' : ''}`} onClick={() => pickRoot(i)}>{n}<small>{PC[i]}</small></button>)}
        </div>
      </div>

      <div className="lib-body">
        <aside className="card lib-pick">
          <h3>{isChords ? 'סוג האקורד' : 'סוג הסולם'}</h3>
          {isChords ? GROUPS.map((g) => (
            <div key={g}>
              <h4 className="grp">{g}</h4>
              <div className="chips">{CHORDS.filter((c) => c.grp === g).map((c) => (
                <button key={c.id} className={`chip g ${s.id === c.id ? 'on' : ''}`} onClick={() => chord({ id: c.id })}>{c.name}{(c.sym || 'maj') !== c.name && <small dir="ltr">{c.sym || 'maj'}</small>}</button>
              ))}</div>
            </div>
          )) : <div className="chips">{SCALES.map((x) => <button key={x.id} className={`chip g ${sc.id === x.id ? 'on' : ''}`} onClick={() => pickScale({ id: x.id })}>{x.name}</button>)}</div>}
        </aside>

        <section className="card libdisplay">
          <div className="libhead">
            <div>
              <h2>{isChords ? `${PC_EN[s.root]}${chordType.sym}` : `${PC_EN[sc.root]} ${scale.name}`} <small className="muted">{PC[currentRoot]} {isChords ? chordType.name : ''}</small></h2>
              <p className="muted">{isChords ? chordType.desc : scale.desc}</p>
            </div>
            <div className="row">
              {isChords
                ? <><button onClick={() => chord({})}>▶ נגני</button><button className="ghost" onClick={arpeggio}>▶ ארפג'ו</button></>
                : <button onClick={() => playScale()}>▶ עולה ויורד</button>}
            </div>
          </div>
          <div className="fact">
            <span>צלילים: <b>{noteNames(isChords ? cNotes : sNotes)}</b></span>
            <span>{isChords ? 'נוסחה' : 'מרווחים'}: <b dir="ltr">{isChords ? chordType.f : stepPattern(scale.iv)}</b></span>
          </div>
          <Piano from={48} to={83} highlight={isChords ? cNotes : sNotes} rootPc={currentRoot} active={active} />
          {isChords ? (
            <>
              <h4 className="grp">כל הצורות של האקורד</h4>
              <div className="invs">{chordType.iv.map((_, i) => (
                <button key={i} className={`inv ${s.inv === i ? 'on' : ''}`} onClick={() => chord({ inv: i })}>
                  <b>{INV_LABEL[i]}</b><span>{noteNames(chordNotes(s.root, chordType.iv, i))}</span>
                </button>
              ))}</div>
            </>
          ) : dia.length > 0 && (
            <>
              <h4 className="grp">האקורדים של הסולם (לחצי לשמוע)</h4>
              <div className="chips">{dia.map((d) => <button key={d.roman} className="chip g" onClick={() => playDiatonic(d)}>{d.roman}<small>{d.name}</small></button>)}</div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

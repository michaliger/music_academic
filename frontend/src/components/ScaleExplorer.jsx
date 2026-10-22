// Scale explorer used inside lessons: pick any scale and any root, see it on the keyboard with degree numbers
// and the pattern of whole / half steps, and hear it go up and down.
import { useState } from 'react';
import Piano from './Piano.jsx';
import { playSteps } from '../music/audio.js';
import { PC_EN, SCALES, scaleNotes } from '../music/theory.js';

const STEP = { 1: 'חצי', 2: 'טון', 3: 'טון וחצי' };

export default function ScaleExplorer({ initial = 'major' }) {
  const [id, setId] = useState(initial);
  const [root, setRoot] = useState(0);
  const [active, setActive] = useState([]);
  const scale = SCALES.find((s) => s.id === id);
  const notes = scaleNotes(root, scale.iv);
  const diffs = scale.iv.map((v, i) => (scale.iv[i + 1] ?? 12) - v);

  const play = (nextId = id, nextRoot = root) => {
    const sc = SCALES.find((s) => s.id === nextId);
    const n = scaleNotes(nextRoot, sc.iv);
    playSteps(n.concat(n.slice(0, -1).reverse()).map((x) => [x + 12]), { gap: 0.3, dur: 0.6, onStep: (a) => setActive(a.map((x) => x - 12)) });
  };
  const pickScale = (v) => { setId(v); setActive([]); play(v, root); };
  const pickRoot = (v) => { setRoot(v); setActive([]); play(id, v); };

  return (
    <div className="scalex">
      <b> חקרי את כל הסולמות: בחרי סולם ושורש</b>
      <div className="chips">{SCALES.map((s) => <button key={s.id} className={`chip g ${id === s.id ? 'on' : ''}`} onClick={() => pickScale(s.id)}>{s.name}</button>)}</div>
      <div className="roots small" role="group" aria-label="צליל שורש">{PC_EN.map((n, i) => <button key={i} className={`root ${root === i ? 'on' : ''}`} onClick={() => pickRoot(i)}>{n}</button>)}</div>
      <div className="scalehead"><h4>{PC_EN[root]} {scale.name}</h4><button onClick={() => play()}>▶ עולה ויורד</button></div>
      <p className="muted">{scale.desc}</p>
      <div className="degrees" dir="ltr">
        {scale.iv.map((v, i) => (
          <div key={i} className="deg"><span className="dnote">{PC_EN[(root + v) % 12]}</span><small>{i + 1}</small><span className={`dstep d${diffs[i]}`}>{STEP[diffs[i]] || `${diffs[i]}`}</span></div>
        ))}
      </div>
      <Piano from={48} to={83} highlight={notes} rootPc={root} active={active} />
    </div>
  );
}

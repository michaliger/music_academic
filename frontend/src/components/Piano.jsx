import { useMemo, useState } from 'react';
import { playNow, playSteps } from '../music/audio.js';

const WHITE = [0, 2, 4, 5, 7, 9, 11];
const NAMES = { 0: 'דו', 2: 'רה', 4: 'מי', 5: 'פה', 7: 'סול', 9: 'לה', 11: 'סי' };

/** Soft colour per pitch class: pressed keys glow in it on the landing piano. */
const kc = (m) => `hsl(${(m % 12) * 30 + 10} 85% 72%)`;

/** Horizontal centre (in %) of a note on a keyboard spanning from..to; used to release floating notes above the right key. */
export function keyCenter(m, from, to) {
  let whites = 0, index = 0;
  for (let n = from; n <= to; n++) if (WHITE.includes(n % 12)) { if (n < m) index++; whites++; }
  const u = 100 / whites;
  return WHITE.includes(m % 12) ? index * u + u / 2 : index * u;
}

// highlight = marked notes, rootPc = root pitch class (0-11) to emphasise, active = notes sounding now,
// onPress(note, centerPercent) = optional callback so a parent can react to a key press (e.g. floating notes),
// real = realistic look (glossy keys, pressed-key movement) used on the landing page, namesOnC = label only the C keys.
export default function Piano({ highlight = [], active = [], rootPc = null, from = 60, to = 83, onPress, real = false, namesOnC = false }) {
  const { keys, whites } = useMemo(() => {
    const keys = []; let w = 0;
    for (let m = from; m <= to; m++) keys.push(WHITE.includes(m % 12) ? { m, white: true, i: w++ } : { m, white: false, i: w });
    return { keys, whites: w };
  }, [from, to]);
  const u = 100 / whites;
  return (
    <div className={`piano ${real ? 'real' : ''}`} dir="ltr">
      {keys.map((k) => {
        const hl = highlight.includes(k.m);
        const cls = `key ${k.white ? 'white' : 'black'} ${hl ? 'hl' : ''} ${hl && rootPc !== null && k.m % 12 === rootPc ? 'root' : ''} ${active.includes(k.m) ? 'on' : ''}`;
        const label = k.white && NAMES[k.m % 12] && (!namesOnC || k.m % 12 === 0) ? NAMES[k.m % 12] : null;
        return (
          <button key={k.m} aria-label={`note ${k.m}`} onClick={() => { playNow([k.m]); onPress?.(k.m, k.white ? k.i * u + u / 2 : k.i * u); }} className={cls}
            style={k.white ? { left: `${k.i * u}%`, width: `${u}%`, '--kc': kc(k.m) } : { left: `${k.i * u - u * 0.3}%`, width: `${u * 0.6}%`, '--kc': kc(k.m) }}>
            {label && <span>{label}</span>}
          </button>
        );
      })}
    </div>
  );
}

// בלוק "שמעי": כפתור ניגון + פסנתר שמאיר את הצלילים תוך כדי
export function PlayBlock({ label, steps }) {
  const [hl, setHl] = useState([]);
  const all = steps.flat();
  const from = Math.floor(Math.min(...all) / 12) * 12;
  const octaves = Math.max(2, Math.ceil((Math.max(...all) - from + 1) / 12));
  return (
    <div className="playblock">
      <button className="play" onClick={() => playSteps(steps, { onStep: setHl, gap: steps.length > 6 ? 0.5 : 0.7 })}>▶ {label}</button>
      <Piano highlight={hl} from={from} to={from + octaves * 12 - 1} />
    </div>
  );
}

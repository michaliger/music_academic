import { useMemo, useState } from 'react';
import { playNow, playSteps } from './audio.js';

const WHITE = [0, 2, 4, 5, 7, 9, 11];
const NAMES = { 0: 'דו', 2: 'רה', 4: 'מי', 5: 'פה', 7: 'סול', 9: 'לה', 11: 'סי' };

// highlight = צלילים מסומנים, rootPc = צליל שורש (0-11) שיודגש, active = צלילים שמנגנים כרגע
export default function Piano({ highlight = [], active = [], rootPc = null, from = 60, to = 83 }) {
  const { keys, whites } = useMemo(() => {
    const keys = []; let w = 0;
    for (let m = from; m <= to; m++) keys.push(WHITE.includes(m % 12) ? { m, white: true, i: w++ } : { m, white: false, i: w });
    return { keys, whites: w };
  }, [from, to]);
  const u = 100 / whites;
  return (
    <div className="piano" dir="ltr">
      {keys.map((k) => {
        const hl = highlight.includes(k.m);
        const cls = `key ${k.white ? 'white' : 'black'} ${hl ? 'hl' : ''} ${hl && rootPc !== null && k.m % 12 === rootPc ? 'root' : ''} ${active.includes(k.m) ? 'on' : ''}`;
        return (
          <button key={k.m} aria-label={`note ${k.m}`} onClick={() => playNow([k.m])} className={cls}
            style={k.white ? { left: `${k.i * u}%`, width: `${u}%` } : { left: `${k.i * u - u * 0.3}%`, width: `${u * 0.6}%` }}>
            {k.white && NAMES[k.m % 12] && <span>{NAMES[k.m % 12]}</span>}
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

// Landing-page piano: plays itself silently (keys light up, notes float up) and reacts to real key presses.
import { useEffect, useRef, useState } from 'react';
import Piano from './Piano.jsx';

const MELODY = [60, 64, 67, 72, 71, 67, 64, 67, 69, 72, 76, 72, 69, 65, 62, 67, 64, 60]; // a friendly C-major tune
const GLYPHS = ['♪', '♫', '♩', '♬'];
const COLORS = ['var(--gold)', 'var(--coral)', 'var(--mint)', '#ffffff'];
const FLOAT_MS = 3200; // must match the floatUp animation length in CSS
const pick = (list) => list[Math.floor(Math.random() * list.length)];

export default function HeroPiano() {
  const [floaters, setFloaters] = useState([]);
  const [active, setActive] = useState([]);
  const idRef = useRef(0);
  const pausedUntil = useRef(0); // the demo waits a few seconds after a real key press

  /** Adds one floating note above the keyboard at `left`% (it removes itself when its animation ends). */
  const spawn = (left) => {
    const id = idRef.current++;
    const note = { id, left, glyph: pick(GLYPHS), color: pick(COLORS), dx: Math.round(Math.random() * 120 - 60), rot: Math.round(Math.random() * 50 - 25) };
    setFloaters((list) => [...list.slice(-24), note]);
    setTimeout(() => setFloaters((list) => list.filter((f) => f.id !== id)), FLOAT_MS);
  };

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    let step = 0;
    const WHITES = 14; // keys 60..83 -> 14 white keys
    const timer = setInterval(() => {
      if (Date.now() < pausedUntil.current) return;
      const m = MELODY[step++ % MELODY.length];
      setActive([m]);
      const whiteIndex = [0, 2, 4, 5, 7, 9, 11].indexOf(m % 12) + 7 * Math.floor((m - 60) / 12);
      spawn(((whiteIndex + 0.5) * 100) / WHITES);
      setTimeout(() => setActive([]), 380);
    }, 620);
    return () => clearInterval(timer);
  }, []);

  const onPress = (_note, centerPercent) => {
    pausedUntil.current = Date.now() + 4000;
    setActive([]);
    spawn(centerPercent);
  };

  return (
    <div className="hero-piano">
      <div className="floaters" aria-hidden="true">
        {floaters.map((f) => (
          <span key={f.id} className="floater" style={{ left: `${f.left}%`, color: f.color, '--dx': `${f.dx}px`, '--rot': `${f.rot}deg` }}>{f.glyph}</span>
        ))}
      </div>
      <Piano from={60} to={83} active={active} onPress={onPress} />
    </div>
  );
}

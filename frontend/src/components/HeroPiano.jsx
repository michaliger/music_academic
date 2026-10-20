// Landing-page piano: a realistic three-octave keyboard that plays itself silently (keys light up, notes float up)
// and reacts to real presses, either with the mouse or with the computer keyboard.
import { useEffect, useRef, useState } from 'react';
import Piano, { keyCenter } from './Piano.jsx';
import { playBell, playNow } from '../music/audio.js';

const FROM = 48; // C3
const TO = 83; // B5
// a bouncy, lullaby-like C-major tune (original)
const MELODY = [64, 67, 72, 71, 67, 69, 72, 76, 74, 72, 71, 67, 69, 67, 64, 62, 60, 64, 67, 69, 67, 64, 62, 60];
const GLYPHS = ['♪', '♫', '♩', '♬'];
const COLORS = ['var(--gold)', 'var(--coral)', 'var(--mint)', '#ffffff'];
const FLOAT_MS = 3200; // must match the floatUp animation length in CSS
const pick = (list) => list[Math.floor(Math.random() * list.length)];

// computer keys -> notes (home row = white keys from C4, row above = black keys)
const KEYMAP = Object.fromEntries([
  ...[...'asdfghjkl;'].map((k, i) => [k, [60, 62, 64, 65, 67, 69, 71, 72, 74, 76][i]]),
  ...[...'wetyuop'].map((k, i) => [k, [61, 63, 66, 68, 70, 73, 75][i]]),
]);

export default function HeroPiano() {
  const [floaters, setFloaters] = useState([]);
  const [active, setActive] = useState([]);
  const idRef = useRef(0);
  const pausedUntil = useRef(0); // the demo waits a few seconds after a real key press

  /** Adds one floating note above the keyboard at `left`% (it removes itself when its animation ends). */
  const spawn = (left) => {
    const id = idRef.current++;
    const note = { id, left, glyph: pick(GLYPHS), color: pick(COLORS), dx: Math.round(Math.random() * 140 - 70), rot: Math.round(Math.random() * 50 - 25) };
    setFloaters((list) => [...list.slice(-24), note]);
    setTimeout(() => setFloaters((list) => list.filter((f) => f.id !== id)), FLOAT_MS);
  };

  // the self-playing demo
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    let step = 0;
    const timer = setInterval(() => {
      if (Date.now() < pausedUntil.current) return;
      const m = MELODY[step++ % MELODY.length];
      setActive([m]);
      playBell(m); // sounds only when the background music is on
      spawn(keyCenter(m, FROM, TO));
      setTimeout(() => setActive([]), 380);
    }, 520);
    return () => clearInterval(timer);
  }, []);

  // playing with the computer keyboard
  useEffect(() => {
    const onKey = (e) => {
      const m = KEYMAP[e.key.toLowerCase()];
      if (m === undefined || e.repeat || e.ctrlKey || e.metaKey || e.altKey || /input|textarea|select/i.test(e.target.tagName)) return;
      playNow([m]);
      pausedUntil.current = Date.now() + 4000;
      setActive([m]);
      spawn(keyCenter(m, FROM, TO));
      setTimeout(() => setActive([]), 260);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onPress = (_note, centerPercent) => {
    pausedUntil.current = Date.now() + 4000;
    setActive([]);
    spawn(centerPercent);
  };

  return (
    <div className="grand">
      <div className="grand-glow" aria-hidden="true" />
      <div className="grand-lid"><span className="grand-line" /><span className="grand-shine" /></div>
      <div className="grand-keys">
        <div className="floaters" aria-hidden="true">
          {floaters.map((f) => (
            <span key={f.id} className="floater" style={{ left: `${f.left}%`, color: f.color, '--dx': `${f.dx}px`, '--rot': `${f.rot}deg` }}>{f.glyph}</span>
          ))}
        </div>
        <Piano from={FROM} to={TO} active={active} onPress={onPress} real namesOnC />
      </div>
      <p className="grand-hint">לחצי על הקלידים, או נגני במקלדת של המחשב: <bdi dir="ltr">A S D F G H J K L</bdi></p>
    </div>
  );
}

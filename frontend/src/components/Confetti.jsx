// A short burst of falling confetti for a passed quiz (decorative, removes itself).
import { useEffect, useState } from 'react';

const COLORS = ['#7c63cf', '#ff9d86', '#6fd8b8', '#f5c46a', '#a46fd0', '#ffffff'];
const PIECES = Array.from({ length: 70 }, (_, i) => ({
  left: (i * 53) % 100,
  delay: ((i * 7) % 20) / 20,
  dur: 2.2 + ((i * 11) % 15) / 10,
  size: 7 + (i % 5) * 2,
  color: COLORS[i % COLORS.length],
  rot: (i * 47) % 360,
  round: i % 3 === 0,
}));

export default function Confetti() {
  const [on, setOn] = useState(true);
  useEffect(() => { const t = setTimeout(() => setOn(false), 5000); return () => clearTimeout(t); }, []);
  if (!on || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return null;
  return (
    <div className="confetti" aria-hidden="true">
      {PIECES.map((p, i) => (
        <i key={i} style={{ left: `${p.left}%`, width: p.size, height: p.round ? p.size : p.size * 1.8, background: p.color, borderRadius: p.round ? '50%' : 2, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`, '--rot': `${p.rot}deg` }} />
      ))}
    </div>
  );
}

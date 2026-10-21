// A quiet, endless drift of musical notes behind every page (decorative only).
const GLYPHS = ['♪', '♫', '♩', '♬', '𝄞'];
const NOTES = Array.from({ length: 16 }, (_, i) => ({
  g: GLYPHS[i % GLYPHS.length],
  left: (i * 37 + 8) % 96,
  size: 22 + ((i * 13) % 26),
  dur: 22 + ((i * 7) % 18),
  delay: -((i * 5) % 30),
  drift: ((i * 29) % 120) - 60,
}));

export default function NotesBg() {
  return (
    <div className="notesbg" aria-hidden="true">
      {NOTES.map((n, i) => (
        <span key={i} style={{ left: `${n.left}%`, fontSize: n.size, animationDuration: `${n.dur}s`, animationDelay: `${n.delay}s`, '--dx': `${n.drift}px` }}>{n.g}</span>
      ))}
    </div>
  );
}

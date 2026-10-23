// Rhythm piano game: notes fall down eight lanes (C major, one octave); press the matching key (or tap the lane) as a note reaches the line.
// The songs are traditional / public-domain tunes. Hits play the real note, so playing the game also teaches the melody.
import { useEffect, useRef, useState } from 'react';
import { playNow } from '../music/audio.js';
import Confetti from '../components/Confetti.jsx';

const LANES = [
  { name: 'דו', midi: 60, key: 'a' }, { name: 'רה', midi: 62, key: 's' }, { name: 'מי', midi: 64, key: 'd' }, { name: 'פה', midi: 65, key: 'f' },
  { name: 'סול', midi: 67, key: 'g' }, { name: 'לה', midi: 69, key: 'h' }, { name: 'סי', midi: 71, key: 'j' }, { name: 'דו', midi: 72, key: 'k' },
];
// [lane, beats]
const SONGS = [
  { id: 'twinkle', title: 'כוכב קטן (מנגינה מסורתית)', level: 'קל', bpm: 84,
    notes: [[0, 1], [0, 1], [4, 1], [4, 1], [5, 1], [5, 1], [4, 2], [3, 1], [3, 1], [2, 1], [2, 1], [1, 1], [1, 1], [0, 2], [4, 1], [4, 1], [3, 1], [3, 1], [2, 1], [2, 1], [1, 2], [4, 1], [4, 1], [3, 1], [3, 1], [2, 1], [2, 1], [1, 2], [0, 1], [0, 1], [4, 1], [4, 1], [5, 1], [5, 1], [4, 2], [3, 1], [3, 1], [2, 1], [2, 1], [1, 1], [1, 1], [0, 2]] },
  { id: 'jacques', title: 'פרר ז׳אק (מנגינה מסורתית)', level: 'קל', bpm: 92,
    notes: [[0, 1], [1, 1], [2, 1], [0, 1], [0, 1], [1, 1], [2, 1], [0, 1], [2, 1], [3, 1], [4, 2], [2, 1], [3, 1], [4, 2], [4, .5], [5, .5], [4, .5], [3, .5], [2, 1], [0, 1], [4, .5], [5, .5], [4, .5], [3, .5], [2, 1], [0, 1], [0, 1], [4, 1], [0, 2], [0, 1], [4, 1], [0, 2]] },
  { id: 'ode', title: 'שיר השמחה (בטהובן)', level: 'בינוני', bpm: 100,
    notes: [[2, 1], [2, 1], [3, 1], [4, 1], [4, 1], [3, 1], [2, 1], [1, 1], [0, 1], [0, 1], [1, 1], [2, 1], [2, 1.5], [1, .5], [1, 2],
      [2, 1], [2, 1], [3, 1], [4, 1], [4, 1], [3, 1], [2, 1], [1, 1], [0, 1], [0, 1], [1, 1], [2, 1], [1, 1.5], [0, .5], [0, 2]] },
  { id: 'jingle', title: 'פעמוני החורף (Jingle Bells, מסורתי)', level: 'בינוני', bpm: 112,
    notes: [[2, 1], [2, 1], [2, 2], [2, 1], [2, 1], [2, 2], [2, 1], [4, 1], [0, 1.5], [1, .5], [2, 4],
      [3, 1], [3, 1], [3, 1.5], [3, .5], [3, 1], [2, 1], [2, 1], [2, .5], [2, .5], [2, 1], [1, 1], [1, 1], [2, 1], [1, 2], [4, 2]] },
];
// "Your own song": notes by Hebrew name or letter, separated by spaces; a dash "-" holds the previous note one more beat.
const NAME_TO_LANE = { 'דו': 0, 'רה': 1, 'מי': 2, 'פה': 3, 'סול': 4, 'לה': 5, 'סי': 6, "דו'": 7, 'דו2': 7, c: 0, d: 1, e: 2, f: 3, g: 4, a: 5, b: 6, c2: 7 };
export function parseTune(text) {
  const notes = [];
  for (const raw of String(text).trim().split(/[\s,]+/)) {
    const tok = raw.toLowerCase();
    if (!tok) continue;
    if (tok === '-' || tok === '–') { if (notes.length) notes[notes.length - 1][1] += 1; continue; }
    if (tok in NAME_TO_LANE) notes.push([NAME_TO_LANE[tok], 1]);
    else return { error: `לא הבנתי את ״${raw}״. כותבים: דו רה מי פה סול לה סי דו׳ (או C D E F G A B), ומקף להארכה.` };
  }
  return notes.length >= 3 ? { notes } : { error: 'צריך לפחות שלושה תווים.' };
}
const SPEEDS = [['איטי', 0.8], ['רגיל', 1], ['מהיר', 1.25]];
const FALL = 2.1; // seconds a note needs from the top to the line
const LEAD = 3; // countdown seconds
const PERFECT = 0.13;
const GOOD = 0.28;
const hue = (i) => 250 + i * 14;

const load = (id) => { try { return Number(localStorage.getItem(`game-best-${id}`) || 0); } catch { return 0; } };
const save = (id, v) => { try { localStorage.setItem(`game-best-${id}`, String(v)); } catch { /* storage unavailable */ } };

export default function Game() {
  const [phase, setPhase] = useState('menu'); // menu | play | done
  const [song, setSong] = useState(SONGS[0]);
  const [speed, setSpeed] = useState(1);
  const [hud, setHud] = useState({ score: 0, combo: 0, text: '' });
  const [result, setResult] = useState(null);
  const [best, setBest] = useState({});
  const [tune, setTune] = useState('');
  const [tuneErr, setTuneErr] = useState('');
  const canvasRef = useRef(null);
  const game = useRef(null);

  useEffect(() => { setBest(Object.fromEntries(SONGS.map((s) => [s.id, load(s.id)]))); }, [phase]);

  function press(lane) {
    const g = game.current;
    if (!g) return;
    g.lit[lane] = performance.now();
    playNow([LANES[lane].midi]);
    const now = (performance.now() - g.start) / 1000;
    let target = null;
    for (const n of g.notes) if (!n.done && n.lane === lane && Math.abs(n.t - now) <= GOOD && (!target || Math.abs(n.t - now) < Math.abs(target.t - now))) target = n;
    if (!target) { g.combo = 0; return; }
    target.done = true;
    const perfect = Math.abs(target.t - now) <= PERFECT;
    target.hit = perfect ? 'perfect' : 'good';
    g.combo += 1; g.maxCombo = Math.max(g.maxCombo, g.combo);
    g.score += (perfect ? 100 : 50) * (1 + Math.min(g.combo, 20) * 0.05);
    g[perfect ? 'perfects' : 'goods'] += 1;
    g.pops.push({ lane, text: perfect ? 'מושלם!' : 'יפה', born: performance.now() });
  }

  function begin() {
    const spb = 60 / (song.bpm * speed);
    let beat = 0;
    const notes = song.notes.map(([lane, len]) => { const n = { lane, t: LEAD + FALL + beat * spb, done: false, hit: '' }; beat += len; return n; });
    game.current = { notes, start: performance.now(), score: 0, combo: 0, maxCombo: 0, perfects: 0, goods: 0, misses: 0, lit: [], pops: [], end: notes[notes.length - 1].t + 1.2 };
    setResult(null); setPhase('play');
  }

  // keyboard
  useEffect(() => {
    if (phase !== 'play') return undefined;
    const onKey = (e) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      const lane = LANES.findIndex((l) => l.key === e.key.toLowerCase());
      if (lane >= 0) { e.preventDefault(); press(lane); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase]);

  // game loop
  useEffect(() => {
    if (phase !== 'play') return undefined;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let raf;
    const dpr = window.devicePixelRatio || 1;
    const fit = () => { const r = canvas.getBoundingClientRect(); canvas.width = r.width * dpr; canvas.height = r.height * dpr; };
    fit();
    window.addEventListener('resize', fit);
    let lastHud = 0;

    const frame = () => {
      const g = game.current;
      const W = canvas.width / dpr, H = canvas.height / dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const t = (performance.now() - g.start) / 1000;
      const laneW = W / LANES.length;
      const lineY = H - 86;

      // background
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#1d1840'); bg.addColorStop(1, '#3a2c82');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < LANES.length; i++) {
        const lit = performance.now() - (g.lit[i] || -1e9) < 180;
        ctx.fillStyle = lit ? `hsla(${hue(i)}, 85%, 70%, .28)` : (i % 2 ? 'rgba(255,255,255,.035)' : 'rgba(255,255,255,.07)');
        ctx.fillRect(i * laneW, 0, laneW, H);
      }

      // misses
      for (const n of g.notes) if (!n.done && t - n.t > GOOD) { n.done = true; n.hit = 'miss'; g.misses += 1; g.combo = 0; }

      // notes
      for (const n of g.notes) {
        if (n.hit === 'perfect' || n.hit === 'good') continue;
        const y = lineY - ((n.t - t) / FALL) * lineY;
        if (y < -40 || y > H + 40) continue;
        ctx.globalAlpha = n.hit === 'miss' ? 0.28 : 1;
        const x = n.lane * laneW + 6, w = laneW - 12, h = 34;
        const grad = ctx.createLinearGradient(0, y - h, 0, y);
        grad.addColorStop(0, `hsl(${hue(n.lane)}, 90%, 78%)`); grad.addColorStop(1, `hsl(${hue(n.lane)}, 80%, 58%)`);
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.roundRect(x, y - h, w, h, 10); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.font = '600 14px Heebo, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(LANES[n.lane].name, x + w / 2, y - h / 2 + 5);
        ctx.globalAlpha = 1;
      }

      // hit line and keys
      ctx.fillStyle = 'rgba(245,196,106,.9)'; ctx.fillRect(0, lineY, W, 3);
      for (let i = 0; i < LANES.length; i++) {
        const lit = performance.now() - (g.lit[i] || -1e9) < 180;
        ctx.fillStyle = lit ? `hsl(${hue(i)}, 90%, 78%)` : '#f8f4ea';
        ctx.beginPath(); ctx.roundRect(i * laneW + 4, lineY + 14, laneW - 8, 62, [0, 0, 12, 12]); ctx.fill();
        ctx.fillStyle = '#3a2a85'; ctx.font = '700 16px Heebo, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(LANES[i].name, i * laneW + laneW / 2, lineY + 44);
        ctx.fillStyle = '#7d73ad'; ctx.font = '500 12px Heebo, sans-serif';
        ctx.fillText(LANES[i].key.toUpperCase(), i * laneW + laneW / 2, lineY + 64);
      }

      // pops
      g.pops = g.pops.filter((p) => performance.now() - p.born < 600);
      for (const p of g.pops) {
        const age = (performance.now() - p.born) / 600;
        ctx.globalAlpha = 1 - age; ctx.fillStyle = '#ffe9b0'; ctx.font = '700 20px Heebo, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(p.text, p.lane * laneW + laneW / 2, lineY - 24 - age * 40); ctx.globalAlpha = 1;
      }

      // countdown
      if (t < LEAD) {
        ctx.fillStyle = 'rgba(20,16,50,.55)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff'; ctx.font = '700 90px Heebo, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(String(Math.ceil(LEAD - t)), W / 2, H / 2);
        ctx.font = '500 18px Heebo, sans-serif'; ctx.fillText('הכינו את האצבעות: A S D F G H J K', W / 2, H / 2 + 44);
      }

      if (performance.now() - lastHud > 90) { lastHud = performance.now(); setHud({ score: Math.round(g.score), combo: g.combo }); }

      if (t > g.end) {
        const total = g.notes.length;
        const acc = Math.round((100 * (g.perfects + g.goods * 0.6)) / total);
        const stars = acc >= 90 ? 3 : acc >= 70 ? 2 : acc >= 40 ? 1 : 0;
        const score = Math.round(g.score);
        if (score > load(song.id)) save(song.id, score);
        setResult({ score, acc, stars, perfects: g.perfects, goods: g.goods, misses: g.misses, maxCombo: g.maxCombo, total });
        setPhase('done');
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', fit); };
  }, [phase]);

  const onPointer = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    const lane = Math.min(LANES.length - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * LANES.length)));
    press(lane);
  };

  if (phase === 'menu') {
    return (
      <div className="game">
        <section className="card gamehead">
          <h2>משחק הפסנתר</h2>
          <p className="muted">תווים נופלים על שמונה קלידים. לוחצים על הקליד המתאים ברגע שהתו מגיע לקו הזהב, במקלדת של המחשב (<bdi dir="ltr">A S D F G H J K</bdi>) או בנגיעה. כל לחיצה מנגנת את הצליל, כך שבסוף גם למדתם את המנגינה.</p>
          <div className="chips">{SPEEDS.map(([l, v]) => <button key={l} className={`chip ${speed === v ? 'on' : ''}`} onClick={() => setSpeed(v)}>{l}</button>)}</div>
        </section>
        <div className="songgrid">
          {SONGS.map((s) => (
            <button key={s.id} className={`songcard ${song.id === s.id ? 'on' : ''}`} onClick={() => setSong(s)}>
              <b>{s.title}</b>
              <span className="muted">רמה: {s.level} · {s.notes.length} תווים</span>
              <span className="bestscore">{best[s.id] ? `השיא שלך: ${best[s.id]}` : 'עוד לא שיחקת'}</span>
            </button>
          ))}
        </div>
        <section className="card">
          <h2>שיר משלך</h2>
          <p className="muted">מכירה מנגינה? כתבי אותה בתווים ושחקי אותה. למשל: <bdi>מי מי פה סול סול פה מי רה - דו</bdi> (מקף מאריך את התו הקודם). אפשר גם באותיות: <bdi dir="ltr">E E F G G F E D - C</bdi>.</p>
          <textarea rows="2" value={tune} onChange={(e) => { setTune(e.target.value); setTuneErr(''); }} placeholder="דו רה מי דו  דו רה מי דו  מי פה סול -" />
          {tuneErr && <div className="error">{tuneErr}</div>}
          <button className="ghost" onClick={() => { const r = parseTune(tune); if (r.error) { setTuneErr(r.error); return; } setSong({ id: 'mine', title: 'השיר שלך', level: 'שלך', bpm: 96, notes: r.notes }); }}>השתמשי בשיר הזה</button>
        </section>
        <div className="row"><button className="cta" onClick={begin}>התחילי לשחק: {song.title}</button></div>
      </div>
    );
  }

  return (
    <div className="game">
      <div className="gamehud"><span>ניקוד <b>{hud.score}</b></span><span>רצף <b>{hud.combo}</b></span><span className="grow" /><button className="ghost" onClick={() => setPhase('menu')}>יציאה</button></div>
      <canvas ref={canvasRef} className="gamecanvas" onPointerDown={phase === 'play' ? onPointer : undefined} />
      {phase === 'done' && result && (
        <section className="card gameresult">
          {result.stars === 3 && <Confetti />}
          <h2>{result.stars === 3 ? 'מושלם!' : result.stars >= 1 ? 'כל הכבוד!' : 'עוד סיבוב ותצליחי'}</h2>
          <div className="stars" aria-label={`${result.stars} כוכבים`}>{[1, 2, 3].map((n) => <span key={n} className={n <= result.stars ? 'on' : ''}>★</span>)}</div>
          <p className="big2">{result.score} נקודות · דיוק {result.acc}%</p>
          <p className="muted">מושלם: {result.perfects} · יפה: {result.goods} · החמצות: {result.misses} · רצף שיא: {result.maxCombo} מתוך {result.total}</p>
          <div className="row"><button onClick={begin}>עוד פעם</button><button className="ghost" onClick={() => setPhase('menu')}>לבחירת שיר</button></div>
        </section>
      )}
    </div>
  );
}

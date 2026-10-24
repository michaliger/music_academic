// Rhythm piano game: notes fall down eight lanes (C major, one octave); press the matching key (or tap the lane) as a note reaches the line.
// The songs are traditional / public-domain tunes. Hits play the real note, so playing the game also teaches the melody.
import { useEffect, useRef, useState } from 'react';
import { playNow } from '../music/audio.js';
import Confetti from '../components/Confetti.jsx';

const WHITE = [0, 2, 4, 5, 7, 9, 11, 12]; // semitones above middle C
const NAMES = ['דו', 'דו♯', 'רה', 'רה♯', 'מי', 'פה', 'פה♯', 'סול', 'סול♯', 'לה', 'לה♯', 'סי', 'דו'];
const KEYS = { 0: 'a', 1: 'w', 2: 's', 3: 'e', 4: 'd', 5: 'f', 6: 't', 7: 'g', 8: 'y', 9: 'h', 10: 'u', 11: 'j', 12: 'k' };
const isBlack = (n) => [1, 3, 6, 8, 10].includes(n);
const lanesFor = (chromatic) => (chromatic ? Array.from({ length: 13 }, (_, i) => i) : WHITE).map((n) => ({ semi: n, name: NAMES[n], midi: 60 + n, key: KEYS[n], black: isBlack(n) }));
// [white-key index, beats]; converted to semitones below
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
SONGS.push(
  { id: 'mary', title: 'למרים היה טלה קטן (מסורתי)', level: 'קל', bpm: 100,
    notes: [[2, 1], [1, 1], [0, 1], [1, 1], [2, 1], [2, 1], [2, 2], [1, 1], [1, 1], [1, 2], [2, 1], [4, 1], [4, 2], [2, 1], [1, 1], [0, 1], [1, 1], [2, 1], [2, 1], [2, 1], [2, 1], [1, 1], [1, 1], [2, 1], [1, 1], [0, 4]] },
  { id: 'row', title: 'חותרים בסירה (Row Your Boat, מסורתי)', level: 'קל', bpm: 100,
    notes: [[0, 1.5], [0, 1.5], [0, 1], [1, .5], [2, 1.5], [2, 1], [1, .5], [2, 1], [3, .5], [4, 3], [7, .5], [7, .5], [7, .5], [4, .5], [4, .5], [4, .5], [2, .5], [2, .5], [2, .5], [0, .5], [0, .5], [0, .5], [4, 1], [3, .5], [2, 1], [1, .5], [0, 3]] },
  { id: 'buns', title: 'לחמניות חמות (Hot Cross Buns, מסורתי)', level: 'קל', bpm: 96,
    notes: [[2, 1], [1, 1], [0, 2], [2, 1], [1, 1], [0, 2], [0, .5], [0, .5], [0, .5], [0, .5], [1, .5], [1, .5], [1, .5], [1, .5], [2, 1], [1, 1], [0, 2]] },
);
SONGS.forEach((s) => { s.notes = s.notes.map(([l, b]) => [WHITE[l], b]); });
// "Your own song": notes by Hebrew name or letter, separated by spaces; a dash "-" holds the previous note one more beat.
const BASE = { 'דו': 0, 'רה': 2, 'מי': 4, 'פה': 5, 'סול': 7, 'לה': 9, 'סי': 11, c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
export function parseTune(text) {
  const notes = [];
  for (const raw of String(text).trim().split(/[\s,]+/)) {
    let tok = raw.toLowerCase();
    if (!tok) continue;
    if (tok === '-' || tok === '–') { if (notes.length) notes[notes.length - 1][1] += 1; continue; }
    if (tok === '_' || tok === 'שקט') { notes.push([null, 1]); continue; }
    let up = 0;
    if (/(#|♯)$/.test(tok)) { up = 1; tok = tok.replace(/(#|♯)$/, ''); }
    let hi = false;
    if (/('|׳|2)$/.test(tok)) { hi = true; tok = tok.replace(/('|׳|2)$/, ''); }
    if (tok in BASE) { const n = BASE[tok] + up + (hi ? 12 : 0); if (n > 12) return { error: 'הטווח הוא מדו עד דו הבא.' }; notes.push([n, 1]); }
    else return { error: `לא הבנתי את ״${raw}״. כותבים: דו רה מי פה סול לה סי (או C D E F G A B), ♯ או # לתו שחור, מקף להארכה.` };
  }
  return notes.filter((n) => n[0] !== null).length >= 3 ? { notes } : { error: 'צריך לפחות שלושה תווים.' };
}
const SPEEDS = [['איטי', 0.8], ['רגיל', 1], ['מהיר', 1.25]];
const FALL = 2.1; // seconds a note needs from the top to the line
const LEAD = 3; // countdown seconds
const PERFECT = 0.13;
const GOOD = 0.28;
const hue = (i) => 250 + i * 14;

const loadTunes = () => { try { return JSON.parse(localStorage.getItem('game-tunes') || '[]'); } catch { return []; } };
const saveTunes = (l) => { try { localStorage.setItem('game-tunes', JSON.stringify(l)); } catch { /* storage unavailable */ } };
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
  const [chromatic, setChromatic] = useState(false);
  const [mine, setMine] = useState(loadTunes);
  const canvasRef = useRef(null);
  const game = useRef(null);

  useEffect(() => { setBest(Object.fromEntries([...SONGS, ...mine].map((s) => [s.id, load(s.id)]))); }, [phase, mine]);
  const persist = (list) => { setMine(list); saveTunes(list); };

  function press(lane) {
    const g = game.current;
    if (!g) return;
    g.lit[lane] = performance.now();
    playNow([g.lanes[lane].midi]);
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
    const needBlack = song.notes.some(([n]) => n !== null && isBlack(n));
    const lanes = lanesFor(chromatic || needBlack);
    const notes = [];
    for (const [semi, len] of song.notes) { if (semi !== null) notes.push({ lane: lanes.findIndex((l) => l.semi === semi), t: LEAD + FALL + beat * spb, done: false, hit: '' }); beat += len; }
    game.current = { lanes, notes, start: performance.now(), score: 0, combo: 0, maxCombo: 0, perfects: 0, goods: 0, misses: 0, lit: [], pops: [], end: notes[notes.length - 1].t + 1.2 };
    setResult(null); setPhase('play');
  }

  // keyboard
  useEffect(() => {
    if (phase !== 'play') return undefined;
    const onKey = (e) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      const lane = (game.current?.lanes || []).findIndex((l) => l.key === e.key.toLowerCase());
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
      const LANES = g.lanes;
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
        ctx.fillStyle = lit ? `hsl(${hue(i)}, 90%, 78%)` : (LANES[i].black ? '#2a2060' : '#f8f4ea');
        ctx.beginPath(); ctx.roundRect(i * laneW + 4, lineY + 14, laneW - 8, 62, [0, 0, 12, 12]); ctx.fill();
        ctx.fillStyle = LANES[i].black ? '#fff' : '#3a2a85'; ctx.font = `700 ${LANES.length > 8 ? 12 : 16}px Heebo, sans-serif`; ctx.textAlign = 'center';
        ctx.fillText(LANES[i].name, i * laneW + laneW / 2, lineY + 44);
        ctx.fillStyle = LANES[i].black ? '#b9aee8' : '#7d73ad'; ctx.font = '500 12px Heebo, sans-serif';
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
        ctx.font = '500 18px Heebo, sans-serif'; ctx.fillText(`הכינו את האצבעות: ${LANES.map((l) => l.key.toUpperCase()).join(' ')}`, W / 2, H / 2 + 44);
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
    const n = game.current.lanes.length;
    const lane = Math.min(n - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * n)));
    press(lane);
  };

  if (phase === 'menu') {
    return (
      <div className="game">
        <section className="card gamehead">
          <h2>משחק הפסנתר</h2>
          <p className="muted">תווים נופלים על קלידים. לוחצים על הקליד המתאים ברגע שהתו מגיע לקו הזהב, במקלדת של המחשב (<bdi dir="ltr">A S D F G H J K</bdi>, ובמצב שחורים גם <bdi dir="ltr">W E T Y U</bdi>) או בנגיעה. כל לחיצה מנגנת את הצליל, כך שבסוף גם למדתם את המנגינה.</p>
          <div className="fingertip">
            <b>איך מניחים את האצבעות?</b>
            <p>שמי את שתי הידיים על השורה האמצעית, ככה שכל האצבעות מוכנות מראש: ביד שמאל הזרת על <bdi dir="ltr">A</bdi>, הקמיצה על <bdi dir="ltr">S</bdi>, האמה על <bdi dir="ltr">D</bdi> והאצבע המורה על <bdi dir="ltr">F</bdi>. ביד ימין המורה על <bdi dir="ltr">J</bdi>, האמה על <bdi dir="ltr">K</bdi>, ואת <bdi dir="ltr">G</bdi> ו-<bdi dir="ltr">H</bdi> לוחצים עם אותה אצבע מורה, שזזה צעד אחד. בקליטים <bdi dir="ltr">F</bdi> ו-<bdi dir="ltr">J</bdi> יש בליטה קטנה: מרגישים אותה ויודעים איפה הבית, בלי להסתכל על המקלדת. העיניים נשארות על המסך, ואחרי כל לחיצה חוזרים למקום.</p>
            <p>בתווים השחורים (למעלה בשורה <bdi dir="ltr">W E T Y U</bdi>) משתמשים באותה אצבע שנמצאת מתחת לתו, ומרימים אותה שורה אחת למעלה.</p>
          </div>
          <div className="chips"><button className={`chip ${chromatic ? 'on' : ''}`} onClick={() => setChromatic(!chromatic)}>{chromatic ? 'תווים שחורים: פועל' : 'תווים שחורים: כבוי'}</button></div>
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
        {mine.length > 0 && (
          <>
            <h3 className="mytunes">השירים ששמרת</h3>
            <div className="songgrid">
              {mine.map((s) => (
                <div key={s.id} className={`songcard ${song.id === s.id ? 'on' : ''}`} onClick={() => setSong({ ...s, level: 'שלך' })} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setSong({ ...s, level: 'שלך' })}>
                  <b>{s.title}</b>
                  <span className="muted">{s.notes.filter((n) => n[0] !== null).length} תווים</span>
                  <span className="bestscore">{best[s.id] ? `השיא שלך: ${best[s.id]}` : 'עוד לא שיחקת'}</span>
                  <button className="ghost small" onClick={(e) => { e.stopPropagation(); persist(mine.filter((m) => m.id !== s.id)); if (song.id === s.id) setSong(SONGS[0]); }}>מחיקה</button>
                </div>
              ))}
            </div>
          </>
        )}
        <TuneEditor onSave={(t) => { persist([...mine, t]); setSong({ ...t, level: 'שלך' }); }} />
        <section className="card">
          <h2>או כתבי בטקסט</h2>
          <p className="muted">למשל: <bdi>מי מי פה סול סול פה מי רה - דו</bdi> (מקף מאריך את התו הקודם, קו תחתון הוא שקט, ♯ או # לתו שחור). אפשר גם באותיות: <bdi dir="ltr">E E F G G F E D - C</bdi>.</p>
          <textarea rows="2" value={tune} onChange={(e) => { setTune(e.target.value); setTuneErr(''); }} placeholder="דו רה מי דו  דו רה מי דו  מי פה סול -" />
          {tuneErr && <div className="error">{tuneErr}</div>}
          <button className="ghost" onClick={() => { const r = parseTune(tune); if (r.error) { setTuneErr(r.error); return; } const t = { id: `t${Date.now()}`, title: 'שיר שלי', bpm: 96, notes: r.notes }; persist([...mine, t]); setSong({ ...t, level: 'שלך' }); }}>שמרי ובחרי</button>
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

const DURS = [['½', 0.5], ['1', 1], ['2', 2], ['4', 4]];
function TuneEditor({ onSave }) {
  const [notes, setNotes] = useState([]); // [semi | null, beats]
  const [dur, setDur] = useState(1);
  const [black, setBlack] = useState(false);
  const [title, setTitle] = useState('');
  const [bpm, setBpm] = useState(96);
  const [msg, setMsg] = useState('');
  const timers = useRef([]);
  const lanes = lanesFor(black);
  const add = (semi) => { setNotes((n) => [...n, [semi, dur]]); setMsg(''); if (semi !== null) playNow([60 + semi]); };
  const stop = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => stop, []);
  function preview() {
    stop();
    let at = 0;
    for (const [semi, len] of notes) { if (semi !== null) timers.current.push(setTimeout(() => playNow([60 + semi]), at * 1000)); at += len * (60 / bpm); }
  }
  const real = notes.filter((n) => n[0] !== null).length;
  function save() {
    if (real < 3) { setMsg('צריך לפחות שלושה תווים.'); return; }
    onSave({ id: `t${Date.now()}`, title: title.trim() || 'שיר שלי', bpm, notes }); setNotes([]); setTitle(''); setMsg('נשמר! הוא מופיע למעלה בין השירים ששמרת.');
  }
  return (
    <section className="card tuneedit">
      <h2>הלחנה שלך</h2>
      <p className="muted">בחרי משך ולחצי על התווים כדי להוסיף אותם למנגינה. אפשר להוסיף שקט, לשמוע את התוצאה, ולשמור: השיר יישאר כאן גם אחרי שסוגרים את האתר.</p>
      <div className="chips"><span className="muted">משך (בפעימות):</span>{DURS.map(([l, v]) => <button key={v} className={`chip ${dur === v ? 'on' : ''}`} onClick={() => setDur(v)}>{l}</button>)}
        <button className={`chip ${black ? 'on' : ''}`} onClick={() => setBlack(!black)}>{black ? 'תווים שחורים: פועל' : 'תווים שחורים: כבוי'}</button></div>
      <div className="notepad">{lanes.map((l) => <button key={l.semi} className={`nbtn ${l.black ? 'blk' : ''}`} onClick={() => add(l.semi)}>{l.name}</button>)}<button className="nbtn rest" onClick={() => add(null)}>שקט</button></div>
      <div className="seq" aria-live="polite">{notes.length ? notes.map(([n, d], i) => <span key={i} className="tn">{n === null ? 'שקט' : NAMES[n]}<sup>{d}</sup></span>) : <span className="muted">עוד אין תווים.</span>}</div>
      <div className="row">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="שם לשיר" maxLength={40} />
        <label className="muted">קצב <input type="range" min="60" max="160" value={bpm} onChange={(e) => setBpm(Number(e.target.value))} /> {bpm}</label>
      </div>
      <div className="row">
        <button className="ghost" onClick={preview} disabled={!notes.length}>שמיעה</button>
        <button className="ghost" onClick={() => setNotes((n) => n.slice(0, -1))} disabled={!notes.length}>מחיקת תו אחרון</button>
        <button className="ghost" onClick={() => { stop(); setNotes([]); }} disabled={!notes.length}>ניקוי</button>
        <button onClick={save}>שמירה</button>
      </div>
      {msg && <p className="muted">{msg}</p>}
    </section>
  );
}

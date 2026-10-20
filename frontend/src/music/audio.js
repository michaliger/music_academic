// Web Audio synth: a soft piano-like voice for notes, plus an optional quiet ambient background loop.
// No audio files are used; everything is generated in the browser.
let ctx;
let master;
const freq = (m) => 440 * 2 ** ((m - 69) / 12);

/** Creates the audio context on first use (browsers require a user gesture before sound can start). */
function boot() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// Harmonic recipe of the piano voice: [partial number, relative loudness]
const PARTIALS = [[1, 1], [2, 0.42], [3, 0.2], [4, 0.1], [5, 0.05]];

/** One piano-like note: a few harmonics with a fast attack and an exponential decay (higher notes fade sooner). */
function tone(m, t, d) {
  const f = freq(m);
  const len = Math.max(0.35, d * (m > 84 ? 0.6 : 1));
  const out = ctx.createGain();
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = Math.min(9000, f * 7);
  out.gain.setValueAtTime(0.0001, t);
  out.gain.linearRampToValueAtTime(0.2, t + 0.008);
  out.gain.exponentialRampToValueAtTime(0.0008, t + len);
  out.connect(lp).connect(master);
  for (const [n, level] of PARTIALS) {
    if (f * n > 12000) break;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = f * n;
    g.gain.value = level / 1.8;
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + len + 0.05);
  }
}

/** מנגן סדרת שלבים; כל שלב הוא מערך צלילי MIDI שנשמעים יחד */
export function playSteps(steps, { gap = 0.6, dur = 1, onStep } = {}) {
  boot();
  steps.forEach((notes, i) => {
    notes.forEach((m) => tone(m, ctx.currentTime + i * gap, dur));
    if (onStep) setTimeout(() => onStep(notes), i * gap * 1000);
  });
  if (onStep) setTimeout(() => onStep([]), steps.length * gap * 1000 + dur * 500);
}
export const playNow = (notes) => playSteps([notes], { dur: 1.6 });

// ---------------------------------------------------------------------------------------------
// Ambient background: slow chords (Cmaj7 - Am7 - Fmaj7 - G6) with sparse soft notes on top.
// It only starts after a click, stays very quiet, and can be switched off or turned down.
// ---------------------------------------------------------------------------------------------
const CHORDS = [[48, 55, 59, 64], [45, 52, 55, 60], [41, 48, 52, 57], [43, 50, 55, 59]];
const SPARKLE = [72, 74, 76, 79, 81, 84]; // C-major pentatonic, high register
const CHORD_MS = 6500;

let bus; // volume of the whole ambient layer
let timer;
let step = 0;
let on = false;
let volume = 0.35;
try { volume = Number(localStorage.getItem('ambientVolume') ?? 0.35); } catch { /* storage unavailable */ }
const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn());

function padChord(notes, t) {
  const len = CHORD_MS / 1000 + 1.5;
  for (const m of notes) {
    const o = ctx.createOscillator();
    const lp = ctx.createBiquadFilter();
    const g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.value = freq(m);
    o.detune.value = Math.random() * 8 - 4;
    lp.type = 'lowpass';
    lp.frequency.value = 850;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.07, t + 1.6);
    g.gain.linearRampToValueAtTime(0.0001, t + len);
    o.connect(lp).connect(g).connect(bus);
    o.start(t);
    o.stop(t + len + 0.1);
  }
}

function sparkle(m, t) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  o.frequency.value = freq(m);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.05, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0006, t + 2.4);
  o.connect(g).connect(bus);
  o.start(t);
  o.stop(t + 2.5);
}

function scheduleChord() {
  const t = ctx.currentTime + 0.05;
  padChord(CHORDS[step % CHORDS.length], t);
  const count = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < count; i++) sparkle(SPARKLE[Math.floor(Math.random() * SPARKLE.length)], t + 1 + i * 1.7 + Math.random() * 0.6);
  step += 1;
}

export const ambient = {
  isOn: () => on,
  getVolume: () => volume,
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  start() {
    if (on) return;
    boot();
    if (!bus) {
      bus = ctx.createGain();
      // a soft echo makes the loop sound spacious
      const delay = ctx.createDelay(1);
      const feedback = ctx.createGain();
      delay.delayTime.value = 0.42;
      feedback.gain.value = 0.35;
      bus.connect(master);
      bus.connect(delay);
      delay.connect(feedback).connect(delay);
      delay.connect(master);
    }
    bus.gain.cancelScheduledValues(ctx.currentTime);
    bus.gain.setValueAtTime(0.0001, ctx.currentTime);
    bus.gain.linearRampToValueAtTime(volume, ctx.currentTime + 1.5);
    on = true;
    scheduleChord();
    timer = setInterval(scheduleChord, CHORD_MS);
    notify();
  },
  stop() {
    if (!on) return;
    clearInterval(timer);
    bus.gain.cancelScheduledValues(ctx.currentTime);
    bus.gain.setValueAtTime(bus.gain.value, ctx.currentTime);
    bus.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 1);
    on = false;
    notify();
  },
  setVolume(v) {
    volume = Math.min(1, Math.max(0, v));
    try { localStorage.setItem('ambientVolume', String(volume)); } catch { /* ignore */ }
    if (on) bus.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.2);
    notify();
  },
};

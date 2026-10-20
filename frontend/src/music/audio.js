let ctx;
const freq = (m) => 440 * 2 ** ((m - 69) / 12);

function tone(m, t, d) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'triangle'; o.frequency.value = freq(m);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.2, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, t + d);
  o.connect(g).connect(ctx.destination);
  o.start(t); o.stop(t + d + 0.05);
}

/** מנגן סדרת שלבים; כל שלב הוא מערך צלילי MIDI שנשמעים יחד */
export function playSteps(steps, { gap = 0.6, dur = 1, onStep } = {}) {
  ctx ||= new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  steps.forEach((notes, i) => {
    notes.forEach((m) => tone(m, ctx.currentTime + i * gap, dur));
    if (onStep) setTimeout(() => onStep(notes), i * gap * 1000);
  });
  if (onStep) setTimeout(() => onStep([]), steps.length * gap * 1000 + dur * 500);
}
export const playNow = (notes) => playSteps([notes], { dur: 1.3 });

// Composition room: get lyrics (AI or your own), write chords on every line, listen,
// check them against the key, and save. Chord chips turn green / amber / red after a check.
import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import { playSteps } from '../music/audio.js';
import { NOTE_ASCII, SCALES, diatonic, voicingOf } from '../music/theory.js';
import { MOODS } from '../utils/options.js';
import Piano from '../components/Piano.jsx';
import ChordPicker from '../components/composer/ChordPicker.jsx';
import AnalysisPanel from '../components/composer/AnalysisPanel.jsx';

const newLine = () => ({ text: '', chords: [] });
const EMPTY = { title: '', key: 'C', mode: 'major', tempo: 100, sections: [{ name: 'בית', lines: [newLine()] }] };

/** "Am" -> { key: 'A', mode: 'minor' }. Unknown roots fall back to C. */
function parseKeyName(name = '') {
  const m = /^([A-G][#b]?)(m?)$/.exec(name);
  return { key: m && NOTE_ASCII.includes(m[1]) ? m[1] : 'C', mode: m?.[2] ? 'minor' : 'major' };
}

/** AI studio song -> composition with lyrics only; the AI's chords stay as a hidden hint. */
const fromSong = (song) => ({
  ...EMPTY, ...parseKeyName(song.key), title: song.title, tempo: song.tempo || 100,
  sections: song.sections.filter((s) => s.lyrics.length).map((s) => ({ name: s.name, hint: s.chords.join(' '), lines: s.lyrics.map((text) => ({ text, chords: [] })) })),
});

const analyzePayload = (c) => ({ key: c.key, mode: c.mode, sections: c.sections.map((s) => ({ name: s.name || 'חלק', lines: s.lines.map((l) => ({ chords: l.chords })) })) });
const savePayload = (c) => ({ title: c.title || 'שיר ללא שם', key: c.key, mode: c.mode, tempo: c.tempo, sections: c.sections.map((s) => ({ name: s.name || 'חלק', lines: s.lines })) });

/** Plain-text chord sheet: chords above each lyric line. */
const chordSheet = (c) => `${c.title}\nסולם: ${c.key}${c.mode === 'minor' ? 'm' : ''}\n\n` +
  c.sections.map((s) => `[${s.name}]\n${s.lines.map((l) => (l.chords.length ? `${l.chords.join('   ')}\n` : '') + l.text).join('\n')}`).join('\n\n');

export default function Composer({ preset }) {
  const [comp, setComp] = useState(() => (preset ? fromSong(preset) : EMPTY));
  const [analysis, setAnalysis] = useState(null);
  const [openPicker, setOpenPicker] = useState(null); // "section-line" whose chord picker is open
  const [hl, setHl] = useState([]);
  const [saved, setSaved] = useState([]);
  const [lyricsForm, setLyricsForm] = useState({ theme: '', mood: 'happy' });
  const [showHints, setShowHints] = useState(false);
  const [ui, setUi] = useState({ busy: '', err: '', msg: '' });

  const iv = SCALES.find((s) => s.id === comp.mode).iv;
  const palette = useMemo(() => diatonic(NOTE_ASCII.indexOf(comp.key), iv), [comp.key, iv]);
  const infoAt = useMemo(() => Object.fromEntries((analysis?.chords || []).map((c) => [`${c.section}-${c.line}-${c.index}`, c])), [analysis]);
  const hasHints = comp.sections.some((s) => s.hint);

  const loadSaved = () => api('/compositions').then(setSaved).catch(() => {});
  useEffect(() => { loadSaved(); }, []);

  /** Runs an async action with busy / error / message handling. */
  async function run(name, action) {
    setUi({ busy: name, err: '', msg: '' });
    try { setUi({ busy: '', err: '', msg: (await action()) || '' }); }
    catch (e) { setUi({ busy: '', err: e.message, msg: '' }); }
  }
  /** Edits a clone of the composition. Chord edits make the previous check stale, so it is cleared. */
  const edit = (change, keepAnalysis = false) => {
    setComp((c) => change(structuredClone(c)));
    if (!keepAnalysis) setAnalysis(null);
  };

  const playChord = (symbol) => {
    const notes = voicingOf(symbol);
    if (!notes) return;
    setHl(notes);
    playSteps([notes.map((n) => n + 12)], { dur: 1.5 });
  };
  const playAll = () => {
    const steps = comp.sections.flatMap((s) => s.lines.flatMap((l) => l.chords)).map(voicingOf).filter(Boolean);
    if (!steps.length) return setUi({ busy: '', err: '', msg: 'הוסיפי אקורדים כדי לשמוע את השיר' });
    const gap = Math.max(0.6, 120 / comp.tempo); // two beats per chord
    playSteps(steps.map((s) => s.map((n) => n + 12)), { gap, dur: gap * 1.1, onStep: (n) => setHl(n.map((x) => x - 12)) });
  };

  const getLyrics = (e) => {
    e.preventDefault();
    const hasText = comp.sections.some((s) => s.lines.some((l) => l.text.trim()));
    if (hasText && !confirm('להחליף את המילים הקיימות?')) return;
    run('lyrics', async () => {
      const data = await api('/compositions/lyrics', { method: 'POST', body: lyricsForm });
      setComp((c) => ({ ...c, title: c.title || data.title, sections: data.sections.map((s) => ({ name: s.name, lines: s.lines.map((text) => ({ text, chords: [] })) })) }));
      setAnalysis(null);
      return data.engine === 'ai' ? 'המילים נכתבו ע״י AI. עכשיו תורך להלחין!' : 'מצב הדגמה: מילים לדוגמה. עם מפתח OpenAI תקבלי מילים מקוריות.';
    });
  };
  const analyze = () => run('analyze', async () => setAnalysis(await api('/compositions/analyze?ai=1', { method: 'POST', body: analyzePayload(comp) })));
  const save = () => run('save', async () => {
    const doc = await api(comp.id ? `/compositions/${comp.id}` : '/compositions', { method: comp.id ? 'PUT' : 'POST', body: savePayload(comp) });
    setComp((c) => ({ ...c, id: doc.id, title: doc.title }));
    loadSaved();
    return 'נשמר ✓';
  });
  const openSaved = (id) => run('open', async () => { setComp(await api(`/compositions/${id}`)); setAnalysis(null); });
  const removeSaved = (id) => api(`/compositions/${id}`, { method: 'DELETE' }).then(() => { if (comp.id === id) setComp(EMPTY); loadSaved(); });
  const copySheet = () => navigator.clipboard.writeText(chordSheet(comp)).then(() => setUi({ busy: '', err: '', msg: 'גיליון האקורדים הועתק 📋' }));

  return (
    <>
      <section className="card">
        <h2>חדר הלחנה 🎼</h2>
        <p className="muted">קבלי מילים מה-AI (או כתבי בעצמך), הניחי אקורדים על כל שורה, האזיני, ובדקי אם ההרמוניה מתאימה לסולם.</p>
        <div className="inline">
          <input placeholder="שם השיר" value={comp.title} maxLength={100} onChange={(e) => edit((c) => { c.title = e.target.value; return c; }, true)} />
          <select value={comp.key} onChange={(e) => edit((c) => { c.key = e.target.value; return c; })}>{NOTE_ASCII.map((k) => <option key={k} value={k}>סולם {k}</option>)}</select>
          <select value={comp.mode} onChange={(e) => edit((c) => { c.mode = e.target.value; return c; })}><option value="major">מז'ור</option><option value="minor">מינור</option></select>
          <input type="number" min="40" max="220" value={comp.tempo} style={{ maxWidth: 110 }} title="טמפו (BPM)" onChange={(e) => edit((c) => { c.tempo = Math.min(220, Math.max(40, Number(e.target.value) || 100)); return c; }, true)} />
        </div>
        <form onSubmit={getLyrics} className="lyrics-form">
          <b>מילים מה-AI</b>
          <div className="chips">{MOODS.map(([k, l]) => <button type="button" key={k} className={`chip ${lyricsForm.mood === k ? 'on' : ''}`} onClick={() => setLyricsForm({ ...lyricsForm, mood: k })}>{l}</button>)}</div>
          <div className="inline">
            <input placeholder="על מה השיר? (למשל: חברות אמיתית)" value={lyricsForm.theme} maxLength={120} onChange={(e) => setLyricsForm({ ...lyricsForm, theme: e.target.value })} />
            <button disabled={ui.busy === 'lyrics' || lyricsForm.theme.trim().length < 2}>{ui.busy === 'lyrics' ? 'כותב...' : 'הביאי מילים ✍️'}</button>
          </div>
        </form>
        {hasHints && <button className="link" onClick={() => setShowHints(!showHints)}>{showHints ? 'הסתרת' : 'הצצה להצעת'} האקורדים של ה-AI</button>}
        {ui.err && <div className="error">{ui.err}</div>}
        {ui.msg && <p className="okmsg">{ui.msg}</p>}
      </section>

      <section className="card">
        <Piano from={48} to={83} highlight={hl} />
        <div className="row">
          <button onClick={playAll}>▶ נגני את השיר</button>
          <button onClick={analyze} disabled={ui.busy === 'analyze'}>{ui.busy === 'analyze' ? 'בודקת...' : '✓ בדקי את האקורדים'}</button>
          <button className="ghost" onClick={save} disabled={ui.busy === 'save'}>💾 שמרי</button>
          <button className="ghost" onClick={copySheet}>📋 גיליון אקורדים</button>
        </div>
      </section>

      <section className="card">
        {comp.sections.map((sec, si) => (
          <div className="sec" key={si}>
            <div className="row">
              <input className="secname" value={sec.name} maxLength={30} onChange={(e) => edit((c) => { c.sections[si].name = e.target.value; return c; }, true)} />
              {showHints && sec.hint && <small className="muted" dir="ltr">💡 AI: {sec.hint}</small>}
              <button className="link" onClick={() => edit((c) => { c.sections.splice(si, 1); return c; })}>מחיקת חלק</button>
            </div>
            {sec.lines.map((line, li) => {
              const pickerId = `${si}-${li}`;
              return (
                <div className="cline" key={li}>
                  <div className="chords">
                    {line.chords.map((symbol, ci) => {
                      const info = infoAt[`${si}-${li}-${ci}`];
                      return (
                        <span key={ci} className={`cchip ${info?.status || ''}`} title={info?.note}>
                          <button type="button" onClick={() => playChord(symbol)}>{symbol}{info?.roman && <small>{info.roman}</small>}</button>
                          <button type="button" className="x" aria-label="הסרת אקורד" onClick={() => edit((c) => { c.sections[si].lines[li].chords.splice(ci, 1); return c; })}>×</button>
                        </span>
                      );
                    })}
                    <button type="button" className="chip add" onClick={() => setOpenPicker(openPicker === pickerId ? null : pickerId)}>+ אקורד</button>
                  </div>
                  <div className="row">
                    <input className="lyric-in" placeholder="שורת מילים" value={line.text} maxLength={200} onChange={(e) => edit((c) => { c.sections[si].lines[li].text = e.target.value; return c; }, true)} />
                    <button className="link" onClick={() => edit((c) => { c.sections[si].lines.splice(li, 1); return c; })}>הסרה</button>
                  </div>
                  {openPicker === pickerId && <ChordPicker palette={palette} onPick={(symbol) => edit((c) => { c.sections[si].lines[li].chords.push(symbol); return c; })} />}
                </div>
              );
            })}
            <button className="link" onClick={() => edit((c) => { c.sections[si].lines.push(newLine()); return c; }, true)}>+ שורה</button>
          </div>
        ))}
        <button className="ghost" onClick={() => edit((c) => { c.sections.push({ name: 'חלק חדש', lines: [newLine()] }); return c; }, true)}>+ חלק חדש</button>
      </section>

      {analysis && <AnalysisPanel result={analysis} />}

      {saved.length > 0 && (
        <section className="card"><h2>השירים שלי</h2>
          {saved.map((s) => (
            <div key={s.id} className="line"><span><b>{s.title}</b><br /><small className="muted">{s.key}{s.mode === 'minor' ? 'm' : ''}</small></span>
              <span><button className="ghost" onClick={() => openSaved(s.id)}>פתיחה</button> <button className="link" onClick={() => removeSaved(s.id)}>מחיקה</button></span></div>
          ))}
        </section>
      )}
    </>
  );
}

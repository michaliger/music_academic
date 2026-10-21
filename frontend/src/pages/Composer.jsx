// "Chords for a song": 1) song details, 2) lyrics (written, pasted or generated), 3) chords above the words.
// Every chord plays when it is placed and is checked against the key right away. Songs are saved and can be
// reopened as a chord sheet (lyrics with the chords above the words).
import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api/client.js';
import { NOTE_ASCII, SCALES, diatonic } from '../music/theory.js';
import { MOODS } from '../utils/options.js';
import Piano from '../components/Piano.jsx';
import SongSheet from '../components/composer/SongSheet.jsx';
import AnalysisPanel from '../components/composer/AnalysisPanel.jsx';
import { EMPTY, chordSheet, fromRaw, fromSong, hasLyrics, normalize, playChord, playSong, toRaw } from '../components/composer/songUtils.js';

const TIME_SIGNATURES = [[4, '4/4'], [3, '3/4'], [2, '2/4'], [6, '6/8']];
const analyzePayload = (c) => ({ key: c.key, mode: c.mode, beatsPerBar: c.beatsPerBar, sections: c.sections.map((s) => ({ name: s.name || 'חלק', lines: s.lines.map((l) => ({ chords: l.chords })) })) });
const savePayload = (c) => ({ title: c.title.trim() || 'שיר ללא שם', key: c.key, mode: c.mode, tempo: c.tempo, beatsPerBar: c.beatsPerBar, sections: c.sections.map((s) => ({ name: s.name || 'חלק', lines: s.lines })) });

export default function Composer({ preset }) {
  const [screen, setScreen] = useState(preset ? 'edit' : 'list'); // list | edit | view
  const [comp, setComp] = useState(() => (preset ? fromSong(preset) : EMPTY));
  const [saved, setSaved] = useState([]);
  const [analysis, setAnalysis] = useState(null); // live check of every chord
  const [report, setReport] = useState(null); // the full report (button "בדיקה מלאה")
  const [last, setLast] = useState(null); // the chord that was placed last: { si, li, ci }
  const [openPicker, setOpenPicker] = useState(null);
  const [hl, setHl] = useState([]);
  const [lyricsMode, setLyricsMode] = useState('own'); // own | ai
  const [raw, setRaw] = useState('');
  const [editingLyrics, setEditingLyrics] = useState(false);
  const [theme, setTheme] = useState({ text: '', mood: 'happy' });
  const [chordsPerBar, setChordsPerBar] = useState(1);
  const [ui, setUi] = useState({ busy: '', err: '', msg: '' });
  const [dirty, setDirty] = useState(false);
  const checkTimer = useRef();

  const iv = SCALES.find((s) => s.id === comp.mode).iv;
  const palette = useMemo(() => diatonic(NOTE_ASCII.indexOf(comp.key), iv), [comp.key, iv]);
  const infoAt = useMemo(() => Object.fromEntries((analysis?.chords || []).map((c) => [`${c.section}-${c.line}-${c.index}`, c])), [analysis]);
  const lyricsReady = hasLyrics(comp.sections);
  const defaultBeats = Math.max(1, Math.floor(comp.beatsPerBar / chordsPerBar));
  const totalChords = comp.sections.reduce((n, s) => n + s.lines.reduce((m, l) => m + l.chords.length, 0), 0);
  const lastInfo = last && infoAt[`${last.si}-${last.li}-${last.ci}`];

  const loadSaved = () => api('/compositions').then(setSaved).catch(() => {});
  useEffect(() => { loadSaved(); }, []);

  // live check: whenever chords or the key change, ask the server (debounced) which chords fit the key
  useEffect(() => {
    if (screen !== 'edit') return undefined;
    clearTimeout(checkTimer.current);
    if (!totalChords) { setAnalysis(null); return undefined; }
    checkTimer.current = setTimeout(() => api('/compositions/analyze', { method: 'POST', body: analyzePayload(comp) }).then(setAnalysis).catch(() => {}), 350);
    return () => clearTimeout(checkTimer.current);
  }, [comp.sections, comp.key, comp.mode, screen]); // eslint-disable-line react-hooks/exhaustive-deps

  async function run(name, action) {
    setUi({ busy: name, err: '', msg: '' });
    try { setUi({ busy: '', err: '', msg: (await action()) || '' }); }
    catch (e) { setUi({ busy: '', err: e.message, msg: '' }); }
  }
  /** Edits a clone of the composition and marks it as changed (not saved yet). */
  const edit = (change) => { setComp((c) => change(structuredClone(c))); setDirty(true); setReport(null); };

  const place = (si, li, at, symbol) => {
    let ci = 0;
    edit((c) => {
      const chords = c.sections[si].lines[li].chords;
      let pos = chords.length;
      while (pos > 0 && chords[pos - 1].at > at) pos--;
      chords.splice(pos, 0, { symbol, at, beats: defaultBeats });
      ci = pos;
      return c;
    });
    setLast({ si, li, ci });
    setOpenPicker(null);
    playChord(symbol, setHl); // you hear it at once
  };
  const cycleBeats = (si, li, ci) => edit((c) => { const t = c.sections[si].lines[li].chords[ci]; t.beats = t.beats % comp.beatsPerBar + 1; return c; });
  const removeChord = (si, li, ci) => { setLast(null); edit((c) => { c.sections[si].lines[li].chords.splice(ci, 1); return c; }); };

  const saveLyricsText = () => {
    const sections = fromRaw(raw, comp.sections);
    if (!sections.length) return setUi({ busy: '', err: 'כתבי או הדביקי לפחות שורה אחת של מילים', msg: '' });
    edit((c) => ({ ...c, sections }));
    setEditingLyrics(false); setRaw('');
    setUi({ busy: '', err: '', msg: 'המילים נשמרו. עכשיו לחצי על מילה כדי להניח מעליה אקורד.' });
  };
  const getLyrics = (e) => {
    e.preventDefault();
    run('lyrics', async () => {
      const data = await api('/compositions/lyrics', { method: 'POST', body: { theme: theme.text, mood: theme.mood } });
      setComp((c) => ({ ...c, title: c.title || data.title, sections: data.sections.map((s) => ({ name: s.name, lines: s.lines.map((text) => ({ text, chords: [] })) })) }));
      setDirty(true);
      return 'המילים מוכנות. עכשיו לחצי על מילה כדי להניח מעליה אקורד.';
    });
  };
  const fullCheck = () => run('check', async () => { const r = await api('/compositions/analyze?ai=1', { method: 'POST', body: analyzePayload(comp) }); setReport(r); setAnalysis(r); });
  const save = () => run('save', async () => {
    const doc = await api(comp.id ? `/compositions/${comp.id}` : '/compositions', { method: comp.id ? 'PUT' : 'POST', body: savePayload(comp) });
    setComp((c) => ({ ...c, id: doc.id, title: doc.title })); setDirty(false); loadSaved();
    return `השיר "${doc.title}" נשמר ✓`;
  });

  const startNew = () => { setComp(EMPTY); setAnalysis(null); setReport(null); setLast(null); setDirty(false); setEditingLyrics(false); setRaw(''); setUi({ busy: '', err: '', msg: '' }); setScreen('edit'); };
  const openSong = async (id, to) => {
    try { setComp(normalize(await api(`/compositions/${id}`))); setAnalysis(null); setReport(null); setLast(null); setDirty(false); setEditingLyrics(false); setUi({ busy: '', err: '', msg: '' }); setScreen(to); window.scrollTo(0, 0); }
    catch (e) { setUi({ busy: '', err: e.message, msg: '' }); }
  };
  const removeSong = (id) => confirm('למחוק את השיר?') && api(`/compositions/${id}`, { method: 'DELETE' }).then(loadSaved);
  const leave = () => { if (dirty && !confirm('יש שינויים שלא נשמרו. לצאת בלי לשמור?')) return; setScreen('list'); loadSaved(); window.scrollTo(0, 0); };
  const copySheet = () => navigator.clipboard.writeText(chordSheet(comp)).then(() => setUi({ busy: '', err: '', msg: 'גיליון האקורדים הועתק 📋' }));
  const play = () => { if (!playSong(comp, setHl)) setUi({ busy: '', err: '', msg: 'הוסיפי אקורדים כדי לשמוע את השיר' }); };

  // ---------------------------------------------------------------- list of songs
  if (screen === 'list') {
    return (
      <>
        <section className="card">
          <h2>אקורדים לשיר 🎼</h2>
          <p className="muted">כותבות שיר (או מקבלות מילים מוכנות), מניחות אקורדים מעל המילים, שומעות כל אקורד, ובודקות אם הוא מתאים לסולם. אפשר לשמור, לפתוח ולערוך בכל זמן.</p>
          <button onClick={startNew}>＋ שיר חדש</button>
        </section>
        {saved.length > 0 ? (
          <section className="card"><h2>השירים שלי</h2>
            {saved.map((s) => (
              <div key={s.id} className="line">
                <span><b>{s.title}</b><br /><small className="muted">סולם {s.key}{s.mode === 'minor' ? ' מינור' : ' מז׳ור'}</small></span>
                <span><button onClick={() => openSong(s.id, 'view')}>פתיחה</button> <button className="ghost" onClick={() => openSong(s.id, 'edit')}>עריכה</button> <button className="link" onClick={() => removeSong(s.id)}>מחיקה</button></span>
              </div>
            ))}
          </section>
        ) : <p className="card muted">עוד לא שמרת שירים. לחצי על ״שיר חדש״ כדי להתחיל.</p>}
      </>
    );
  }

  // ---------------------------------------------------------------- finished song (read only)
  if (screen === 'view') {
    return (
      <>
        <button className="link" onClick={leave}>← חזרה לשירים שלי</button>
        <section className="card">
          <div className="tags"><span>סולם {comp.key}{comp.mode === 'minor' ? ' מינור' : ' מז׳ור'}</span><span className="alt">{comp.tempo} BPM</span></div>
          <h2>{comp.title}</h2>
          <Piano from={48} to={83} highlight={hl} />
          <div className="row">
            <button onClick={play}>▶ נגני את השיר</button>
            <button className="ghost" onClick={() => setScreen('edit')}>✏️ עריכה</button>
            <button className="ghost" onClick={copySheet}>📋 העתקת גיליון אקורדים</button>
          </div>
          {ui.msg && <p className="okmsg">{ui.msg}</p>}
        </section>
        <section className="card sheet"><SongSheet sections={comp.sections} beatsPerBar={comp.beatsPerBar} onPlay={(s) => playChord(s, setHl)} /></section>
      </>
    );
  }

  // ---------------------------------------------------------------- edit
  return (
    <>
      <button className="link" onClick={leave}>← חזרה לשירים שלי</button>

      <section className="card cstep">
        <h2><span className="stepno">1</span> פרטי השיר</h2>
        <div className="inline">
          <input placeholder="שם השיר" value={comp.title} maxLength={100} onChange={(e) => edit((c) => { c.title = e.target.value; return c; })} />
        </div>
        <div className="inline rhythm">
          <label>סולם <select value={comp.key} onChange={(e) => edit((c) => { c.key = e.target.value; return c; })}>{NOTE_ASCII.map((k) => <option key={k} value={k}>{k}</option>)}</select></label>
          <label>סוג <select value={comp.mode} onChange={(e) => edit((c) => { c.mode = e.target.value; return c; })}><option value="major">מז׳ור (שמח)</option><option value="minor">מינור (עצוב)</option></select></label>
          <label>מהירות <input type="number" min="40" max="220" value={comp.tempo} style={{ width: 90 }} onChange={(e) => edit((c) => { c.tempo = Math.min(220, Math.max(40, Number(e.target.value) || 100)); return c; })} /></label>
          <label>משקל <select value={comp.beatsPerBar} onChange={(e) => edit((c) => { c.beatsPerBar = Number(e.target.value); return c; })}>{TIME_SIGNATURES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
          <label>אקורדים בתיבה <select value={chordsPerBar} onChange={(e) => setChordsPerBar(Number(e.target.value))}>{[1, 2, 4].filter((n) => n <= comp.beatsPerBar).map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
        </div>
        <small className="muted">אקורד חדש יימשך {defaultBeats} פעימות. אפשר לשנות לכל אקורד אחר כך.</small>
      </section>

      <section className="card cstep">
        <h2><span className="stepno">2</span> מילים {lyricsReady && <small className="okmsg">נשמרו ✓</small>}</h2>
        {lyricsReady && !editingLyrics ? (
          <div className="row">
            <span className="muted">{comp.sections.reduce((n, s) => n + s.lines.length, 0)} שורות ב-{comp.sections.length} חלקים</span>
            <button className="ghost" onClick={() => { setRaw(toRaw(comp.sections)); setEditingLyrics(true); }}>✏️ עריכת המילים</button>
          </div>
        ) : editingLyrics ? (
          <>
            <textarea rows="10" value={raw} onChange={(e) => setRaw(e.target.value)} />
            <small className="muted">שורה בכל שורה. כותרת של חלק נכתבת בסוגריים מרובעים, למשל [פזמון]. האקורדים נשארים על השורות שלא זזו.</small>
            <div className="row"><button onClick={saveLyricsText}>שמרי מילים</button><button className="ghost" onClick={() => { setEditingLyrics(false); setRaw(''); }}>ביטול</button></div>
          </>
        ) : (
          <>
            <div className="chips">
              <button className={`chip ${lyricsMode === 'own' ? 'on' : ''}`} onClick={() => setLyricsMode('own')}>יש לי מילים</button>
              <button className={`chip ${lyricsMode === 'ai' ? 'on' : ''}`} onClick={() => setLyricsMode('ai')}>הכינו לי מילים לפי נושא</button>
            </div>
            {lyricsMode === 'own' ? (
              <>
                <textarea rows="8" value={raw} onChange={(e) => setRaw(e.target.value)} placeholder={'כתבי או הדביקי כאן את המילים של השיר שלך (או מילים שיש לך רשות להשתמש בהן).\nשורה בכל שורה. שורה ריקה או כותרת כמו [פזמון] פותחת חלק חדש.'} />
                <button onClick={saveLyricsText} disabled={!raw.trim()}>שמרי מילים</button>
              </>
            ) : (
              <form onSubmit={getLyrics}>
                <div className="chips">{MOODS.map(([k, l]) => <button type="button" key={k} className={`chip ${theme.mood === k ? 'on' : ''}`} onClick={() => setTheme({ ...theme, mood: k })}>{l}</button>)}</div>
                <div className="inline">
                  <input placeholder="על מה השיר? (למשל: חברות אמיתית)" value={theme.text} maxLength={120} onChange={(e) => setTheme({ ...theme, text: e.target.value })} />
                  <button disabled={ui.busy === 'lyrics' || theme.text.trim().length < 2}>{ui.busy === 'lyrics' ? 'כותבת...' : 'הכיני מילים'}</button>
                </div>
                <small className="muted">המילים מקוריות. למילים של שיר קיים, הדביקי אותן בעצמך תחת ״יש לי מילים״.</small>
              </form>
            )}
          </>
        )}
      </section>

      {lyricsReady && !editingLyrics && (
        <section className="card cstep">
          <h2><span className="stepno">3</span> אקורדים</h2>
          <p className="muted">לחצי על מילה כדי להניח מעליה אקורד. האקורד מתנגן מיד, ומיד רואים אם הוא מתאים לסולם: <b className="tgreen">ירוק</b> מתאים, <b className="tgold">צהוב</b> צבע מעניין מחוץ לסולם, <b className="tred">אדום</b> לא מתאים.</p>
          <Piano from={48} to={83} highlight={hl} />
          {lastInfo && <div className={`livecheck ${lastInfo.status}`}>{lastInfo.status === 'in' ? '✓' : lastInfo.status === 'color' ? '◆' : '✗'} <b>{lastInfo.symbol}</b>{lastInfo.roman && ` (${lastInfo.roman})`}: {lastInfo.note}</div>}
          <SongSheet sections={comp.sections} editable beatsPerBar={comp.beatsPerBar} palette={palette} infoAt={infoAt} openPicker={openPicker} setOpenPicker={setOpenPicker}
            onPick={place} onPlay={(s) => playChord(s, setHl)} onBeats={cycleBeats} onRemove={removeChord} />
          {report && <AnalysisPanel result={report} />}
        </section>
      )}

      {ui.err && <div className="error">{ui.err}</div>}
      {ui.msg && <p className="okmsg">{ui.msg}</p>}

      <div className="savebar">
        <button onClick={play} disabled={!totalChords}>▶ נגני</button>
        <button className="ghost" onClick={fullCheck} disabled={!totalChords || ui.busy === 'check'}>{ui.busy === 'check' ? 'בודקת...' : '✓ בדיקה מלאה'}</button>
        <button className="ghost" onClick={copySheet} disabled={!lyricsReady}>📋 העתקה</button>
        <span className="grow" />
        {dirty && <small className="muted">יש שינויים שלא נשמרו</small>}
        <button className="savebtn" onClick={save} disabled={ui.busy === 'save' || !lyricsReady}>💾 {comp.id ? 'שמירה' : 'שמירת השיר'}</button>
        {comp.id && !dirty && <button className="ghost" onClick={() => setScreen('view')}>לצפייה בשיר</button>}
      </div>
    </>
  );
}

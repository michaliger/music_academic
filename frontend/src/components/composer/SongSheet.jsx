// The song as lyrics with chords above the words. Editable: click a word to put a chord above it.
// Read-only: the finished chord sheet.
import { wordsOf } from './songUtils.js';
import ChordPicker from './ChordPicker.jsx';

export default function SongSheet({ sections, editable = false, beatsPerBar = 4, palette, infoAt = {}, openPicker, setOpenPicker, onPick, onPlay, onBeats, onRemove }) {
  return sections.map((sec, si) => (
    <div className="sec" key={si}>
      <h3 className="secname-view">{sec.name}</h3>
      {sec.lines.map((line, li) => {
        const words = wordsOf(line.text);
        const columns = words.length ? words : ['…'];
        const beats = line.chords.reduce((n, c) => n + c.beats, 0);
        const bars = beats / beatsPerBar;
        return (
          <div className="cline" key={li}>
            <div className="wordrow">
              {columns.map((word, wi) => {
                const here = line.chords.map((c, ci) => ({ c, ci })).filter(({ c }) => Math.min(c.at, columns.length - 1) === wi);
                const id = `${si}-${li}-${wi}`;
                return (
                  <div className={`wcol ${openPicker === id ? 'open' : ''}`} key={wi}>
                    <div className="wchords">
                      {here.map(({ c, ci }) => {
                        const info = infoAt[`${si}-${li}-${ci}`];
                        return (
                          <span key={ci} className={`cchip ${info?.status || ''}`} title={info?.note}>
                            <button type="button" onClick={() => onPlay(c.symbol)}>{c.symbol}{info?.roman && editable && <small>{info.roman}</small>}</button>
                            {editable && <>
                              <button type="button" className="beats" title="כמה פעימות האקורד נמשך (לחצי כדי לשנות)" onClick={() => onBeats(si, li, ci)}>{c.beats}♩</button>
                              <button type="button" className="x" aria-label="הסרת אקורד" onClick={() => onRemove(si, li, ci)}>×</button>
                            </>}
                          </span>
                        );
                      })}
                    </div>
                    {editable
                      ? <button type="button" className="wbtn" title="לחצי כדי להניח אקורד מעל המילה" onClick={() => setOpenPicker(openPicker === id ? null : id)}>{word}</button>
                      : <span className="wtext">{word}</span>}
                  </div>
                );
              })}
            </div>
            {editable && line.chords.length > 0 && <small className={`barinfo ${Number.isInteger(bars) ? '' : 'warn'}`}>{Number.isInteger(bars) ? `${bars} תיבות` : `חסרות ${beatsPerBar - (beats % beatsPerBar)} פעימות להשלמת תיבה`}</small>}
            {editable && openPicker?.startsWith(`${si}-${li}-`) && <ChordPicker palette={palette} onPick={(symbol) => onPick(si, li, Number(openPicker.split('-')[2]), symbol)} />}
          </div>
        );
      })}
    </div>
  ));
}

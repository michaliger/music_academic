import { useState } from 'react';

/** Chords of the current key (one click) or any supported symbol typed by hand. */
export default function ChordPicker({ palette, onPick }) {
  const [text, setText] = useState('');
  const submit = (e) => {
    e.preventDefault();
    if (text.trim()) { onPick(text.trim()); setText(''); }
  };
  return (
    <div className="picker">
      <small className="muted">אקורדים מהסולם:</small>
      <div className="chips">
        {palette.map((d) => <button type="button" key={d.roman} className="chip g" onClick={() => onPick(d.symbol)}>{d.roman}<small>{d.symbol}</small></button>)}
      </div>
      <form className="inline" onSubmit={submit}>
        <input dir="ltr" placeholder="או כתבי אקורד: G7, Fmaj7, Dsus4" value={text} maxLength={12} onChange={(e) => setText(e.target.value)} />
        <button className="ghost">הוספה</button>
      </form>
    </div>
  );
}

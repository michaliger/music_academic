// Button + volume slider for the quiet background music (starts only after a click, as browsers require).
import { useEffect, useState } from 'react';
import { ambient } from '../music/audio.js';

export default function MusicToggle({ compact = false }) {
  const [, tick] = useState(0);
  useEffect(() => ambient.subscribe(() => tick((n) => n + 1)), []);
  const on = ambient.isOn();
  return (
    <div className={`musictoggle ${compact ? 'compact' : ''} ${on ? 'on' : ''}`}>
      <button type="button" onClick={() => (on ? ambient.stop() : ambient.start())} aria-pressed={on} title="מוזיקת רקע שקטה">
        <span className="mt-note">{on ? '♫' : '♪'}</span>{!compact && <span>{on ? 'מוזיקת רקע פועלת' : 'הפעילי מוזיקת רקע'}</span>}
      </button>
      {on && (
        <input type="range" min="0" max="1" step="0.05" value={ambient.getVolume()} aria-label="עוצמת מוזיקת הרקע"
          onChange={(e) => ambient.setVolume(Number(e.target.value))} />
      )}
    </div>
  );
}

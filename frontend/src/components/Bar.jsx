/** Horizontal progress bar (0-100). */
export default function Bar({ pct }) {
  return <div className="bar"><i style={{ width: `${pct}%` }} /></div>;
}

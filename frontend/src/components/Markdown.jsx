// Small, safe renderer for the teacher's answers: headings, bold, lists, rules and paragraphs (no HTML is ever injected).
function inline(text, key) {
  const clean = text.replace(/<\/?(details|summary|b|i|br)[^>]*>/gi, '').replace(/`([^`]+)`/g, '$1');
  return clean.split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g).filter(Boolean).map((part, i) => {
    if (part.startsWith('**')) return <strong key={`${key}-${i}`}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) return <em key={`${key}-${i}`}>{part.slice(1, -1)}</em>;
    return part;
  });
}

export default function Markdown({ text }) {
  const blocks = [];
  let list = null;
  const flush = () => { if (list) { blocks.push(list); list = null; } };
  String(text || '').split('\n').forEach((raw, n) => {
    const line = raw.replace(/\s+$/, '');
    const indent = raw.length - raw.trimStart().length;
    const m = line.trim();
    if (!m) { flush(); return; }
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(m)) { flush(); blocks.push({ t: 'hr', n }); return; }
    const h = m.match(/^(#{1,4})\s+(.*)$/);
    if (h) { flush(); blocks.push({ t: 'h', level: h[1].length, text: h[2], n }); return; }
    const li = m.match(/^([*\-•]|\d+[.)])\s+(.*)$/);
    if (li) {
      const ordered = /\d/.test(li[1]);
      if (!list || list.ordered !== ordered) { flush(); list = { t: 'list', ordered, items: [], n }; }
      list.items.push({ text: li[2], nested: indent >= 2 });
      return;
    }
    if (list && indent >= 2) { list.items.push({ text: m, nested: true, plain: true }); return; }
    flush(); blocks.push({ t: 'p', text: m, n });
  });
  flush();
  return (
    <div className="md">
      {blocks.map((b) => {
        if (b.t === 'hr') return <hr key={b.n} />;
        if (b.t === 'h') return <h4 key={b.n} className={`mdh${b.level}`}>{inline(b.text, b.n)}</h4>;
        if (b.t === 'p') return <p key={b.n}>{inline(b.text, b.n)}</p>;
        const Tag = b.ordered ? 'ol' : 'ul';
        return <Tag key={b.n}>{b.items.map((it, i) => <li key={i} className={it.nested ? 'nested' : ''}>{inline(it.text, `${b.n}-${i}`)}</li>)}</Tag>;
      })}
    </div>
  );
}

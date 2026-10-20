// One AI tutor question and its answer.
import { fmt } from '../utils/format.js';

export default function PromptCard({ p }) {
  return (
    <article className="card lesson">
      <div className="tags"><span>{p.category?.name}</span><span className="alt">{p.subCategory?.name}</span><time>{fmt(p.createdAt)}</time></div>
      <h3>“{p.prompt}”</h3><div className="answer">{p.response}</div>
    </article>
  );
}

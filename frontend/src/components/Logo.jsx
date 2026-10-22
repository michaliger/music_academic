// Brand mark: a gradient tile with a pair of beamed eighth notes (same drawing as public/favicon.svg).
export default function Logo({ size = 40 }) {
  return (
    <svg className="logo-mark" width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="טוניקה">
      <defs><linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7c63cf" /><stop offset="1" stopColor="#ff9d86" /></linearGradient></defs>
      <rect width="64" height="64" rx="18" fill="url(#logoGrad)" />
      <path d="M26 17V43M44 13V39" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M26 17L44 13V21L26 25Z" fill="#fff" />
      <ellipse cx="21" cy="44" rx="7" ry="5.2" transform="rotate(-20 21 44)" fill="#fff" />
      <ellipse cx="39" cy="40" rx="7" ry="5.2" transform="rotate(-20 39 40)" fill="#fff" />
      <circle cx="51" cy="50" r="3" fill="#f5c46a" />
    </svg>
  );
}

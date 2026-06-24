// PropLogAI logo — the "Open Journal" mark in a gradient tile, with an optional wordmark.
// Pure presentational component (safe in both server and client components).

export function LogoMark({ size = 32, rounded = 'rounded-xl', glow = false, glyph = '#08080f', className = '', style = null }) {
  return (
    <span
      className={'grid flex-shrink-0 place-items-center ' + rounded + ' ' + className}
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(135deg,#a78bfa,#22d3ee)',
        ...(glow ? { boxShadow: '0 0 18px rgba(139,92,246,0.5)' } : null),
        ...(style || null),
      }}
    >
      <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
        <polygon points="22,42 50,49 50,75 22,69" fill={glyph} />
        <polygon points="78,42 50,49 50,75 78,69" fill={glyph} />
        <polyline points="50,49 63,39 74,27" fill="none" stroke={glyph} strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="74" cy="27" r="4.5" fill={glyph} />
      </svg>
    </span>
  );
}

export default function Logo({
  size = 32,
  rounded = 'rounded-xl',
  glow = false,
  showWordmark = true,
  wordmarkClassName = 'font-display text-base font-bold tracking-tight',
  className = '',
}) {
  return (
    <span className={'flex items-center gap-2.5 ' + className}>
      <LogoMark size={size} rounded={rounded} glow={glow} />
      {showWordmark && (
        <span className={wordmarkClassName}>PropLog<span style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>AI</span></span>
      )}
    </span>
  );
}

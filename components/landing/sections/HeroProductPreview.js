export default function HeroProductPreview() {
  return (
    <div className="relative mx-auto w-full" aria-label="PropLogAI discipline review">
      <div className="absolute -inset-10 -z-10 bg-[radial-gradient(ellipse_at_50%_40%,rgba(139,124,246,0.14),transparent_62%)]" />

      <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0a0a13] shadow-[0_32px_100px_rgba(0,0,0,0.55)]">
        {/* Window chrome */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="h-2 w-2 rounded-full bg-white/10" />
            <span className="h-2 w-2 rounded-full bg-white/10" />
            <span className="h-2 w-2 rounded-full bg-white/10" />
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/30">
            proplogai.com/discipline
          </span>
          <span className="rounded-full border border-cyan-300/20 bg-cyan-300/[0.07] px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-cyan-300">
            Day 14
          </span>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-[1.15fr_0.85fr] sm:p-6">
          {/* Left: the pattern Propol found */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.028] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">
                  Propol found your pattern
                </div>
                <p className="mt-2.5 text-sm leading-relaxed text-white/80">
                  After two consecutive losses, you re-enter within{' '}
                  <span className="font-semibold text-rose-300">9 minutes</span> —
                  mostly at London close. It happened 6 times in 3 weeks.
                </p>
              </div>
              <span className="shrink-0 rounded-lg bg-rose-400/10 px-2.5 py-1 font-mono text-xs font-bold text-rose-300">
                6×
              </span>
            </div>
            <div className="mt-4 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.06] p-3.5 text-xs leading-relaxed text-emerald-50/80">
              <span className="font-semibold text-emerald-300">This week's focus:</span>{' '}
              no re-entry for 20 minutes after back-to-back losses. Log the urge,
              don't trade it.
            </div>
          </div>

          {/* Right: discipline score trend */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.028] p-5">
            <div className="flex items-baseline justify-between">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">
                Discipline score
              </div>
              <div className="font-mono text-[10px] text-emerald-300">↑ 18 pts</div>
            </div>
            <div className="mt-2 flex items-end gap-3">
              <span className="font-display text-4xl font-extrabold leading-none text-white">82</span>
              <span className="pb-0.5 text-xs text-white/40">/ 100 · from rule adherence</span>
            </div>
            <svg viewBox="0 0 200 56" className="mt-4 h-14 w-full" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(34,211,238,0.22)" />
                  <stop offset="100%" stopColor="rgba(34,211,238,0)" />
                </linearGradient>
              </defs>
              <path d="M0,44 L22,42 L44,45 L66,38 L88,40 L110,30 L132,26 L154,20 L176,16 L200,10" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" />
              <path d="M0,44 L22,42 L44,45 L66,38 L88,40 L110,30 L132,26 L154,20 L176,16 L200,10 L200,56 L0,56Z" fill="url(#scoreFill)" />
            </svg>
            <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3 text-[11px]">
              <span className="text-white/40">Rule breaks this week</span>
              <span className="font-mono font-semibold text-white/75">2 · down from 6</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

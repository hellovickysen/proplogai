export default function HeroProductPreview() {
  const calendarDays = ['g', 'r', 'g', '', 'g', 'g', '', 'g', 'g', 'r', 'g', '', 'g', ''];

  return (
    <div className="relative mx-auto w-full max-w-2xl lg:max-w-none" aria-label="PropLogAI product preview">
      <div className="absolute -inset-8 -z-10 bg-[radial-gradient(circle_at_50%_45%,rgba(34,211,238,0.13),transparent_58%)]" />
      <div className="overflow-hidden rounded-[1.75rem] border border-white/[0.12] bg-[#0b0b14] shadow-[0_28px_90px_rgba(0,0,0,0.52),0_0_60px_rgba(167,139,250,0.08)]">
        <div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.025] px-4 py-3 sm:px-5">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="h-2 w-2 rounded-full bg-red-400/70" />
            <span className="h-2 w-2 rounded-full bg-amber-400/70" />
            <span className="h-2 w-2 rounded-full bg-emerald-400/70" />
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">PropLogAI Coach</span>
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-2 py-0.5 font-mono text-[10px] text-emerald-300">Live journal</span>
        </div>

        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">Weekly review</p>
              <h2 className="mt-1 font-display text-lg font-bold text-white sm:text-xl">Your discipline is improving</h2>
            </div>
            <div className="shrink-0 rounded-xl border border-violet-300/15 bg-violet-300/[0.08] px-3 py-2 text-center">
              <div className="font-display text-xl font-bold text-violet-200">82</div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-white/40">Score</div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { label: 'Win rate', value: '57%', color: 'text-emerald-300' },
              { label: 'Weekly P&L', value: '+$420', color: 'text-emerald-300' },
              { label: 'Rules kept', value: '86%', color: 'text-cyan-300' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-white/[0.08] bg-black/25 p-2.5 sm:p-3">
                <div className="font-mono text-[10px] uppercase tracking-wider text-white/35">{stat.label}</div>
                <div className={`mt-1 font-display text-sm font-bold sm:text-base ${stat.color}`}>{stat.value}</div>
              </div>
            ))}
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-300/70">Pattern detected</span>
                <span className="rounded-md bg-red-400/10 px-2 py-1 font-mono text-[10px] font-semibold text-red-300">-3.8R</span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-white/72 sm:text-sm">
                Your last three revenge trades followed back-to-back losses during London close.
              </p>
              <div className="mt-3 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.07] p-3">
                <div className="font-mono text-[10px] uppercase tracking-wider text-emerald-300/70">Propol&apos;s fix</div>
                <p className="mt-1 text-xs leading-relaxed text-emerald-50/75">Pause for 20 minutes after two losses. Your journal shows a 71% win rate after cooling down.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-1">
              <div className="rounded-xl border border-white/[0.08] bg-black/25 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-white/35">P&amp;L calendar</span>
                  <span className="font-mono text-[10px] text-emerald-300">+$420</span>
                </div>
                <div className="mt-3 grid grid-cols-7 gap-1">
                  {calendarDays.map((day, index) => (
                    <span key={index} className={`h-4 rounded ${day === 'g' ? 'bg-emerald-400/35' : day === 'r' ? 'bg-red-400/35' : 'bg-white/[0.05]'}`} />
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-black/25 p-3">
                <span className="font-mono text-[10px] uppercase tracking-wider text-white/35">Top triggers</span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {['Revenge', 'FOMO', 'Moved SL'].map((tag) => (
                    <span key={tag} className="rounded-full border border-red-300/15 bg-red-300/[0.08] px-2 py-1 text-[10px] text-red-200/80">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

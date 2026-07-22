export default function HeroProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-2xl lg:max-w-none" aria-label="Real PropLogAI discipline dashboard">
      <div className="absolute -inset-8 -z-10 bg-[radial-gradient(circle_at_50%_45%,rgba(34,211,238,0.13),transparent_58%)]" />
      <div className="overflow-hidden rounded-[1.75rem] border border-white/[0.12] bg-[#0b0b14] shadow-[0_28px_90px_rgba(0,0,0,0.52),0_0_60px_rgba(167,139,250,0.08)]">
        <div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.025] px-4 py-3 sm:px-5">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="h-2 w-2 rounded-full bg-red-400/70" />
            <span className="h-2 w-2 rounded-full bg-amber-400/70" />
            <span className="h-2 w-2 rounded-full bg-emerald-400/70" />
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">Real PropLogAI dashboard</span>
          <span className="rounded-full border border-cyan-400/20 bg-cyan-400/[0.08] px-2 py-0.5 font-mono text-[10px] text-cyan-300">Discipline system</span>
        </div>

        <div className="relative">
          <picture>
            <source media="(max-width: 639px)" srcSet="/landing/dashboard-discipline-mobile.svg" />
            <img
              src="/landing/dashboard-discipline-desktop.svg"
              alt="PropLogAI dashboard showing daily AI coaching, a weekly rulebook discipline score of 90, setup discipline, journal streaks, and a five-day no-revenge streak"
              className="block h-auto w-full"
              loading="eager"
            />
          </picture>

          <div className="pointer-events-none absolute left-[3%] top-[50%] aspect-square w-[20%] rounded-full border-2 border-cyan-300/[0.85] shadow-[0_0_28px_rgba(34,211,238,0.45)] sm:left-[2%] sm:top-[43%] sm:w-[11%]" aria-hidden="true" />

          <div className="pointer-events-none absolute left-3 top-3 hidden max-w-[16rem] sm:block rounded-xl border border-cyan-300/25 bg-[#0b0b14]/95 px-3 py-2 shadow-[0_12px_35px_rgba(0,0,0,0.5)] backdrop-blur sm:left-5 sm:top-5">
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-300">Learns from your rulebook and behavior</div>
            <div className="mt-1 text-xs font-medium text-white/70">Not market predictions.</div>
            <span className="absolute -bottom-3 left-6 h-5 w-px bg-cyan-300/60" aria-hidden="true" />
            <span className="absolute -bottom-3 left-[1.33rem] h-2 w-2 rotate-45 border-b border-r border-cyan-300/70" aria-hidden="true" />
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-white/[0.08] bg-white/[0.025] px-4 py-3 sm:px-5">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-300/75">Trader discipline score</div>
            <div className="mt-0.5 text-xs text-white/[0.45]">One number for rule-following, control, and consistency.</div>
          </div>
          <div className="font-display text-3xl font-extrabold text-emerald-300 sm:text-4xl">90</div>
        </div>
      </div>
    </div>
  );
}

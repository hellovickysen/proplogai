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

        <picture>
          <source media="(max-width: 639px)" srcSet="/landing/dashboard-discipline-mobile.svg" />
          <img
            src="/landing/dashboard-discipline-desktop.svg"
            alt="PropLogAI dashboard showing daily AI coaching, a weekly rulebook discipline score of 90, setup discipline, journal streaks, and a five-day no-revenge streak"
            className="block h-auto w-full"
            loading="eager"
          />
        </picture>

        <div className="grid gap-3 border-t border-white/[0.08] bg-white/[0.025] px-4 py-4 sm:grid-cols-[1fr_auto] sm:items-center sm:px-5">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-300/75">AI coaching from your rulebook and behavior</div>
            <div className="mt-1 text-xs leading-relaxed text-white/[0.45]">Finds recurring mistakes from your own records — not market predictions.</div>
          </div>
          <div className="flex items-end justify-between gap-4 sm:block sm:text-right">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">Discipline score</div>
            <div className="font-display text-3xl font-extrabold leading-none text-emerald-300 sm:mt-1 sm:text-4xl">90</div>
          </div>
        </div>
      </div>
    </div>
  );
}

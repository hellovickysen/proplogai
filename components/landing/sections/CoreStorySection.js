/* The core story — one connected path through four stages. */
const STAGES = [
  {
    num: '01',
    title: 'Trade',
    line: 'Log what actually happened.',
    detail: 'Entry, exit, setup, risk, screenshot, emotion, notes — captured in seconds, not minutes.',
    accent: 'text-cyan-300',
    border: 'border-cyan-400/20',
  },
  {
    num: '02',
    title: 'Understand',
    line: 'Your history becomes meaningful patterns.',
    detail: 'Win rate, R:R, drawdown, setup performance, time-of-day, emotion performance, mistake patterns.',
    accent: 'text-violet-300',
    border: 'border-violet-400/20',
  },
  {
    num: '03',
    title: 'Correct',
    line: 'Find what is actually holding you back.',
    detail: 'AI surfaces the patterns you can\'t see — like performance dropping after two consecutive losses.',
    accent: 'text-amber-300',
    border: 'border-amber-400/20',
  },
  {
    num: '04',
    title: 'Master',
    line: 'Build a process you can repeat.',
    detail: 'Rulebook, discipline score, goals, and consistency — measured, not guessed.',
    accent: 'text-emerald-300',
    border: 'border-emerald-400/20',
  },
];

export default function CoreStorySection() {
  return (
    <section id="how-it-works" className="relative px-4 py-20 sm:px-10 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="text-center" data-reveal>
          <p className="section-eyebrow mb-4">The PropLogAI loop</p>
          <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            Every trade should make you better.
          </h2>
        </div>

        <div className="relative mt-16">
          {/* connecting path (desktop) */}
          <svg className="absolute left-0 right-0 top-9 hidden h-2 w-full md:block" viewBox="0 0 1200 8" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 4 H1200" stroke="rgba(255,255,255,0.07)" strokeWidth="2" />
            <path d="M0 4 H1200" stroke="url(#coreGrad)" strokeWidth="2" className="progress-path" data-draw />
            <defs>
              <linearGradient id="coreGrad" x1="0" x2="1">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="50%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
            </defs>
          </svg>

          <div className="grid gap-8 md:grid-cols-4">
            {STAGES.map((stage, i) => (
              <div key={stage.num} className="relative" data-reveal style={{ '--reveal-delay': `${i * 90}ms` }}>
                <div className={`relative z-10 mb-5 grid h-[4.5rem] w-[4.5rem] place-items-center rounded-2xl border ${stage.border} bg-[#0a0a14] font-display text-lg font-bold ${stage.accent}`}>
                  {stage.num}
                </div>
                <h3 className={`font-display text-xl font-bold ${stage.accent}`}>{stage.title}</h3>
                <p className="mt-1.5 text-[15px] font-semibold text-white/85">{stage.line}</p>
                <p className="mt-2 text-sm leading-relaxed text-white/50">{stage.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

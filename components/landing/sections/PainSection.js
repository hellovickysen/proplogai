const LOOP_STEPS = [
  {
    step: '01',
    label: 'Trigger',
    title: 'Pressure takes over',
    description: 'A loss, a missed move, or the need to recover changes how you make the next decision.',
    tone: 'text-amber-300',
    dot: 'bg-amber-300',
  },
  {
    step: '02',
    label: 'Rule break',
    title: 'Your plan disappears',
    description: 'You force a setup, move the stop, increase risk, or trade outside the rules you wrote.',
    tone: 'text-red-300',
    dot: 'bg-red-300',
  },
  {
    step: '03',
    label: 'Account damage',
    title: 'Discipline gets expensive',
    description: 'One emotional decision becomes a larger loss, a failed challenge, or profits given back.',
    tone: 'text-red-300',
    dot: 'bg-red-300',
  },
  {
    step: '04',
    label: 'Repeat',
    title: 'The mistake changes shape',
    description: 'The setup looks different next time, but the same behavior keeps returning unnoticed.',
    tone: 'text-violet-300',
    dot: 'bg-violet-300',
  },
];

export default function PainSection() {
  return (
    <section id="the-pattern" className="px-4 py-20 sm:px-10 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center" data-reveal>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-300/20 bg-red-300/[0.07] px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-red-200">
            The discipline leak
          </div>
          <h2 className="font-display text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl">
            One invisible loop keeps{' '}
            <span className="text-red-400">repeating.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/55 sm:text-base">
            The market changes. The behavior underneath usually does not. Until you can see the loop, you cannot interrupt it.
          </p>
        </div>

        <div className="relative mx-auto mt-12 max-w-6xl overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]" data-reveal>
          <div className="absolute left-[12.5%] right-[12.5%] top-10 hidden h-px bg-gradient-to-r from-amber-300/35 via-red-300/35 to-violet-300/35 lg:block" aria-hidden="true" />
          <div className="grid lg:grid-cols-4">
            {LOOP_STEPS.map((item, index) => (
              <article key={item.step} className="relative border-b border-white/[0.08] p-6 last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0" data-reveal style={{ '--reveal-delay': `${index * 90}ms` }}>
                <div className="relative z-10 flex items-center justify-between gap-4">
                  <span className={`font-mono text-[10px] font-semibold uppercase tracking-[0.15em] ${item.tone}`}>{item.label}</span>
                  <span className="font-mono text-xs text-white/35">{item.step}</span>
                </div>
                <div className={`relative z-10 mt-4 h-2.5 w-2.5 rounded-full ${item.dot} shadow-[0_0_14px_currentColor]`} aria-hidden="true" />
                <h3 className="mt-5 font-display text-base font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/50">{item.description}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-8 grid max-w-5xl gap-4 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.04] p-5 sm:grid-cols-[0.8fr_1.2fr] sm:items-center sm:p-6" data-reveal>
          <div className="font-display text-lg font-bold text-white sm:text-xl">
            The problem is not another strategy.
          </div>
          <p className="text-sm leading-relaxed text-white/55">
            PropLogAI makes the behavior visible—so you can see the trigger, measure the rule break, and build a different response.
          </p>
        </div>
      </div>
    </section>
  );
}

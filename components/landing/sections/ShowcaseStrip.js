/**
 * ShowcaseStrip — the rest of the product. Trophy wall and prop expenses use
 * REAL screenshots at public/landing/*.webp (owner uploads; binary can't go
 * through the agent's GitHub tools); the quick-add log keeps a stylized form
 * mockup. Money appears only in the prop-expense ROI context, never profit hype.
 */

function QuickAddMock() {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">Quick add trade</span>
        <span className="font-mono text-[8px] text-cyan-300">~30s</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2">
          <div className="font-mono text-[8px] text-white/30">PAIR</div>
          <div className="text-xs font-semibold text-white/85">XAU/USD</div>
        </div>
        <div className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2">
          <div className="font-mono text-[8px] text-white/30">DIRECTION</div>
          <div className="text-xs font-semibold text-emerald-300">Long</div>
        </div>
      </div>
      <div className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2">
        <div className="font-mono text-[8px] text-white/30">SETUP</div>
        <div className="mt-1 flex gap-1.5">
          <span className="rounded-md bg-[#8b7cf6]/15 px-2 py-0.5 text-[9px] font-semibold text-[#c4b5fd]">A+ breakout</span>
          <span className="rounded-md border border-white/[0.08] px-2 py-0.5 text-[9px] text-white/40">London sweep</span>
        </div>
      </div>
      <div className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2">
        <div className="font-mono text-[8px] text-white/30">EMOTIONS</div>
        <div className="mt-1 flex gap-1.5">
          <span className="rounded-full border border-cyan-300/25 bg-cyan-300/[0.08] px-2 py-0.5 text-[9px] text-cyan-200">Calm</span>
          <span className="rounded-full border border-white/[0.08] px-2 py-0.5 text-[9px] text-white/40">FOMO</span>
        </div>
      </div>
      <div className="rounded-lg bg-gradient-to-r from-[#8b7cf6] to-[#22d3ee] py-2 text-center text-[10px] font-semibold text-[#070710]">
        Log trade
      </div>
    </div>
  );
}

const CARDS = [
  { title: 'Quick add trade', desc: 'Log in 30 seconds, on purpose.', type: 'mock' },
  { title: 'Trophy wall', desc: 'Payout & funded certificates, verified.', type: 'img', src: '/landing/trophy.webp', alt: 'PropLogAI trophy wall with payout and funded certificates' },
  { title: 'Prop expenses', desc: 'Know what the prop journey really costs.', type: 'img', src: '/landing/expenses.webp', alt: 'PropLogAI prop firm expenses and payouts tracker' },
];

export default function ShowcaseStrip() {
  return (
    <section className="relative px-4 py-24 sm:px-10" data-reveal>
      <div
        className="absolute left-[-12rem] top-24 -z-10 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(139,124,246,0.06),transparent_65%)] blur-2xl"
        aria-hidden="true"
      />
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.28em] text-white/40">
            The whole toolbox
          </div>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Everything feeds{' '}
            <span className="gradient-shimmer">the same loop.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-white/55">
            Logging, coaching, proof, and the prop-firm money trail — connected,
            so nothing you track goes to waste.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((card, index) => (
            <div
              key={card.title}
              className="landing-card overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0c16]/90"
              data-reveal
              style={{ '--reveal-delay': `${index * 80}ms` }}
            >
              {card.type === 'mock' ? (
                <div className="p-4">
                  <QuickAddMock />
                </div>
              ) : (
                <img
                  src={card.src}
                  alt={card.alt}
                  className="block aspect-[16/10] w-full object-cover object-top"
                  loading="lazy"
                />
              )}
              <div className="border-t border-white/[0.07] p-4">
                <h3 className="font-display text-sm font-bold text-white">{card.title}</h3>
                <p className="mt-1 text-[11px] leading-relaxed text-white/50">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

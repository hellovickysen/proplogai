/**
 * ShowcaseStrip — four mini mockups of the rest of the product, modeled on
 * the real screens. PLACEHOLDERS — swap each for a real screenshot later.
 * Content is discipline-first; money appears only in the prop-expense ROI
 * context (what the prop journey costs/returns), never as trading-profit hype.
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

function AiAnalysisMock() {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">Propol AI analysis</span>
        <span className="rounded-full bg-rose-400/10 px-2 py-0.5 font-mono text-[8px] font-bold text-rose-300">2 patterns</span>
      </div>
      <div className="rounded-lg border-l-2 border-rose-400/60 bg-white/[0.03] px-3 py-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-white/85">Revenge sizing after SL</span>
          <span className="rounded bg-rose-400/15 px-1.5 py-0.5 text-[8px] font-bold text-rose-300">high</span>
        </div>
        <p className="mt-1 text-[9px] leading-relaxed text-white/50">Trades #1, #18, #33 — size increased after losses.</p>
      </div>
      <div className="rounded-lg border-l-2 border-amber-400/60 bg-white/[0.03] px-3 py-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-white/85">No-setup FOMO entries</span>
          <span className="rounded bg-amber-400/15 px-1.5 py-0.5 text-[8px] font-bold text-amber-300">medium</span>
        </div>
        <p className="mt-1 text-[9px] leading-relaxed text-white/50">8 trades had no rulebook setup tagged.</p>
      </div>
      <div className="rounded-lg border border-emerald-300/15 bg-emerald-300/[0.06] px-3 py-2">
        <div className="font-mono text-[8px] uppercase tracking-wider text-emerald-300/70">Best habit</div>
        <p className="mt-0.5 text-[9px] leading-relaxed text-emerald-50/80">London sweep + ChoCh wins ~half the time. Keep trusting it.</p>
      </div>
    </div>
  );
}

function TrophyMock() {
  const certs = [
    { firm: 'Fundedfirm', tag: 'Payout', tone: 'text-emerald-300 border-emerald-300/25 bg-emerald-300/[0.07]' },
    { firm: 'Phidias', tag: 'Payout', tone: 'text-cyan-300 border-cyan-300/25 bg-cyan-300/[0.07]' },
    { firm: 'DayTraders', tag: 'Funded', tone: 'text-[#c4b5fd] border-[#8b7cf6]/25 bg-[#8b7cf6]/[0.07]' },
  ];
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">Trophy wall</span>
        <span className="font-mono text-[8px] text-amber-300">7 earned</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {certs.map((c) => (
          <div key={c.firm} className={`flex aspect-[4/3] flex-col items-center justify-center rounded-lg border ${c.tone}`}>
            <span className="text-base">🏆</span>
            <span className="mt-1 font-mono text-[8px] font-semibold">{c.firm}</span>
            <span className="text-[7px] opacity-70">{c.tag} cert</span>
          </div>
        ))}
      </div>
      <p className="text-center text-[9px] text-white/40">Payout &amp; funded certificates, verified</p>
    </div>
  );
}

function ExpensesMock() {
  const rows = [
    { firm: 'Fundedfirm', note: '50K · funded', tone: 'text-emerald-300' },
    { firm: 'Phidias', note: '50K · phase 2', tone: 'text-cyan-300' },
    { firm: 'Topstep', note: '100K · breached', tone: 'text-rose-300' },
  ];
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">Prop expenses</span>
        <span className="rounded-md bg-gradient-to-r from-[#8b7cf6] to-[#22d3ee] px-2 py-0.5 font-mono text-[8px] font-semibold text-[#070710]">+ Add</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Invested', val: '$4.4k', tone: 'text-white' },
          { label: 'Payouts', val: '$8.2k', tone: 'text-emerald-300' },
          { label: 'Net ROI', val: '+84%', tone: 'text-emerald-300' },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-white/[0.07] bg-black/25 p-2 text-center">
            <div className="font-mono text-[7px] uppercase tracking-wider text-white/35">{s.label}</div>
            <div className={`mt-0.5 font-display text-xs font-bold ${s.tone}`}>{s.val}</div>
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        {rows.map((r) => (
          <div key={r.firm} className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-black/20 px-2.5 py-1.5">
            <span className="text-[10px] font-semibold text-white/80">{r.firm}</span>
            <span className={`font-mono text-[8px] ${r.tone}`}>{r.note}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const CARDS = [
  { title: 'Quick add trade', desc: 'Log in 30 seconds, on purpose.', Mock: QuickAddMock },
  { title: 'AI analysis', desc: 'Recurring mistakes, surfaced with evidence.', Mock: AiAnalysisMock },
  { title: 'Trophy wall', desc: 'Payout & funded certificates, verified.', Mock: TrophyMock },
  { title: 'Prop expenses', desc: 'Know what the prop journey really costs.', Mock: ExpensesMock },
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

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CARDS.map((card, index) => (
            <div
              key={card.title}
              className="landing-card rounded-2xl border border-white/[0.08] bg-[#0a0c16]/90 p-4"
              data-reveal
              style={{ '--reveal-delay': `${index * 80}ms` }}
            >
              <card.Mock />
              <div className="mt-4 border-t border-white/[0.07] pt-3">
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

export default function ProblemSection() {
  return (
    <section className="px-4 py-24 sm:px-10" data-reveal>
      <div className="mx-auto max-w-3xl">

        <div className="mb-6 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-xs font-semibold text-white/50">
            The problem
          </div>
        </div>

        <h2 className="text-center font-display text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl">
          Every blown challenge
          <br />
          follows the <span className="text-red-400">same invisible loop.</span>
        </h2>

        <p className="mx-auto mt-6 max-w-xl text-center text-base leading-relaxed text-white/55">
          You write the rules. You know the rules. Then the market moves and the rules disappear. A loss turns into a bigger loss, a bigger loss turns into a blown challenge — and you start the next one without ever seeing what just happened.
        </p>

        {/* The cycle — one quiet diagram, not a card dump */}
        <div className="mx-auto mt-14 max-w-2xl">
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              { n: '1', t: 'A loss hits', d: 'You feel the tilt.' },
              { n: '2', t: 'You break a rule', d: 'Position size. Stop loss. Setup.' },
              { n: '3', t: 'It gets worse', d: 'Revenge trade. No setup. Bigger loss.' },
              { n: '4', t: 'Challenge gone', d: 'And you never saw the pattern.' },
            ].map((s, i) => (
              <div key={i} className="rounded-xl border border-red-400/12 bg-red-400/[0.02] p-4" style={{ '--reveal-delay': `${i * 90}ms` }} data-reveal>
                <div className="font-mono text-xs text-red-300/60">0{s.n}</div>
                <div className="mt-1 font-display text-sm font-bold text-white/85">{s.t}</div>
                <div className="mt-1 text-xs leading-relaxed text-white/40">{s.d}</div>
              </div>
            ))}
          </div>
          {/* Loop arrow note */}
          <p className="mt-5 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-white/25">
            ↻ repeat until the next challenge fee
          </p>
        </div>
      </div>
    </section>
  );
}

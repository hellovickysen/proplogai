import Link from 'next/link';

const FEATURES = [
  { icon: '🔍', title: 'AI mistake detection', body: 'Every trade graded by AI — it flags your real mistakes (moved stops, chased entries, broken rules) with evidence from your data.' },
  { icon: '🧠', title: 'Psychology insights', body: 'See how your emotions drive results. Win rate under FOMO vs discipline, plus guardrails to break the cycle.' },
  { icon: '📈', title: 'Journal & analytics', body: 'Log trades, attach screenshots, and track win rate, profit factor, R, an equity curve and a P&L calendar.' },
];

const STEPS = [
  { n: '1', title: 'Log or import', body: 'Add trades with notes, emotions and screenshots.' },
  { n: '2', title: 'AI analyzes', body: 'Get an instant verdict, mistakes, and the one fix that matters.' },
  { n: '3', title: 'Improve', body: 'Act on recurring-pattern insights and watch your edge grow.' },
];

function Price({ name, price, sub, items, featured }) {
  return (
    <div className={'flex flex-col rounded-2xl border p-6 ' + (featured ? 'border-transparent' : 'border-white/10 bg-white/[0.03]')} style={featured ? { background: 'linear-gradient(#0b0b14,#0b0b14) padding-box, linear-gradient(120deg,#a78bfa,#22d3ee) border-box', border: '1px solid transparent', boxShadow: '0 0 40px rgba(139,92,246,0.18)' } : {}}>
      <div className="font-mono text-[11px] uppercase tracking-wider text-white/50">{name}</div>
      <div className="mt-2 font-display text-3xl font-bold">{price}<span className="text-base font-normal text-white/40">{sub}</span></div>
      <ul className="mt-4 flex-1 space-y-2 text-sm text-white/60">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2"><span className="text-emerald-400">✓</span>{it}</li>
        ))}
      </ul>
      <Link href="/login?signup=1" className={'mt-6 rounded-xl px-4 py-2.5 text-center text-sm font-semibold ' + (featured ? 'text-[#08080f]' : 'border border-white/15 bg-white/5 text-white')} style={featured ? { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' } : {}}>
        {name === 'Starter' ? 'Start free' : 'Choose ' + name}
      </Link>
    </div>
  );
}

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute -left-24 -top-40 h-[55vw] w-[55vw] rounded-full" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.18), transparent 62%)', filter: 'blur(40px)' }} />
      <div className="pointer-events-none absolute -right-24 top-[10%] h-[50vw] w-[50vw] rounded-full" style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.13), transparent 62%)', filter: 'blur(40px)' }} />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg text-sm" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)', boxShadow: '0 0 18px rgba(139,92,246,0.5)' }}>&#9670;</span>
          <span className="font-display text-lg font-bold tracking-tight">PipMind</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-white/70 transition-colors hover:text-white">Log in</Link>
          <Link href="/login?signup=1" className="rounded-xl px-4 py-2 text-sm font-semibold text-[#08080f]" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>Start free</Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-3xl px-6 pb-16 pt-12 text-center sm:pt-20">
        <span className="mb-6 inline-block rounded-full border border-white/15 bg-white/5 px-4 py-1.5 font-mono text-xs text-white/60">AI FOREX TRADING JOURNAL</span>
        <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
          The journal that tells you{' '}
          <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">why you lose.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/60">
          Log your forex trades and let AI find your costliest recurring mistake, decode how your emotions drive results, and coach you to fix it.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link href="/login?signup=1" className="rounded-xl px-6 py-3 font-semibold text-[#08080f] transition-transform hover:-translate-y-0.5" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)', boxShadow: '0 6px 24px rgba(139,92,246,0.35)' }}>Start free — no card</Link>
          <Link href="/login" className="rounded-xl border border-white/15 bg-white/5 px-6 py-3 font-semibold text-white">Log in</Link>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-4 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className="text-2xl">{f.icon}</div>
              <h3 className="mt-3 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-5xl px-6 py-12">
        <h2 className="text-center font-display text-2xl font-bold sm:text-3xl">From trade to insight in three steps</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className="font-display text-3xl font-bold" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{s.n}</div>
              <h3 className="mt-2 font-display text-lg font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-white/60">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="relative z-10 mx-auto max-w-5xl px-6 py-12">
        <h2 className="text-center font-display text-2xl font-bold sm:text-3xl">Start free. Upgrade when it pays off.</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Price name="Starter" price="$0" sub="" items={['30 trades / month', 'Core dashboard & stats', '10 AI analyses / month']} />
          <Price name="Pro" price="$19" sub="/mo" featured items={['Unlimited trades', 'Full AI mistake detection', 'Psychology insights', 'Weekly AI report']} />
          <Price name="Elite" price="$39" sub="/mo" items={['Everything in Pro', 'Multiple accounts', 'Priority AI', 'Mentor mode']} />
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-3xl px-6 py-16 text-center">
        <div className="rounded-2xl border border-white/15 p-10" style={{ background: 'linear-gradient(120deg, rgba(139,92,246,0.14), rgba(34,211,238,0.08))' }}>
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Stop repeating the same mistake.</h2>
          <p className="mx-auto mt-3 max-w-md text-white/60">Turn your journal into an edge. Free to start.</p>
          <Link href="/login?signup=1" className="mt-6 inline-block rounded-xl px-6 py-3 font-semibold text-[#08080f]" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>Create your free account</Link>
        </div>
      </section>

      <footer className="relative z-10 mx-auto max-w-6xl px-6 py-10 text-center">
        <p className="mx-auto max-w-2xl text-xs leading-relaxed text-white/30">
          PipMind is a journaling and analytics tool for educational purposes only and does not provide investment advice. Trading foreign exchange carries substantial risk of loss.
        </p>
        <p className="mt-3 font-mono text-xs text-white/40">PipMind · built with Next.js</p>
      </footer>
    </main>
  );
}

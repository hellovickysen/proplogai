import Link from 'next/link';
import { gradientBtn } from '@/components/landing/LandingData';
import { SectionLabel, Reveal } from '@/components/landing/motion';

/** SECTION 12 — VERIFIED TRADER: futuristic identity/reputation card. */
export function VerifiedTraderSection() {
  return (
    <section className="relative px-4 py-24 sm:px-10 sm:py-32">
      <div className="mx-auto grid max-w-5xl items-center gap-14 lg:grid-cols-2">
        <div>
          <Reveal><SectionLabel>VERIFIED IDENTITY / 12</SectionLabel></Reveal>
          <Reveal delay={100}>
            <h2 className="mt-5 font-display text-3xl font-bold leading-tight tracking-tight text-[#f5f5f2] sm:text-5xl">
              Don&apos;t show a screenshot.
              <br />
              <span className="gradient-shimmer">Show the story.</span>
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="mt-6 max-w-md text-base leading-relaxed text-[#858995]">
              A public trader profile that proves your discipline with real,
              verifiable data — not a screenshot that could be faked. You control
              exactly what&apos;s visible.
            </p>
          </Reveal>
        </div>

        <Reveal delay={200} dir="left">
          <div className="rounded-2xl border border-white/[0.09] bg-[#0c0d12]/70 p-6 backdrop-blur">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-full font-display text-sm font-bold text-[#050507]" style={{ background: 'linear-gradient(135deg,#a3e635,#34d399)' }}>T</div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-sm font-bold text-white">Trader</span>
                  <span className="rounded bg-lime-300/15 px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wider text-lime-300">Verified</span>
                </div>
                <span className="font-mono text-[9px] text-white/30">proplogai.com/profile/trader</span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Discipline', val: '82' },
                { label: 'Adherence', val: '91%' },
                { label: 'Streak', val: '8d' },
                { label: 'Reviews', val: '12' },
              ].map((s) => (
                <div key={s.label} className="rounded-lg border border-white/[0.07] bg-black/25 p-2 text-center">
                  <div className="font-mono text-[7px] uppercase tracking-wider text-white/35">{s.label}</div>
                  <div className="mt-0.5 font-display text-sm font-bold text-lime-300">{s.val}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {['Rule-follower', '8-day streak', 'Pattern-free week'].map((t) => (
                <span key={t} className="rounded-md border border-lime-300/20 bg-lime-300/[0.06] px-2 py-1 font-mono text-[8px] text-lime-200">🏆 {t}</span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/** SECTION 13 — FEATURE CONSTELLATION: network graph, not a card grid. */
export function FeatureConstellationSection() {
  const features = [
    'AI Analysis', 'Discipline', 'Psychology', 'Rulebook', 'P&L Calendar',
    'Trade Journal', 'Expenses', 'Payouts', 'Public Profile', 'Trophies',
  ];
  return (
    <section className="relative px-4 py-24 sm:px-10 sm:py-32">
      <div className="mx-auto max-w-5xl text-center">
        <Reveal><SectionLabel className="mx-auto w-fit">THE SYSTEM / 13</SectionLabel></Reveal>
        <Reveal delay={100}>
          <h2 className="mx-auto mt-5 max-w-3xl font-display text-3xl font-bold leading-tight tracking-tight text-[#f5f5f2] sm:text-5xl">
            One intelligence network.
          </h2>
        </Reveal>

        <Reveal delay={250}>
          <div className="relative mx-auto mt-16 aspect-square w-full max-w-lg">
            {/* connection lines */}
            <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
              {features.map((_, i) => {
                const angle = (i / features.length) * 360 - 90;
                const rad = (angle * Math.PI) / 180;
                const x = 50 + 42 * Math.cos(rad);
                const y = 50 + 42 * Math.sin(rad);
                return <line key={i} x1="50" y1="50" x2={x} y2={y} stroke="rgba(163,230,53,0.18)" strokeWidth="0.3" />;
              })}
            </svg>
            {/* center hub */}
            <div className="absolute left-1/2 top-1/2 z-10 grid h-24 w-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-lime-300/40 bg-[#050507] shadow-[0_0_50px_rgba(163,230,53,0.2)]">
              <span className="font-display text-sm font-bold text-lime-300">PROPLOG</span>
            </div>
            {/* orbiting feature nodes */}
            {features.map((f, i) => {
              const angle = (i / features.length) * 360 - 90;
              const rad = (angle * Math.PI) / 180;
              const x = 50 + 42 * Math.cos(rad);
              const y = 50 + 42 * Math.sin(rad);
              return (
                <div
                  key={f}
                  className="group absolute -translate-x-1/2 -translate-y-1/2 cursor-default rounded-lg border border-white/[0.1] bg-[#0c0d12]/90 px-3 py-1.5 font-mono text-[8px] font-semibold uppercase tracking-wider text-white/60 backdrop-blur transition-all hover:border-lime-300/50 hover:text-lime-300 hover:shadow-[0_0_20px_rgba(163,230,53,0.25)]"
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  {f}
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/** SECTION 14 — WHY MANUAL LOGGING: split contrast. */
export function ManualLoggingSection() {
  return (
    <section className="relative px-4 py-24 sm:px-10 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <Reveal><SectionLabel>THE PHILOSOPHY / 14</SectionLabel></Reveal>
        <Reveal delay={100}>
          <h2 className="mt-5 max-w-3xl font-display text-3xl font-bold leading-tight tracking-tight text-[#f5f5f2] sm:text-5xl">
            The act of logging is part of the system.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2">
          <Reveal delay={150} dir="right">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-8">
              <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/35">Auto import</div>
              <div className="mt-4 font-display text-4xl font-extrabold text-white/30">50 trades</div>
              <div className="mt-1 font-mono text-[10px] text-rose-300/70">0 reflection</div>
              <p className="mt-4 text-sm leading-relaxed text-[#858995]">
                A dump of data with no context. You skim it and move on. Nothing changes.
              </p>
            </div>
          </Reveal>
          <Reveal delay={250} dir="left">
            <div className="rounded-2xl border border-lime-300/25 bg-lime-300/[0.04] p-8">
              <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-lime-300/70">Manual logging</div>
              <div className="mt-4 font-display text-4xl font-extrabold text-lime-300">1 trade</div>
              <div className="mt-1 font-mono text-[10px] text-lime-300/80">1 moment of reflection</div>
              <p className="mt-4 text-sm leading-relaxed text-white/70">
                Reliving the decision is where the discipline is built. That pause is the product.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/** SECTION 15 — THE TRANSFORMATION: chaos -> clarity. */
export function TransformationSection() {
  const chaos = ['Revenge', 'FOMO', 'Rule breaks', 'Random sizing', 'Emotional trading', 'No visibility'];
  const clarity = ['Awareness', 'Discipline', 'Pattern recognition', 'Rule adherence', 'Consistency', 'Better habits'];
  return (
    <section className="relative px-4 py-24 sm:px-10 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <Reveal><SectionLabel>THE TRANSFORMATION / 15</SectionLabel></Reveal>
        <Reveal delay={100}>
          <h2 className="mt-5 font-display text-3xl font-bold leading-tight tracking-tight text-[#f5f5f2] sm:text-5xl">
            From chaos to clarity.
          </h2>
        </Reveal>

        <div className="mt-14 grid items-center gap-8 sm:grid-cols-[1fr_auto_1fr]">
          <Reveal delay={150} dir="right">
            <div className="space-y-2.5">
              <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-rose-300/70">Before</div>
              {chaos.map((c) => (
                <div key={c} className="rounded-lg border border-rose-300/15 bg-rose-300/[0.04] px-4 py-2.5 text-sm text-white/55 line-through decoration-rose-400/40">
                  {c}
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={300}>
            <div className="flex flex-col items-center gap-2">
              <div className="grid h-16 w-16 place-items-center rounded-full border border-lime-300/40 bg-[#050507] shadow-[0_0_40px_rgba(163,230,53,0.25)]">
                <span className="font-display text-xs font-bold text-lime-300">PROPLOG</span>
              </div>
              <span className="text-lime-300">→</span>
            </div>
          </Reveal>

          <Reveal delay={400} dir="left">
            <div className="space-y-2.5">
              <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-lime-300/70">After</div>
              {clarity.map((c) => (
                <div key={c} className="rounded-lg border border-lime-300/20 bg-lime-300/[0.05] px-4 py-2.5 text-sm font-medium text-white/85">
                  {c}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/** FINAL CTA — the path resolves clean. */
export function FinalCTASection() {
  return (
    <section className="relative overflow-hidden px-4 py-32 sm:px-10 sm:py-40">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom,rgba(163,230,53,0.08),transparent_60%)]" aria-hidden="true" />
      <div className="mx-auto max-w-3xl text-center">
        <Reveal>
          <h2 className="font-display text-4xl font-extrabold leading-[1.02] tracking-tight text-[#f5f5f2] sm:text-6xl">
            Your trading has a story.
            <br />
            <span className="gradient-shimmer">Now you can see it.</span>
          </h2>
        </Reveal>
        <Reveal delay={150}>
          <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-[#858995] sm:text-lg">
            Log the trade. Find the pattern. Build the discipline.
          </p>
        </Reveal>
        <Reveal delay={300}>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/login?mode=signup"
              className="cta-glow whitespace-nowrap rounded-xl px-9 py-4 text-base font-semibold text-[#050507] transition-transform hover:-translate-y-0.5"
              style={gradientBtn}
            >
              Start tracking free →
            </Link>
            <Link
              href="#story"
              className="whitespace-nowrap rounded-xl border border-white/12 bg-white/[0.03] px-9 py-4 text-base font-semibold text-white/70 transition hover:border-lime-300/40 hover:text-white"
            >
              Explore PropLogAI
            </Link>
          </div>
        </Reveal>
        <Reveal delay={400}>
          <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-white/30">
            No credit card · Start in 60 seconds
          </p>
        </Reveal>
      </div>
    </section>
  );
}

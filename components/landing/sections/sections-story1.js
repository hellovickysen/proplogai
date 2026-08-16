import { SectionLabel, Reveal, AnimatedNumber } from '@/components/landing/motion';

/** SECTION 01 — THE PROBLEM: chaotic equity path + the "data you never connect". */
export function ProblemSection() {
  const moves = ['+$420', '-$180', '+$210', '-$340', '+$90', '-$510', '+$380', '-$260'];
  return (
    <section id="story" className="relative px-4 py-24 sm:px-10 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <Reveal><SectionLabel>THE PROBLEM / 01</SectionLabel></Reveal>
        <Reveal delay={100}>
          <h2 className="mt-5 font-display text-3xl font-bold leading-tight tracking-tight text-[#f5f5f2] sm:text-5xl">
            The market isn&apos;t the only thing moving.
          </h2>
        </Reveal>

        {/* Chaotic equity strip */}
        <Reveal delay={200}>
          <div className="mt-12 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0c0d12]/60 p-6 backdrop-blur">
            <div className="mb-4 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.2em] text-white/35">
              <span>Session equity</span>
              <span className="text-rose-300/70">Unreviewed</span>
            </div>
            <svg viewBox="0 0 320 90" className="h-24 w-full" preserveAspectRatio="none" aria-hidden="true">
              <polyline
                points="0,45 30,20 55,55 85,25 110,60 140,15 165,62 195,28 220,58 250,10 280,55 320,35"
                fill="none" stroke="#fb7185" strokeWidth="1.5" opacity="0.8"
              />
            </svg>
            <div className="mt-4 flex flex-wrap gap-2">
              {moves.map((m, i) => (
                <span
                  key={i}
                  className={`rounded-md px-2 py-1 font-mono text-[10px] font-semibold ${
                    m.startsWith('+') ? 'bg-lime-300/[0.08] text-lime-300' : 'bg-rose-400/[0.08] text-rose-300'
                  }`}
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={300}>
          <p className="mt-10 max-w-2xl text-lg leading-relaxed text-[#858995] sm:text-xl">
            Your trades are data. Your behavior is data. Your mistakes are data.
            <span className="mt-2 block text-[#f5f5f2]">But most traders never connect it.</span>
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/** SECTION 02 — THE INVISIBLE LOOP: rotating cycle that PropLogAI breaks. */
export function InvisibleLoopSection() {
  const nodes = ['LOSS', 'EMOTION', 'REVENGE', 'RULE BREAK', 'REPEAT'];
  return (
    <section className="relative px-4 py-24 sm:px-10 sm:py-32">
      <div className="mx-auto grid max-w-5xl items-center gap-14 lg:grid-cols-2">
        <div>
          <Reveal><SectionLabel>THE INVISIBLE LOOP / 02</SectionLabel></Reveal>
          <Reveal delay={100}>
            <h2 className="mt-5 font-display text-3xl font-bold leading-tight tracking-tight text-[#f5f5f2] sm:text-5xl">
              One loop keeps repeating.
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="mt-6 max-w-md text-base leading-relaxed text-[#858995]">
              A loss triggers an emotion. The emotion triggers a revenge trade.
              The revenge trade breaks a rule. The rule break becomes a bigger
              loss. The setup changes shape next time — the behavior doesn&apos;t.
            </p>
          </Reveal>
          <Reveal delay={300}>
            <div className="mt-8 rounded-xl border border-lime-300/20 bg-lime-300/[0.05] p-5">
              <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-lime-300/70">PropLogAI breaks the loop</div>
              <p className="mt-2 text-sm leading-relaxed text-white/75">
                It makes the behavior visible — so you can interrupt it before
                the next trade, not after the account is gone.
              </p>
            </div>
          </Reveal>
        </div>

        {/* Rotating loop visual */}
        <Reveal delay={200} dir="left">
          <div className="relative mx-auto aspect-square w-full max-w-sm">
            <div className="absolute inset-0 rounded-full border border-dashed border-rose-400/20" style={{ animation: 'spin-slow 24s linear infinite' }} />
            <div className="absolute inset-[16%] rounded-full border border-white/[0.06]" />
            {nodes.map((n, i) => {
              const angle = (i / nodes.length) * 360 - 90;
              const rad = (angle * Math.PI) / 180;
              const x = 50 + 42 * Math.cos(rad);
              const y = 50 + 42 * Math.sin(rad);
              return (
                <div
                  key={n}
                  className="absolute -translate-x-1/2 -translate-y-1/2 rounded-lg border border-rose-300/25 bg-[#0c0d12]/90 px-3 py-1.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-rose-200 backdrop-blur"
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  {n}
                </div>
              );
            })}
            <div className="absolute left-1/2 top-1/2 grid h-24 w-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-lime-300/40 bg-[#050507] shadow-[0_0_50px_rgba(163,230,53,0.2)]">
              <div className="text-center">
                <div className="font-display text-sm font-bold text-lime-300">PROPLOG</div>
                <div className="font-mono text-[8px] uppercase tracking-widest text-white/40">breaks it</div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/** SECTION 03 — LOG THE TRADE: self-assembling log form. */
export function TradeLoggerSection() {
  const rows = [
    { k: 'PAIR', v: 'XAUUSD' },
    { k: 'DIRECTION', v: 'LONG', tone: 'text-lime-300' },
    { k: 'SETUP', v: 'BREAKOUT' },
    { k: 'EMOTION', v: 'FOCUSED' },
    { k: 'SCREENSHOT', v: 'ATTACHED ✓', tone: 'text-lime-300' },
  ];
  return (
    <section className="relative px-4 py-24 sm:px-10 sm:py-32">
      <div className="mx-auto grid max-w-5xl items-center gap-14 lg:grid-cols-2">
        <Reveal delay={150} dir="right" className="order-2 lg:order-1">
          <div className="rounded-2xl border border-white/[0.08] bg-[#0c0d12]/70 p-6 backdrop-blur">
            <div className="mb-5 flex items-center justify-between">
              <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/35">Log trade</span>
              <span className="font-mono text-[9px] text-lime-300">~30s</span>
            </div>
            <div className="space-y-3">
              {rows.map((r, i) => (
                <Reveal key={r.k} delay={i * 120} dir="left">
                  <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/35">{r.k}</span>
                    <span className={`font-mono text-xs font-semibold ${r.tone || 'text-white/85'}`}>{r.v}</span>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal delay={rows.length * 120 + 100}>
              <div className="mt-5 rounded-lg py-3 text-center font-mono text-xs font-bold text-[#050507]" style={{ background: 'linear-gradient(120deg,#a3e635,#34d399)' }}>
                TRADE LOGGED ✓
              </div>
            </Reveal>
          </div>
        </Reveal>

        <div className="order-1 lg:order-2">
          <Reveal><SectionLabel>CAPTURE / 03</SectionLabel></Reveal>
          <Reveal delay={100}>
            <h2 className="mt-5 font-display text-3xl font-bold leading-tight tracking-tight text-[#f5f5f2] sm:text-5xl">
              Logging takes seconds.
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="mt-6 max-w-md text-base leading-relaxed text-[#858995]">
              The manual pause is the point. Reliving the decision — the setup,
              the emotion, the risk — is where the pattern starts to surface.
              Auto-import skips the only moment that matters.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/** SECTION 04 — DATA BECOMES INTELLIGENCE: nodes connect into a pattern. */
export function PatternDetectorSection() {
  return (
    <section className="relative px-4 py-24 sm:px-10 sm:py-32">
      <div className="mx-auto max-w-5xl text-center">
        <Reveal><SectionLabel className="mx-auto w-fit">INTELLIGENCE / 04</SectionLabel></Reveal>
        <Reveal delay={100}>
          <h2 className="mx-auto mt-5 max-w-3xl font-display text-3xl font-bold leading-tight tracking-tight text-[#f5f5f2] sm:text-5xl">
            Your data becomes intelligence.
          </h2>
        </Reveal>
        <Reveal delay={200}>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[#858995]">
            Propol isn&apos;t a chatbot. It&apos;s an intelligence layer over your
            own journal — it connects the trades you thought were unrelated.
          </p>
        </Reveal>

        <Reveal delay={300}>
          <div className="mt-14 rounded-2xl border border-white/[0.08] bg-[#0c0d12]/60 p-8 backdrop-blur">
            {/* disconnected points -> connected chain */}
            <svg viewBox="0 0 400 120" className="mx-auto h-32 w-full max-w-2xl" aria-hidden="true">
              <defs>
                <linearGradient id="chainGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#fb7185" />
                  <stop offset="100%" stopColor="#a3e635" />
                </linearGradient>
              </defs>
              {/* connection lines */}
              <polyline points="40,80 110,50 180,70 250,40 330,55" fill="none" stroke="url(#chainGrad)" strokeWidth="1" opacity="0.5" strokeDasharray="3 4" />
              {/* nodes */}
              {[
                { x: 40, y: 80, label: 'LOSS' },
                { x: 110, y: 50, label: 'LOSS' },
                { x: 180, y: 70, label: 'REVENGE' },
                { x: 250, y: 40, label: 'LONDON' },
                { x: 330, y: 55, label: '-3.8R' },
              ].map((n, i) => (
                <g key={i}>
                  <circle cx={n.x} cy={n.y} r="4" fill={i < 2 ? '#fb7185' : '#a3e635'} opacity="0.9" />
                  <circle cx={n.x} cy={n.y} r="8" fill="none" stroke={i < 2 ? '#fb7185' : '#a3e635'} strokeOpacity="0.3" />
                  <text x={n.x} y={n.y - 16} textAnchor="middle" fill="#858995" fontSize="8" fontFamily="monospace" letterSpacing="1">{n.label}</text>
                </g>
              ))}
            </svg>
            <Reveal delay={200}>
              <div className="mx-auto mt-6 w-fit rounded-full border border-rose-300/30 bg-rose-300/[0.07] px-5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-rose-200">
                Pattern detected
              </div>
            </Reveal>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/** SECTION 05 — YOUR BLIND SPOT: cinematic equity zoom into the repeat. */
export function BlindSpotSection() {
  return (
    <section className="relative overflow-hidden px-4 py-28 sm:px-10 sm:py-40">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(251,113,113,0.05),transparent_60%)]" aria-hidden="true" />
      <div className="mx-auto max-w-4xl text-center">
        <Reveal><SectionLabel className="mx-auto w-fit text-rose-300/70">THE BLIND SPOT / 05</SectionLabel></Reveal>
        <Reveal delay={100}>
          <h2 className="mt-6 font-display text-4xl font-extrabold leading-[1.02] tracking-tight text-[#f5f5f2] sm:text-6xl">
            The mistake wasn&apos;t random.
          </h2>
        </Reveal>
        <Reveal delay={250}>
          <div className="mx-auto mt-12 max-w-2xl rounded-2xl border border-white/[0.08] bg-[#0c0d12]/70 p-8 backdrop-blur">
            <div className="space-y-4 text-left">
              <div className="font-mono text-sm text-[#858995]">
                <AnimatedNumber value={4} className="text-2xl font-bold text-rose-300" /> of 6 losses followed the same behavior.
              </div>
              <div className="border-l-2 border-rose-400/60 pl-4">
                <div className="text-base text-white/85">Moving your stop after entering.</div>
                <div className="mt-1 font-mono text-xs text-rose-300">-1.6R</div>
              </div>
              <div className="pt-2 font-mono text-[10px] uppercase tracking-[0.24em] text-lime-300/70">
                Pattern detected
              </div>
            </div>
          </div>
        </Reveal>
        <Reveal delay={350}>
          <p className="mx-auto mt-8 max-w-lg text-base text-[#858995]">
            You can&apos;t fix what you can&apos;t see. PropLogAI shows you the
            repeat — with the evidence attached.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

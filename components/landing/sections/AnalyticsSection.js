/* Analytics — know your edge, not just your P&L. */
const METRICS = [
  { label: 'Win rate', value: 38, suffix: '%', decimal: false },
  { label: 'Profit factor', value: 1.36, suffix: '', decimal: true, places: 2 },
  { label: 'Average R', value: 1.8, suffix: 'R', decimal: true, places: 1 },
  { label: 'Max drawdown', value: 6.2, suffix: '%', decimal: true, places: 1 },
];

/* A self-drawing equity curve */
function EquityCurve() {
  return (
    <svg viewBox="0 0 600 220" className="h-auto w-full" aria-hidden="true">
      <defs>
        <linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(34,211,238,0.22)" />
          <stop offset="100%" stopColor="rgba(34,211,238,0)" />
        </linearGradient>
        <linearGradient id="eqLine" x1="0" x2="1">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      {/* grid */}
      {[40, 90, 140, 190].map((y) => (
        <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      ))}
      {/* area fill */}
      <path
        d="M0 180 L60 168 L120 175 L180 150 L240 158 L300 128 L360 138 L420 100 L480 108 L540 72 L600 58 L600 220 L0 220 Z"
        fill="url(#eqFill)"
      />
      {/* the line itself */}
      <path
        d="M0 180 L60 168 L120 175 L180 150 L240 158 L300 128 L360 138 L420 100 L480 108 L540 72 L600 58"
        fill="none" stroke="url(#eqLine)" strokeWidth="2.5"
        className="progress-path" data-draw
      />
      {/* win/loss nodes */}
      {[
        { x: 180, y: 150, win: true }, { x: 240, y: 158, win: false },
        { x: 360, y: 138, win: true }, { x: 420, y: 100, win: true },
        { x: 480, y: 108, win: false }, { x: 540, y: 72, win: true },
      ].map((node, i) => (
        <circle key={i} cx={node.x} cy={node.y} r="4" fill={node.win ? '#34d399' : '#fb7185'} opacity="0.9" />
      ))}
    </svg>
  );
}

export default function AnalyticsSection() {
  return (
    <section className="data-grid-bg px-4 py-20 sm:px-10 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="text-center" data-reveal>
          <p className="section-eyebrow mb-4">The measurement layer</p>
          <h2 className="mx-auto max-w-3xl font-display text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            Don&apos;t just know your P&amp;L.{' '}
            <span className="gradient-shimmer">Know your edge.</span>
          </h2>
        </div>

        <div className="mt-16 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0a14] p-6 sm:p-9" data-reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">Net P&amp;L · all accounts</p>
              <p className="mt-1 font-display text-4xl font-extrabold text-emerald-300">
                +$<span data-count-decimal="1613.70" data-count-places="2">0.00</span>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-10 gap-y-4 sm:grid-cols-4">
              {METRICS.map((metric) => (
                <div key={metric.label}>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-white/35">{metric.label}</p>
                  <p className="mt-0.5 font-display text-xl font-bold">
                    {metric.decimal ? (
                      <span data-count-decimal={metric.value} data-count-places={metric.places} data-count-suffix={metric.suffix}>0{metric.suffix}</span>
                    ) : (
                      <span data-count-to={metric.value} data-count-suffix={metric.suffix}>0{metric.suffix}</span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8">
            <EquityCurve />
          </div>
          <p className="mt-6 text-center text-sm text-white/40">
            Setup performance · session performance · emotional performance · discipline trend — every trade adds another dimension.
          </p>
        </div>
      </div>
    </section>
  );
}

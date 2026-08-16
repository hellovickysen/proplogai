/**
 * Fake discipline-dashboard mockup for the hero.
 * PLACEHOLDER — swap this whole frame for a real product screenshot later.
 * Structured like the real app: sidebar nav, KPI row, discipline trend chart,
 * review queue. All numbers are illustrative discipline metrics, never P&L-led.
 */
export default function HeroDashboardMock() {
  return (
    <div
      className="product-mockup relative overflow-hidden rounded-2xl border border-white/[0.12] bg-[#0a0c16]/95 text-left shadow-[0_40px_120px_rgba(0,0,0,0.6)] backdrop-blur-xl"
      aria-label="PropLogAI discipline dashboard preview"
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-3 border-b border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-[#fb7185]/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#fbbf24]/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#34d399]/70" />
        </div>
        <div className="mx-auto flex items-center gap-2 rounded-md border border-white/[0.06] bg-black/30 px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="font-mono text-[10px] text-white/40">proplogai.com/dashboard</span>
        </div>
        <span className="hidden rounded-full border border-[#8b7cf6]/30 bg-[#8b7cf6]/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[#b3a5f8] sm:block">
          Day 14
        </span>
      </div>

      <div className="grid sm:grid-cols-[180px_1fr]">
        {/* Sidebar */}
        <aside className="hidden border-r border-white/[0.06] bg-black/20 p-4 sm:block">
          <div className="mb-5 flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-gradient-to-br from-[#8b7cf6] to-[#22d3ee] text-[10px] font-bold text-[#070710]">P</span>
            <span className="font-display text-xs font-bold text-white/85">PropLogAI</span>
          </div>
          <div className="mb-4 rounded-lg bg-gradient-to-r from-[#8b7cf6] to-[#22d3ee] px-3 py-1.5 text-center text-[10px] font-semibold text-[#070710]">
            + Log trade
          </div>
          <nav className="space-y-1 text-[10px]">
            {['Discipline', 'Trades', 'Journal', 'Rulebook', 'Review queue', 'AI Coach', 'Progress'].map((item, i) => (
              <div
                key={item}
                className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 ${
                  i === 0
                    ? 'bg-white/[0.07] font-semibold text-white'
                    : 'text-white/40'
                }`}
              >
                <span className={`h-1 w-1 rounded-full ${i === 0 ? 'bg-cyan-300' : 'bg-white/20'}`} />
                {item}
              </div>
            ))}
          </nav>
          <div className="mt-6 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
            <div className="font-mono text-[8px] uppercase tracking-wider text-white/30">30-day programme</div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full w-[47%] rounded-full bg-gradient-to-r from-[#8b7cf6] to-[#22d3ee]" />
            </div>
            <div className="mt-1 font-mono text-[8px] text-white/40">Day 14 of 30 · Foundation</div>
          </div>
        </aside>

        {/* Main panel */}
        <div className="p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="font-display text-sm font-bold text-white sm:text-base">
                Good evening, <span className="text-cyan-300">Trader</span>
              </div>
              <div className="mt-0.5 text-[10px] text-white/40">
                ✦ Stay disciplined. Every trade is evidence.
              </div>
            </div>
            <div className="flex items-center gap-3 text-right">
              <div>
                <div className="font-mono text-[8px] uppercase tracking-wider text-white/30">Rule breaks</div>
                <div className="font-display text-sm font-bold text-rose-300">2</div>
              </div>
              <div>
                <div className="font-mono text-[8px] uppercase tracking-wider text-white/30">This week</div>
                <div className="font-display text-sm font-bold text-white/85">5 trades</div>
              </div>
              <div>
                <div className="font-mono text-[8px] uppercase tracking-wider text-white/30">Streak</div>
                <div className="font-display text-sm font-bold text-emerald-300">8d</div>
              </div>
            </div>
          </div>

          {/* KPI row */}
          <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[
              { label: 'Discipline score', value: '82', sub: '↑ 18 this month', tone: 'text-white', spark: [40, 44, 43, 52, 50, 60, 66, 70, 74, 82], color: '#22d3ee' },
              { label: 'Rule adherence', value: '91%', sub: 'last 20 trades', tone: 'text-emerald-300', spark: [60, 65, 70, 68, 78, 80, 85, 88, 90, 91], color: '#34d399' },
              { label: 'Focus rule kept', value: '6/7', sub: 'this week', tone: 'text-[#b3a5f8]', spark: [3, 4, 4, 5, 5, 6, 6, 6, 6, 6], color: '#8b7cf6' },
              { label: 'Reviews done', value: '12', sub: 'of 12 queued', tone: 'text-white', spark: [1, 2, 4, 5, 6, 8, 9, 10, 11, 12], color: '#fbbf24' },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full" style={{ background: kpi.color }} />
                  <span className="font-mono text-[8px] uppercase tracking-wider text-white/35">{kpi.label}</span>
                </div>
                <div className={`mt-1 font-display text-lg font-extrabold leading-none ${kpi.tone}`}>{kpi.value}</div>
                <div className="mt-1 text-[9px] text-white/35">{kpi.sub}</div>
                <svg viewBox="0 0 100 24" className="mt-1.5 h-5 w-full" preserveAspectRatio="none" aria-hidden="true">
                  <polyline
                    points={kpi.spark.map((v, i) => `${(i / (kpi.spark.length - 1)) * 100},${22 - (v / Math.max(...kpi.spark)) * 20}`).join(' ')}
                    fill="none"
                    stroke={kpi.color}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    opacity="0.7"
                  />
                </svg>
              </div>
            ))}
          </div>

          <div className="grid gap-2.5 lg:grid-cols-[1.5fr_1fr]">
            {/* Discipline trend chart */}
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[9px] uppercase tracking-wider text-white/35">Discipline trend · 30 days</span>
                <div className="flex gap-1">
                  {['Score', 'Adherence'].map((t, i) => (
                    <span key={t} className={`rounded px-1.5 py-0.5 font-mono text-[8px] ${i === 0 ? 'bg-white/[0.08] text-white/70' : 'text-white/30'}`}>{t}</span>
                  ))}
                </div>
              </div>
              <svg viewBox="0 0 320 90" className="h-20 w-full" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <linearGradient id="heroScoreFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(34,211,238,0.25)" />
                    <stop offset="100%" stopColor="rgba(34,211,238,0)" />
                  </linearGradient>
                </defs>
                {[20, 45, 70].map((y) => (
                  <line key={y} x1="0" y1={y} x2="320" y2={y} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 4" />
                ))}
                <path
                  d="M0,72 L25,70 L50,73 L75,64 L100,66 L125,58 L150,60 L175,50 L200,44 L225,40 L250,34 L275,28 L320,18"
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M0,72 L25,70 L50,73 L75,64 L100,66 L125,58 L150,60 L175,50 L200,44 L225,40 L250,34 L275,28 L320,18 L320,90 L0,90Z"
                  fill="url(#heroScoreFill)"
                />
                <circle cx="320" cy="18" r="3" fill="#22d3ee" />
                <circle cx="320" cy="18" r="6" fill="none" stroke="#22d3ee" strokeOpacity="0.4" />
              </svg>
              <div className="mt-1.5 flex justify-between font-mono text-[8px] text-white/25">
                <span>Day 1</span><span>Day 10</span><span>Day 20</span><span>Day 30</span>
              </div>
            </div>

            {/* Review queue */}
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5">
              <div className="mb-2.5 flex items-center justify-between">
                <span className="font-mono text-[9px] uppercase tracking-wider text-white/35">Review queue</span>
                <span className="rounded-full bg-rose-400/10 px-1.5 py-0.5 font-mono text-[8px] font-bold text-rose-300">2 left</span>
              </div>
              <div className="space-y-2">
                {[
                  { pair: 'XAU/USD', issue: 'Moved stop-loss', tone: 'rose', state: 'Review' },
                  { pair: 'GBP/JPY', issue: 'No setup tagged', tone: 'amber', state: 'Review' },
                  { pair: 'EUR/USD', issue: 'Clean loss · rules kept', tone: 'emerald', state: '✓ Cleared' },
                ].map((row) => (
                  <div key={row.pair} className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-black/20 px-2.5 py-2">
                    <div>
                      <div className="text-[10px] font-semibold text-white/80">{row.pair}</div>
                      <div className={`text-[9px] ${row.tone === 'rose' ? 'text-rose-300/70' : row.tone === 'amber' ? 'text-amber-300/70' : 'text-emerald-300/70'}`}>
                        {row.issue}
                      </div>
                    </div>
                    <span
                      className={`rounded-md px-1.5 py-0.5 font-mono text-[8px] font-semibold ${
                        row.tone === 'emerald'
                          ? 'bg-emerald-400/10 text-emerald-300'
                          : 'bg-white/[0.06] text-white/50'
                      }`}
                    >
                      {row.state}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

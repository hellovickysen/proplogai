/**
 * Fake discipline-dashboard mockup for the hero — modeled on the REAL
 * PropLogAI dashboard: sidebar, "Today's coaching" banner, KPI row, and the
 * Rulebook-discipline dial with streaks. PLACEHOLDER — swap for a real
 * screenshot later. Metrics are discipline-led, not P&L-led.
 */
export default function HeroDashboardMock() {
  const breakdown = [
    { label: 'Journal', val: '15/25', pct: 60, color: '#22d3ee' },
    { label: 'Discipline', val: '25/30', pct: 83, color: '#8b7cf6' },
    { label: 'No revenge', val: '25/25', pct: 100, color: '#34d399' },
    { label: 'Volume', val: '20/20', pct: 100, color: '#22d3ee' },
  ];
  // dial: 85/100 -> stroke-dasharray of circumference
  const C = 2 * Math.PI * 52;
  const score = 85;
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

      <div className="grid sm:grid-cols-[170px_1fr]">
        {/* Sidebar */}
        <aside className="hidden border-r border-white/[0.06] bg-black/20 p-4 sm:block">
          <div className="mb-5 flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-gradient-to-br from-[#8b7cf6] to-[#22d3ee] text-[10px] font-bold text-[#070710]">P</span>
            <span className="font-display text-xs font-bold text-white/85">PropLogAI</span>
          </div>
          <nav className="space-y-1 text-[10px]">
            {['Dashboard', 'Trades', 'Calendar', 'Rulebook', 'Playbook', 'Accounts', 'Prop Expenses', 'Trophies', 'AI Coach'].map((item, i) => (
              <div
                key={item}
                className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 ${i === 0 ? 'bg-white/[0.07] font-semibold text-white' : 'text-white/40'}`}
              >
                <span className={`h-1 w-1 rounded-full ${i === 0 ? 'bg-cyan-300' : 'bg-white/20'}`} />
                {item}
              </div>
            ))}
          </nav>
        </aside>

        {/* Main panel */}
        <div className="p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="font-display text-base font-bold text-white sm:text-lg">Dashboard</div>
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 font-mono text-[9px] text-white/50">
                TODAY <span className="text-white/80">+0.00</span>
              </span>
              <span className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 font-mono text-[9px] text-white/70">Main</span>
            </div>
          </div>

          {/* Today's coaching banner */}
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-3">
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md bg-[#8b7cf6]/20 text-[10px] text-[#b3a5f8]">P</span>
            <div>
              <div className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/35">Today&apos;s coaching</div>
              <p className="mt-1 text-xs leading-relaxed text-white/75">
                Before your next session, write your position size on a sticky note — and don&apos;t touch it, no matter what.
              </p>
            </div>
          </div>

          {/* KPI row */}
          <div className="mb-4 grid grid-cols-3 gap-2.5">
            {[
              { label: 'Discipline score', value: '85', tone: 'text-white' },
              { label: 'Rule adherence', value: '91%', tone: 'text-emerald-300' },
              { label: 'Focus kept', value: '6/7', tone: 'text-cyan-300' },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
                <div className="font-mono text-[8px] uppercase tracking-wider text-white/35">{kpi.label}</div>
                <div className={`mt-1 font-display text-xl font-extrabold leading-none ${kpi.tone}`}>{kpi.value}</div>
              </div>
            ))}
          </div>

          {/* Rulebook discipline dial + streaks */}
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xs">💪</span>
              <span className="font-display text-sm font-bold text-white">Rulebook discipline</span>
            </div>
            <div className="grid items-center gap-5 sm:grid-cols-[auto_1fr_auto]">
              {/* Dial */}
              <div className="relative mx-auto h-28 w-28">
                <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
                  <circle
                    cx="60" cy="60" r="52" fill="none"
                    stroke="url(#dialGrad)" strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={`${(score / 100) * C} ${C}`}
                  />
                  <defs>
                    <linearGradient id="dialGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" />
                      <stop offset="100%" stopColor="#8b7cf6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-2xl font-extrabold text-white">{score}</span>
                  <span className="font-mono text-[8px] uppercase tracking-wider text-white/35">Weekly</span>
                </div>
              </div>
              {/* Breakdown bars */}
              <div className="space-y-2">
                <div className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/35">Score breakdown</div>
                {breakdown.map((b) => (
                  <div key={b.label} className="flex items-center gap-2">
                    <span className="w-16 text-[9px] text-white/50">{b.label}</span>
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
                      <div className="h-full rounded-full" style={{ width: `${b.pct}%`, background: b.color }} />
                    </div>
                    <span className="font-mono text-[8px] text-white/40">{b.val}</span>
                  </div>
                ))}
              </div>
              {/* Streaks */}
              <div className="flex gap-2.5 sm:flex-col">
                <div className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-center">
                  <div className="font-mono text-[8px] uppercase tracking-wider text-white/35">Journal streak</div>
                  <div className="font-display text-lg font-extrabold text-white">8d</div>
                </div>
                <div className="rounded-lg border border-emerald-300/15 bg-emerald-300/[0.06] px-3 py-2 text-center">
                  <div className="font-mono text-[8px] uppercase tracking-wider text-emerald-300/60">No revenge</div>
                  <div className="font-display text-lg font-extrabold text-emerald-300">6d</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

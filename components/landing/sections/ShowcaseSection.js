import { gradientText, gradientBtn } from '@/components/landing/LandingData';

export default function ShowcaseSection() {
  return (
    <>
      {/* ═══════════════ PRODUCT SHOWCASE ═══════════════ */}

      {/* Showcase 1: Dashboard — text left, mockup right */}
      <section className="px-4 py-20 sm:px-10" data-reveal>
        <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-2">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/8 px-3 py-1 text-[11px] font-semibold text-violet-200">
              Dashboard
            </div>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Your trading story,<br />told in numbers</h2>
            <p className="mt-4 text-sm leading-relaxed text-white/55">Win rate, profit factor, average R, equity curve — all computed automatically from your trades. No spreadsheets. No guessing.</p>
            <ul className="mt-6 space-y-3 text-sm text-white/60">
              {['Real-time equity curve tracks your growth', 'Weekly discipline score keeps you honest', 'Achievement badges reward consistency'].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-emerald-400">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5" data-reveal style={{ '--reveal-delay': '120ms' }}>
            {/* Fake dashboard mockup */}
            <div className="mb-4 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">Dashboard overview</span>
              <span className="text-xs text-emerald-300">June 2026</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-5 sm:grid-cols-4">
              {[
                { label: 'Win rate', val: '62%', color: 'text-emerald-400' },
                { label: 'Profit factor', val: '1.84', color: 'text-emerald-400' },
                { label: 'Avg R', val: '+0.72R', color: 'text-cyan-300' },
                { label: 'Total P&L', val: '+$2,847', color: 'text-emerald-400' },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-white/8 bg-black/30 p-3">
                  <div className="font-mono text-[11px] uppercase tracking-wider text-white/30">{s.label}</div>
                  <div className={`mt-1 font-display text-sm font-bold ${s.color}`}>{s.val}</div>
                </div>
              ))}
            </div>
            {/* Fake equity curve */}
            <div className="rounded-xl border border-white/8 bg-black/20 p-4">
              <div className="font-mono text-[11px] uppercase tracking-wider text-white/30 mb-3">Equity curve</div>
              <svg viewBox="0 0 400 80" className="w-full h-16" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(52,211,153,0.3)" />
                    <stop offset="100%" stopColor="rgba(52,211,153,0)" />
                  </linearGradient>
                </defs>
                <path d="M0,65 L30,60 L60,55 L90,58 L120,45 L150,48 L180,38 L210,42 L240,30 L270,28 L300,22 L330,18 L360,15 L400,10" fill="none" stroke="#34d399" strokeWidth="2" />
                <path d="M0,65 L30,60 L60,55 L90,58 L120,45 L150,48 L180,38 L210,42 L240,30 L270,28 L300,22 L330,18 L360,15 L400,10 L400,80 L0,80Z" fill="url(#eq)" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Showcase 2: AI Coach — mockup left, text right */}
      <section className="px-4 py-20 sm:px-10" data-reveal>
        <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-2">
          <div className="order-2 lg:order-1 rounded-2xl border border-white/10 bg-white/[0.03] p-5" data-reveal style={{ '--reveal-delay': '120ms' }}>
            {/* Fake AI coach report */}
            <div className="mb-4 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">Propol AI Review</span>
              <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-200">2 patterns found</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 mb-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-red-300/60">Recurring mistake #1</div>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/75">Revenge trading after back-to-back losses during London close. Cost you -3.8R this week.</p>
                </div>
                <span className="shrink-0 rounded-lg bg-red-400/12 px-2 py-1 text-xs font-bold text-red-300">-3.8R</span>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 mb-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-amber-300/60">Recurring mistake #2</div>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/75">Moving stop loss on XAU/USD scalps. 4 of 6 losses this week had SL adjustments.</p>
                </div>
                <span className="shrink-0 rounded-lg bg-amber-400/12 px-2 py-1 text-xs font-bold text-amber-300">-1.6R</span>
              </div>
            </div>
            <div className="rounded-xl border border-emerald-300/15 bg-emerald-300/8 p-3">
              <div className="font-mono text-[10px] uppercase tracking-wider text-emerald-300/60 mb-1">Propol insight</div>
              <p className="text-xs leading-relaxed text-emerald-50/75">Your journal shows a 71% win rate after cool-down periods vs 34% without. Your records suggest a 20-minute pause after 2 consecutive losses has historically improved your results.</p>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/8 px-3 py-1 text-[11px] font-semibold text-cyan-200">
              Propol AI Coach
            </div>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Your AI Trading<br />Performance Coach</h2>
            <p className="mt-4 text-sm leading-relaxed text-white/55">Propol analyzes your journal, behavior, emotions, discipline, and adherence to your own trading plan. No financial advice — just evidence from your own data.</p>
            <ul className="mt-6 space-y-3 text-sm text-white/60">
              {['Per-trade scoring across 4 coaching dimensions', 'Monthly performance reviews with 5 key scores', 'Psychology and discipline insights from your journal'].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-cyan-400">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Showcase 3: P&L Calendar — text left, mockup right */}
      <section className="px-4 py-20 sm:px-10" data-reveal>
        <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-2">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/8 px-3 py-1 text-[11px] font-semibold text-emerald-200">
              P&L Calendar
            </div>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">See your patterns<br />at a glance</h2>
            <p className="mt-4 text-sm leading-relaxed text-white/55">A visual monthly grid with daily P&L, weekly totals, and session tracking. Spot losing streaks, revenge days, and your best sessions instantly.</p>
            <ul className="mt-6 space-y-3 text-sm text-white/60">
              {['Color-coded daily P&L — green wins, red losses', 'Weekly summary totals on every row', 'Click any day to see all trades and journal entries'].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-emerald-400">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5" data-reveal style={{ '--reveal-delay': '120ms' }}>
            {/* Fake P&L calendar */}
            <div className="mb-4 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">June 2026</span>
              <span className="text-xs text-emerald-300">+$2,847</span>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['M','T','W','T','F','S','S'].map((d, i) => (
                <div key={i} className="text-center font-mono text-[11px] text-white/40 pb-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {[
                null, null, '+$185', '-$90', '+$340', null, null,
                '+$220', '+$165', '-$45', '+$410', '-$120', null, null,
                '+$280', '-$195', '+$95', '+$375', '+$190', null, null,
                '+$145', '+$320', '-$80', '+$260', null, null, null,
              ].map((day, i) => {
                if (day === null) return <span key={i} className="h-10 rounded-lg bg-white/[0.02]" />;
                const isWin = day.startsWith('+');
                return (
                  <span key={i} className={`flex h-10 items-center justify-center rounded-lg text-[10px] font-mono font-semibold ${isWin ? 'bg-emerald-400/15 text-emerald-300' : 'bg-red-400/15 text-red-300'}`}>
                    {day}
                  </span>
                );
              })}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-white/8 pt-3 text-xs">
              <span className="text-white/40">16 trades · 11 wins · 5 losses</span>
              <span className="font-mono font-semibold text-emerald-300">68.7% WR</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ USP: WHAT MAKES US DIFFERENT ═══════════════ */}
      <section className="px-4 pt-20 pb-6 sm:px-10" data-reveal>
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/8 px-4 py-1.5 text-xs font-semibold text-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.85)]" />
            Features no other journal has
          </div>
          <h2 className="font-display text-2xl font-bold sm:text-3xl lg:text-4xl">
            Built for <span style={gradientText}>prop firm traders</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-white/55">
            PropLogAI tracks your entire prop firm journey — the expenses, the payouts, and the achievements.
          </p>
        </div>
      </section>

      {/* Showcase 4: Expense Tracker — mockup left, text right */}
      <section className="px-4 py-16 sm:px-10" data-reveal>
        <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-2">
          <div className="order-2 lg:order-1 rounded-2xl border border-white/10 bg-white/[0.03] p-5" data-reveal style={{ '--reveal-delay': '120ms' }}>
            {/* Fake expense tracker mockup */}
            <div className="mb-4 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">Expense Tracker</span>
              <div className="flex gap-1.5">
                {['Dashboard', 'Accounts', 'Payouts'].map((tab, i) => (
                  <span key={tab} className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold ${i === 0 ? 'bg-white/10 text-white/80' : 'text-white/30'}`}>{tab}</span>
                ))}
              </div>
            </div>
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: 'Total invested', val: '$4,470', color: 'text-white' },
                { label: 'Total payouts', val: '$8,240', color: 'text-emerald-400' },
                { label: 'Net ROI', val: '+84.3%', color: 'text-emerald-400' },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-white/8 bg-black/30 p-3">
                  <div className="font-mono text-[11px] uppercase tracking-wider text-white/30">{s.label}</div>
                  <div className={`mt-1 font-display text-sm font-bold ${s.color}`}>{s.val}</div>
                </div>
              ))}
            </div>
            {/* Accounts list */}
            <div className="rounded-xl border border-white/8 bg-black/20 p-4">
              <div className="font-mono text-[11px] uppercase tracking-wider text-white/30 mb-3">Accounts</div>
              <div className="space-y-2.5">
                {[
                  { firm: 'FTMO', size: '$200K', cost: '$1,080', status: 'Funded', sc: 'text-emerald-300 bg-emerald-400/12 border-emerald-400/20' },
                  { firm: 'TFT', size: '$100K', cost: '$590', status: 'Phase 2', sc: 'text-cyan-300 bg-cyan-400/12 border-cyan-400/20' },
                  { firm: 'MyFundedFx', size: '$50K', cost: '$350', status: 'Breached', sc: 'text-red-300 bg-red-400/12 border-red-400/20' },
                  { firm: 'FTMO', size: '$100K', cost: '$540', status: 'Funded', sc: 'text-emerald-300 bg-emerald-400/12 border-emerald-400/20' },
                ].map((acc, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-white/80">{acc.firm}</span>
                      <span className="font-mono text-[10px] text-white/30">{acc.size}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] text-white/40">{acc.cost}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${acc.sc}`}>{acc.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Latest payout */}
            <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-300/15 bg-emerald-300/8 p-3">
              <div>
                <div className="font-mono text-[11px] uppercase tracking-wider text-emerald-300/60">Latest payout</div>
                <div className="mt-0.5 text-sm font-bold text-emerald-300">$3,420 from FTMO</div>
              </div>
              <span className="text-xs text-emerald-300/50">Jun 15</span>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/8 px-3 py-1 text-[11px] font-semibold text-amber-200">
              Exclusive Feature
            </div>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Know your real ROI<br />across all prop firms</h2>
            <p className="mt-4 text-sm leading-relaxed text-white/55">Most traders have no idea how much they've actually spent on challenges. PropLogAI tracks every fee, renewal, activation, and payout — so you always know if prop trading is profitable for you.</p>
            <ul className="mt-6 space-y-3 text-sm text-white/60">
              {['Track challenge fees, activations & renewals per firm', 'Log payouts with dates and notes', 'See per-firm ROI — know which firms actually pay', 'No other trading journal does this'].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-amber-400">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Showcase 5: Verified Trading Story — text left, mockup right */}
      <section className="px-4 py-16 sm:px-10" data-reveal>
        <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-2">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/8 px-3 py-1 text-[11px] font-semibold text-cyan-200">
              Unique to PropLogAI
            </div>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Your verified<br />trading story</h2>
            <p className="mt-4 text-sm leading-relaxed text-white/55">Share a public profile that proves your trading results with real data — not screenshots that could be faked. P&L calendar, trade history, payouts, and certificates. All verifiable.</p>
            <ul className="mt-6 space-y-3 text-sm text-white/60">
              {['Public P&L calendar shows your consistency', 'Verified trade history with real numbers', 'Payout log proves you actually get paid', 'Trophy wall with payout certificates', 'You control exactly what\'s visible'].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-cyan-400">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5" data-reveal style={{ '--reveal-delay': '120ms' }}>
            {/* Fake public profile mockup */}
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full text-sm font-bold text-[#08080f]" style={gradientBtn}>M</div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">TraderMike</span>
                  <span className="rounded bg-emerald-400/15 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-emerald-300">Verified</span>
                </div>
                <span className="font-mono text-[10px] text-white/30">proplogai.com/profile/tmike</span>
              </div>
            </div>
            {/* Profile stats */}
            <div className="grid grid-cols-2 gap-2 mb-4 sm:grid-cols-4">
              {[
                { label: 'Win rate', val: '64%' },
                { label: 'Total P&L', val: '+$12.4K' },
                { label: 'Trades', val: '247' },
                { label: 'Payouts', val: '$8.2K' },
              ].map((s) => (
                <div key={s.label} className="rounded-lg border border-white/8 bg-black/30 p-2 text-center">
                  <div className="font-mono text-[8px] uppercase tracking-wider text-white/40">{s.label}</div>
                  <div className="mt-0.5 font-display text-[11px] font-bold text-emerald-300">{s.val}</div>
                </div>
              ))}
            </div>
            {/* Mini calendar */}
            <div className="rounded-xl border border-white/8 bg-black/20 p-3 mb-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-wider text-white/30">P&L Calendar</span>
                <span className="font-mono text-[11px] text-emerald-300">+$2,847</span>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {[
                  'g','r','g','g','','g','',
                  'g','g','r','g','r','','',
                  'g','g','g','r','g','','',
                ].map((d, i) => (
                  <span key={i} className={`h-4 rounded ${d === 'g' ? 'bg-emerald-400/30' : d === 'r' ? 'bg-red-400/30' : 'bg-white/[0.04]'}`} />
                ))}
              </div>
            </div>
            {/* Trophies */}
            <div className="rounded-xl border border-white/8 bg-black/20 p-3 mb-3">
              <div className="font-mono text-[11px] uppercase tracking-wider text-white/30 mb-2">Trophies</div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { icon: '🏆', label: 'FTMO Funded' },
                  { icon: '💰', label: '$3.4K Payout' },
                  { icon: '🏆', label: 'TFT Phase 2' },
                ].map((t, i) => (
                  <span key={i} className="rounded-lg border border-amber-400/15 bg-amber-400/8 px-2 py-1 text-[11px] text-amber-200">{t.icon} {t.label}</span>
                ))}
              </div>
            </div>
            {/* Verified payouts */}
            <div className="rounded-xl border border-emerald-300/12 bg-emerald-300/6 p-3">
              <div className="font-mono text-[11px] uppercase tracking-wider text-emerald-300/50 mb-2">Verified Payouts</div>
              <div className="space-y-1.5">
                {[
                  { firm: 'FTMO', amount: '+$3,420', date: 'Jun 15' },
                  { firm: 'TFT', amount: '+$2,180', date: 'May 28' },
                  { firm: 'FTMO', amount: '+$2,640', date: 'May 10' },
                ].map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-[10px]">
                    <span className="text-white/50">{p.firm}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-emerald-300">{p.amount}</span>
                      <span className="text-white/40">{p.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function clamp(value, min, max) {
  return Math.min(Math.max(Number.isFinite(value) ? value : min, min), max);
}

function toNumber(value, fallback) {
  const parsed = Number(String(value).replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function percentile(values, ratio) {
  if (!values.length) return 0;
  const index = Math.min(values.length - 1, Math.max(0, Math.round((values.length - 1) * ratio)));
  return values[index];
}

function formatSigned(value) {
  const rounded = Math.round(value);
  return `${rounded >= 0 ? '+' : '-'}${money.format(Math.abs(rounded))}`;
}

function Input({ label, value, onChange, prefix, suffix, hint, min = 0, max = 10000000, step = 1 }) {
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-xs uppercase tracking-wider text-white/55">{label}</span>
      <div className="flex items-center rounded-xl border border-white/10 bg-black/20 px-3 transition-colors focus-within:border-cyan-300/50">
        {prefix && <span className="mr-1 text-sm text-white/40">{prefix}</span>}
        <input
          aria-label={label}
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(clamp(toNumber(event.target.value, min), min, max))}
          className="w-full bg-transparent py-3 text-base font-semibold text-white outline-none"
        />
        {suffix && <span className="ml-2 text-sm text-white/45">{suffix}</span>}
      </div>
      {hint && <span className="mt-1.5 block text-xs text-white/45">{hint}</span>}
    </label>
  );
}

function Metric({ label, value, tone = 'white' }) {
  const colors = {
    white: 'text-white',
    green: 'text-emerald-400',
    cyan: 'text-cyan-300',
    amber: 'text-amber-300',
    red: 'text-red-400',
  };
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
      <p className="font-mono text-[10px] uppercase tracking-wider text-white/45">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${colors[tone]}`}>{value}</p>
    </div>
  );
}

function ChartTooltip({ active, payload, label, currency = false }) {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;
  return (
    <div className="rounded-lg border border-white/10 bg-[#11111b] px-3 py-2 shadow-xl">
      <p className="font-mono text-[10px] uppercase tracking-wider text-white/45">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{currency ? formatSigned(value) : value}</p>
    </div>
  );
}

export default function TraderSurvivalSimulator() {
  const [balance, setBalance] = useState(20000);
  const [drawdownMode, setDrawdownMode] = useState('dollar');
  const [drawdownValue, setDrawdownValue] = useState(2000);
  const [risk, setRisk] = useState(100);
  const [reward, setReward] = useState(200);
  const [tradesPerDay, setTradesPerDay] = useState(2);
  const [sessions, setSessions] = useState(22);
  const [winRate, setWinRate] = useState(30);
  const [simulations, setSimulations] = useState(1000);

  const data = useMemo(() => {
    const maxDrawdown = drawdownMode === 'percentage'
      ? balance * (drawdownValue / 100)
      : drawdownValue;
    const losingTrades = Math.floor(maxDrawdown / risk);
    const losingSessions = Math.floor(losingTrades / tradesPerDay);
    const totalTrades = sessions * tradesPerDay;
    const seed = Math.round(balance + maxDrawdown + risk * 17 + reward * 19 + winRate * 23 + simulations * 29 + sessions * 31 + tradesPerDay * 37);
    const random = seededRandom(seed);
    const outcomes = [];
    const streaks = [];
    const aggregateCurve = Array.from({ length: totalTrades + 1 }, () => 0);
    let worstObservedDrawdown = 0;

    for (let simulation = 0; simulation < simulations; simulation += 1) {
      let pnl = 0;
      let peak = 0;
      let currentStreak = 0;
      let longestStreak = 0;
      aggregateCurve[0] += 0;
      for (let trade = 1; trade <= totalTrades; trade += 1) {
        if (random() < winRate / 100) {
          pnl += reward;
          currentStreak = 0;
        } else {
          pnl -= risk;
          currentStreak += 1;
          longestStreak = Math.max(longestStreak, currentStreak);
        }
        peak = Math.max(peak, pnl);
        worstObservedDrawdown = Math.max(worstObservedDrawdown, peak - pnl);
        aggregateCurve[trade] += pnl;
      }
      outcomes.push(pnl);
      streaks.push(longestStreak);
    }

    outcomes.sort((a, b) => a - b);
    streaks.sort((a, b) => a - b);
    const average = outcomes.reduce((sum, value) => sum + value, 0) / outcomes.length;
    const positiveProbability = (outcomes.filter((value) => value > 0).length / outcomes.length) * 100;
    const median = percentile(outcomes, 0.5);
    const p5 = percentile(outcomes, 0.05);
    const p95 = percentile(outcomes, 0.95);
    const expectedStreak = streaks.reduce((sum, value) => sum + value, 0) / streaks.length;
    const minOutcome = outcomes[0];
    const maxOutcome = outcomes[outcomes.length - 1];
    const range = Math.max(1, maxOutcome - minOutcome);
    const bucketSize = Math.max(25, Math.ceil(range / 12 / 25) * 25);
    const histogram = Array.from({ length: 12 }, (_, index) => {
      const start = minOutcome + index * bucketSize;
      return { bucket: `${formatSigned(start)}`, count: 0, start };
    });
    outcomes.forEach((value) => {
      const index = Math.min(histogram.length - 1, Math.max(0, Math.floor((value - minOutcome) / bucketSize)));
      histogram[index].count += 1;
    });
    const averageCurve = aggregateCurve.map((sum, index) => ({
      day: index === 0 ? 0 : Math.ceil(index / tradesPerDay),
      value: sum / simulations,
    })).filter((point, index) => index === 0 || index % tradesPerDay === 0 || index === totalTrades);

    return {
      maxDrawdown,
      losingTrades,
      losingSessions,
      totalTrades,
      average,
      averageDaily: average / sessions,
      median,
      p5,
      p95,
      minOutcome,
      maxOutcome,
      positiveProbability,
      expectedStreak,
      worstStreak: streaks[streaks.length - 1],
      worstObservedDrawdown,
      histogram,
      averageCurve,
    };
  }, [balance, drawdownMode, drawdownValue, risk, reward, tradesPerDay, sessions, winRate, simulations]);

  const riskPercent = (risk / balance) * 100;
  const rewardPercent = (reward / balance) * 100;
  const dailyRisk = risk * tradesPerDay;
  const dailyTarget = reward * tradesPerDay;
  const health = data.losingTrades >= 30
    ? { label: 'Excellent', tone: 'green', stars: '★★★★★', note: 'Drawdown capacity covers 30 or more consecutive losing trades.' }
    : data.losingTrades >= 15
      ? { label: 'Moderate', tone: 'amber', stars: '★★★★☆', note: 'Drawdown capacity covers a meaningful losing sequence, but the margin is limited.' }
      : { label: 'High Risk', tone: 'red', stars: '★★☆☆☆', note: 'A short losing sequence could use most of the configured drawdown.' };
  const timelineDays = [1, Math.max(1, Math.ceil(data.losingSessions / 2)), Math.max(1, data.losingSessions - 2), data.losingSessions];
  const timelineStatus = (day) => {
    const used = Math.min(100, (day * tradesPerDay * risk / data.maxDrawdown) * 100);
    if (used >= 100) return { label: 'Account limit reached', tone: 'text-red-400', bar: 'bg-red-400' };
    if (used >= 70) return { label: 'Critical', tone: 'text-red-400', bar: 'bg-red-400' };
    if (used >= 40) return { label: 'Warning', tone: 'text-amber-300', bar: 'bg-amber-300' };
    return { label: 'Within drawdown', tone: 'text-emerald-400', bar: 'bg-emerald-400' };
  };
  const expectationIsPositive = data.average >= 0;

  return (
    <div className="pb-12">
      <section className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/5 text-3xl" aria-hidden="true">🛡</div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-300">Free risk simulator</p>
        <h1 className="mt-3 font-display text-3xl font-bold text-white md:text-4xl">Trader Survival Simulator</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/55 md:text-base">
          Explore drawdown capacity and simulated monthly outcomes from your own inputs. No login, trade import, or live account connection required.
        </p>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-cyan-300">01 — Risk setup</p>
                <h2 className="mt-1 text-xl font-semibold text-white">Account configuration</h2>
              </div>
              <div className="flex gap-2" aria-label="Account balance presets">
                {[10000, 20000, 50000, 100000].map((preset) => (
                  <button key={preset} type="button" onClick={() => setBalance(preset)} className={`rounded-lg border px-2.5 py-1.5 font-mono text-xs transition-colors ${balance === preset ? 'border-cyan-300/50 bg-cyan-300/10 text-cyan-200' : 'border-white/10 text-white/55 hover:border-white/25 hover:text-white'}`}>
                    {preset / 1000}k
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Account balance" value={balance} onChange={setBalance} prefix="$" min={100} />
              <div>
                <span className="mb-2 block font-mono text-xs uppercase tracking-wider text-white/55">Maximum drawdown</span>
                <div className="mb-2 flex rounded-lg border border-white/10 bg-black/20 p-1" role="radiogroup" aria-label="Drawdown type">
                  {['percentage', 'dollar'].map((mode) => (
                    <button key={mode} type="button" role="radio" aria-checked={drawdownMode === mode} onClick={() => setDrawdownMode(mode)} className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${drawdownMode === mode ? 'bg-white/10 text-white' : 'text-white/45 hover:text-white/75'}`}>
                      {mode === 'percentage' ? 'Percentage' : 'Dollar'}
                    </button>
                  ))}
                </div>
                <Input label="Drawdown value" value={drawdownValue} onChange={setDrawdownValue} prefix={drawdownMode === 'dollar' ? '$' : undefined} suffix={drawdownMode === 'percentage' ? '%' : undefined} hint={`Maximum amount the model treats as available drawdown: ${money.format(data.maxDrawdown)}.`} min={drawdownMode === 'percentage' ? 0.1 : 1} max={drawdownMode === 'percentage' ? 100 : balance} step={drawdownMode === 'percentage' ? 0.1 : 1} />
              </div>
              <Input label="Risk per trade" value={risk} onChange={setRisk} prefix="$" hint={`≈ ${riskPercent.toFixed(2)}% of account`} min={1} max={balance} />
              <Input label="Reward per winning trade" value={reward} onChange={setReward} prefix="$" hint={`Risk : Reward 1 : ${(reward / risk).toFixed(2)}`} min={1} max={balance * 10} />
              <Input label="Maximum trades per day" value={tradesPerDay} onChange={setTradesPerDay} min={1} max={20} />
              <Input label="Trading sessions per month" value={sessions} onChange={setSessions} hint="Default: 22" min={1} max={31} />
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/[0.09] to-cyan-500/[0.04] p-5 md:p-6">
            <p className="font-mono text-xs uppercase tracking-wider text-cyan-300">02 — Survival analysis</p>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
              <div>
                <h2 className="text-xl font-semibold text-white">Account survival</h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/55">If every simulated trade loses at the configured risk, this is the number of losses and full trading sessions before the configured drawdown is exhausted.</p>
              </div>
              <div className="rounded-2xl border border-cyan-300/20 bg-black/20 px-5 py-3 text-right">
                <p className="font-mono text-[10px] uppercase tracking-wider text-white/45">Losses remaining</p>
                <p className="mt-1 text-3xl font-bold text-cyan-200">{data.losingTrades}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Metric label="Consecutive losing trades" value={data.losingTrades} tone="cyan" />
              <Metric label="Full losing sessions" value={data.losingSessions} tone="cyan" />
            </div>

            <div className="mt-6 space-y-3" aria-label="Drawdown timeline">
              {timelineDays.map((day, index) => {
                const status = timelineStatus(day);
                const used = Math.min(100, (day * tradesPerDay * risk / data.maxDrawdown) * 100);
                return (
                  <div key={`${day}-${index}`} className="grid grid-cols-[62px_1fr_auto] items-center gap-3">
                    <span className="font-mono text-xs text-white/55">Day {day}</span>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full ${status.bar}`} style={{ width: `${used}%` }} /></div>
                    <span className={`text-xs font-medium ${status.tone}`}>{status.label}</span>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-start gap-3"><span className="mt-0.5 text-xl" aria-hidden="true">◌</span><div><p className="font-medium text-white">A loss streak is a normal part of a random sequence.</p><p className="mt-1 text-sm leading-relaxed text-white/55">The simulator shows that your configured drawdown can absorb {data.losingTrades} consecutive losses. That capacity is a risk boundary, not a prediction or a recommendation to keep trading.</p></div></div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div><p className="font-mono text-xs uppercase tracking-wider text-cyan-300">03 — Monte Carlo projection</p><h2 className="mt-1 text-xl font-semibold text-white">Illustrative monthly outcomes</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">Each run samples {data.totalTrades} trades across {sessions} sessions using the inputs below. The results are a statistical illustration, not an estimate of future profitability.</p></div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-1" role="radiogroup" aria-label="Number of simulations">
                {[500, 1000, 5000].map((count) => <button key={count} type="button" role="radio" aria-checked={simulations === count} onClick={() => setSimulations(count)} className={`rounded-lg px-3 py-2 font-mono text-xs transition-colors ${simulations === count ? 'bg-cyan-300/10 text-cyan-200' : 'text-white/45 hover:text-white'}`}>{count.toLocaleString()}</button>)}
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Input label="Win rate" value={winRate} onChange={setWinRate} suffix="%" min={0} max={100} step={0.1} />
              <Metric label="Trades in simulation" value={data.totalTrades} />
              <Metric label="Simulations" value={simulations.toLocaleString()} />
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Metric label="Average simulated daily outcome" value={formatSigned(data.averageDaily)} tone={expectationIsPositive ? 'green' : 'red'} />
              <Metric label="Average simulated monthly outcome" value={formatSigned(data.average)} tone={expectationIsPositive ? 'green' : 'red'} />
              <Metric label="Positive simulated months" value={`${data.positiveProbability.toFixed(0)}%`} tone={data.positiveProbability >= 50 ? 'green' : 'amber'} />
              <Metric label="5th–95th percentile" value={`${formatSigned(data.p5)} to ${formatSigned(data.p95)}`} />
              <Metric label="Expected longest loss streak" value={`${data.expectedStreak.toFixed(1)} trades`} tone="amber" />
              <Metric label="Worst observed loss streak" value={`${data.worstStreak} trades`} tone="amber" />
            </div>

            <div className="mt-7 grid gap-5 lg:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-black/20 p-4"><div className="mb-4"><h3 className="font-semibold text-white">Average simulated equity path</h3><p className="mt-1 text-xs text-white/45">Average cumulative P/L across all simulations</p></div><div className="h-56" role="img" aria-label="Average simulated equity curve"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data.averageCurve}><defs><linearGradient id="equityGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#22d3ee" stopOpacity={0.35} /><stop offset="100%" stopColor="#22d3ee" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} /><XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }} tickLine={false} axisLine={false} /><YAxis tickFormatter={(value) => `$${Math.round(value)}`} tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }} tickLine={false} axisLine={false} width={56} /><Tooltip content={<ChartTooltip currency />} /><Area type="monotone" dataKey="value" stroke="#22d3ee" fill="url(#equityGradient)" strokeWidth={2} /></AreaChart></ResponsiveContainer></div></div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4"><div className="mb-4"><h3 className="font-semibold text-white">Monthly outcome distribution</h3><p className="mt-1 text-xs text-white/45">Frequency across {simulations.toLocaleString()} simulated months</p></div><div className="h-56" role="img" aria-label="Histogram of simulated monthly outcomes"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.histogram}><CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} /><XAxis dataKey="bucket" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" /><YAxis tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }} tickLine={false} axisLine={false} width={34} /><Tooltip content={<ChartTooltip />} /><Bar dataKey="count" fill="#a78bfa" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></div>
            </div>

            <div className="mt-6 rounded-xl border border-cyan-300/15 bg-cyan-300/[0.04] p-4"><p className="font-mono text-[10px] uppercase tracking-wider text-cyan-200">Simulation reading</p><p className="mt-2 text-sm leading-relaxed text-white/75">{expectationIsPositive ? `With these inputs, the average simulated month is positive, but losing streaks remain present in the sample. The model observed a longest streak of ${data.worstStreak} losses.` : `With these inputs, the average simulated month is negative. A ${winRate}% win rate needs a larger average reward, a higher win rate, or a different input assumption before the simulated average turns positive.`} The range between the 5th and 95th percentiles highlights uncertainty rather than a promised result.</p></div>
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-5 lg:self-start">
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><p className="font-mono text-xs uppercase tracking-wider text-cyan-300">Live risk summary</p><div className="mt-4 grid grid-cols-2 gap-3"><Metric label="Daily risk" value={money.format(dailyRisk)} tone="red" /><Metric label="Daily reward if all win" value={money.format(dailyTarget)} tone="green" /><Metric label="Risk %" value={`${riskPercent.toFixed(2)}%`} /><Metric label="Reward %" value={`${rewardPercent.toFixed(2)}%`} /></div></section>
          <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.015] p-5"><p className="font-mono text-xs uppercase tracking-wider text-cyan-300">Overall account health</p><div className="mt-4 flex items-end justify-between"><div><p className={`text-3xl font-bold ${health.tone === 'green' ? 'text-emerald-400' : health.tone === 'amber' ? 'text-amber-300' : 'text-red-400'}`}>{health.label}</p><p className="mt-1 text-lg tracking-[0.18em] text-amber-300" aria-label={`${health.label} health rating`}>{health.stars}</p></div><span className="text-3xl" aria-hidden="true">◈</span></div><p className="mt-4 text-sm leading-relaxed text-white/55">{health.note}</p><div className="mt-5 space-y-3 border-t border-white/10 pt-4"><div className="flex justify-between gap-3 text-sm"><span className="text-white/55">Maximum losing trades</span><span className="font-semibold text-white">{data.losingTrades}</span></div><div className="flex justify-between gap-3 text-sm"><span className="text-white/55">Maximum losing sessions</span><span className="font-semibold text-white">{data.losingSessions}</span></div><div className="flex justify-between gap-3 text-sm"><span className="text-white/55">Average monthly outcome</span><span className={expectationIsPositive ? 'font-semibold text-emerald-400' : 'font-semibold text-red-400'}>{formatSigned(data.average)}</span></div><div className="flex justify-between gap-3 text-sm"><span className="text-white/55">Positive simulations</span><span className="font-semibold text-white">{data.positiveProbability.toFixed(0)}%</span></div></div></section>
          <section className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.05] p-5"><p className="font-semibold text-white">Want live tracking?</p><p className="mt-2 text-sm leading-relaxed text-white/55">Log your trades in PropLogAI to keep your own review and risk evidence in one place.</p><Link href="/login" className="mt-5 block rounded-xl px-4 py-3 text-center text-sm font-semibold text-[#08080f] transition-transform hover:scale-[1.01] active:scale-[0.99]" style={{ background: 'linear-gradient(120deg, #a78bfa, #22d3ee)' }}>Start Free →</Link></section>
        </aside>
      </div>

      <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-relaxed text-white/45">Educational simulation only. It does not use your live trading data, predict returns, or provide trading, investment, or risk advice. Real prop-firm rules and drawdown calculations vary by firm.</p>
    </div>
  );
}

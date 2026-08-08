'use client';
import { useMemo, useState } from 'react';

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

function toNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function Field({ label, value, setValue, prefix, suffix, step = 1, min = 0, max = 100000000, note, placeholder = '0' }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-2 block font-mono text-xs uppercase tracking-wider text-white/55">
          {label}
        </span>
      )}
      <div className="flex items-center rounded-xl border border-white/10 bg-white/5 px-3 transition-colors focus-within:border-violet-500/50 focus-within:ring-1 focus-within:ring-violet-500/30">
        {prefix && <span className="mr-1 font-mono text-white/40">{prefix}</span>}
        <input
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent py-3 text-base font-semibold text-white placeholder-white/30 outline-none"
        />
        {suffix && <span className="ml-2 font-mono text-white/40">{suffix}</span>}
      </div>
      {note && <span className="mt-1.5 block text-xs text-white/40">{note}</span>}
    </label>
  );
}

/* --- Session progression visual --- */
function SessionProgression({ sessions, dailyRisk, drawdown }) {
  const steps = [];
  const show = Math.min(sessions, 10);
  for (let i = 1; i <= show; i++) steps.push(i);
  const skipped = sessions > 10;

  return (
    <div className="mt-5 space-y-1.5">
      <p className="font-mono text-[10px] uppercase tracking-wider text-white/45">
        Drawdown consumed per losing session
      </p>
      <div className="space-y-1">
        {steps.map((s) => {
          const consumed = dailyRisk * s;
          const pct = Math.min((consumed / drawdown) * 100, 100);
          const isLast = s === sessions;
          return (
            <div key={s} className="flex items-center gap-3">
              <span className="w-16 shrink-0 text-right font-mono text-xs text-white/45">
                Day {s}
              </span>
              <div className="relative h-5 flex-1 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(pct, 2)}%`,
                    background: isLast
                      ? 'linear-gradient(90deg, #f87171, #ef4444)'
                      : 'linear-gradient(90deg, #a78bfa, #22d3ee)',
                  }}
                />
              </div>
              <span className={`w-20 shrink-0 font-mono text-xs ${isLast ? 'font-bold text-red-400' : 'text-white/50'}`}>
                -{usd.format(consumed)}
              </span>
            </div>
          );
        })}
        {skipped && (
          <>
            <div className="flex items-center gap-3">
              <span className="w-16 shrink-0 text-right font-mono text-xs text-white/30">...</span>
              <div className="flex-1" />
              <span className="w-20 shrink-0" />
            </div>
            <div className="flex items-center gap-3">
              <span className="w-16 shrink-0 text-right font-mono text-xs text-white/45">
                Day {sessions}
              </span>
              <div className="relative h-5 flex-1 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: '100%',
                    background: 'linear-gradient(90deg, #f87171, #ef4444)',
                  }}
                />
              </div>
              <span className="w-20 shrink-0 font-mono text-xs font-bold text-red-400">
                -{usd.format(drawdown)}
              </span>
            </div>
          </>
        )}
      </div>
      <p className="mt-1 text-center font-mono text-[10px] text-white/35">
        {sessions} sessions &times; {usd.format(dailyRisk)} = {usd.format(drawdown)} drawdown limit
      </p>
    </div>
  );
}

export default function AccountSurvivalCalculator() {
  /* --- Mode --- */
  const [mode, setMode] = useState('target'); // 'target' = risk for X sessions, 'risk' = survival at my risk

  /* --- Shared inputs --- */
  const [size, setSize] = useState('50000');
  const [ddMode, setDdMode] = useState('dollar');
  const [ddDollar, setDdDollar] = useState('2000');
  const [ddPercent, setDdPercent] = useState('4');

  /* --- Mode A: target sessions --- */
  const [targetSessions, setTargetSessions] = useState('20');

  /* --- Mode B: known daily risk --- */
  const [knownRisk, setKnownRisk] = useState('200');

  /* --- Optional trades --- */
  const [showTrades, setShowTrades] = useState(false);
  const [tradesPerSession, setTradesPerSession] = useState('2');

  const account = Math.max(toNum(size), 0.01);
  const drawdown =
    ddMode === 'percent'
      ? Math.min(account * toNum(ddPercent) / 100, account)
      : Math.min(toNum(ddDollar), account);
  const drawdownPct = (drawdown / account) * 100;
  const trades = Math.max(Math.floor(toNum(tradesPerSession, 1)), 1);

  const result = useMemo(() => {
    if (mode === 'target') {
      const sessions = Math.max(Math.floor(toNum(targetSessions, 1)), 1);
      const dailyRisk = drawdown / sessions;
      const dailyPct = (dailyRisk / account) * 100;
      const perTrade = dailyRisk / trades;
      const perTradePct = (perTrade / account) * 100;
      return { sessions, dailyRisk, dailyPct, perTrade, perTradePct };
    } else {
      const dailyRisk = Math.max(toNum(knownRisk), 0.01);
      const sessions = Math.floor(drawdown / dailyRisk);
      const dailyPct = (dailyRisk / account) * 100;
      const perTrade = dailyRisk / trades;
      const perTradePct = (perTrade / account) * 100;
      return { sessions, dailyRisk, dailyPct, perTrade, perTradePct };
    }
  }, [mode, targetSessions, knownRisk, drawdown, account, trades]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-white md:text-3xl">
          Prop Firm Survival Calculator
        </h1>
        <p className="mt-2 text-sm text-white/55 md:text-base">
          Calculate how much you can risk per day or per trade based on your
          prop firm&rsquo;s maximum drawdown and how many losing sessions you want
          your account to survive.
        </p>
      </div>

      {/* Mode toggle */}
      <div>
        <label className="font-mono text-xs uppercase tracking-wider text-white/55">
          What do you want to calculate?
        </label>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => setMode('target')}
            className={`rounded-xl border px-4 py-2.5 text-sm transition-all ${
              mode === 'target'
                ? 'border-transparent font-semibold text-[#08080f]'
                : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
            }`}
            style={
              mode === 'target'
                ? { background: 'linear-gradient(120deg, #a78bfa, #22d3ee)' }
                : undefined
            }
          >
            Risk for X sessions
          </button>
          <button
            type="button"
            onClick={() => setMode('risk')}
            className={`rounded-xl border px-4 py-2.5 text-sm transition-all ${
              mode === 'risk'
                ? 'border-transparent font-semibold text-[#08080f]'
                : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
            }`}
            style={
              mode === 'risk'
                ? { background: 'linear-gradient(120deg, #a78bfa, #22d3ee)' }
                : undefined
            }
          >
            Survival at my risk
          </button>
        </div>
      </div>

      {/* Inputs card */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Account size */}
          <Field
            label="Account size"
            value={size}
            setValue={setSize}
            prefix="$"
            placeholder="50000"
            note="Your prop firm account size."
          />

          {/* Maximum drawdown */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-wider text-white/55">
                Maximum drawdown
              </span>
              <div className="flex rounded-lg border border-white/10 p-0.5">
                <button
                  type="button"
                  onClick={() => setDdMode('dollar')}
                  className={`rounded px-3 py-1 text-xs transition-all ${
                    ddMode === 'dollar'
                      ? 'bg-white/10 font-semibold text-white'
                      : 'text-white/45 hover:text-white/70'
                  }`}
                >
                  $
                </button>
                <button
                  type="button"
                  onClick={() => setDdMode('percent')}
                  className={`rounded px-3 py-1 text-xs transition-all ${
                    ddMode === 'percent'
                      ? 'bg-white/10 font-semibold text-white'
                      : 'text-white/45 hover:text-white/70'
                  }`}
                >
                  %
                </button>
              </div>
            </div>
            {ddMode === 'dollar' ? (
              <Field label="" value={ddDollar} setValue={setDdDollar} prefix="$" placeholder="2000" />
            ) : (
              <Field label="" value={ddPercent} setValue={setDdPercent} suffix="%" step={0.1} max={100} placeholder="4" />
            )}
            <p className="mt-1.5 text-xs text-white/40">
              {usd.format(drawdown)} &mdash; {drawdownPct.toFixed(1)}% of account
            </p>
          </div>
        </div>

        {/* Mode-specific input */}
        <div className="mt-5">
          {mode === 'target' ? (
            <Field
              label="I want to survive"
              value={targetSessions}
              setValue={setTargetSessions}
              suffix="trading sessions"
              min={1}
              max={10000}
              placeholder="20"
              note="How many consecutive fully losing trading sessions do you want your drawdown to withstand?"
            />
          ) : (
            <Field
              label="My planned daily risk"
              value={knownRisk}
              setValue={setKnownRisk}
              prefix="$"
              placeholder="200"
              note="Enter your maximum planned loss per trading session."
            />
          )}
        </div>

        {/* Optional trades per session */}
        <div className="mt-5 border-t border-white/10 pt-5">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={showTrades}
              onChange={(e) => setShowTrades(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-white/5 text-violet-500 focus:ring-violet-500/30"
            />
            <span className="text-sm text-white/70">Calculate per-trade risk</span>
          </label>

          {showTrades && (
            <div className="mt-3 max-w-xs">
              <Field
                label="Trades per session"
                value={tradesPerSession}
                setValue={setTradesPerSession}
                min={1}
                max={100}
                placeholder="2"
              />
            </div>
          )}
        </div>
      </div>

      {/* Result card — dollar amount is the hero */}
      {drawdown > 0 && result.sessions > 0 && (
        <div className="animate-[fadeIn_0.3s_ease-out] rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/[0.08] to-cyan-500/[0.04] p-6 text-center md:p-8">
          <p className="font-mono text-xs uppercase tracking-[.18em] text-white/50">
            Your survival plan
          </p>

          {/* Hero: daily risk amount */}
          <p className="mt-4 text-base text-white/60">
            You can risk up to
          </p>
          <p className="mt-1 font-mono text-5xl font-bold text-white md:text-6xl">
            {usd.format(result.dailyRisk)}
          </p>
          <p className="mt-1 text-lg text-white/60">
            per session
          </p>
          <p className="mt-1 font-mono text-sm text-cyan-300">
            {result.dailyPct.toFixed(2)}% of your account
          </p>

          {/* Context sentence */}
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/50">
            To withstand{' '}
            <span className="font-semibold text-white/80">{result.sessions} consecutive full-loss sessions</span>{' '}
            within your{' '}
            <span className="font-semibold text-white/80">{usd.format(drawdown)}</span>{' '}
            drawdown.
          </p>

          {/* Per-trade risk */}
          {showTrades && (
            <div className="mx-auto mt-5 max-w-sm rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm text-white/50">
                With {trades} trades per session
              </p>
              <p className="mt-1 font-mono text-3xl font-bold text-violet-400">
                {usd.format(result.perTrade)}
              </p>
              <p className="mt-0.5 text-sm text-white/50">
                per trade
              </p>
              <p className="mt-0.5 font-mono text-xs text-white/40">
                {result.perTradePct.toFixed(2)}% of account
              </p>
            </div>
          )}

          {/* Summary details */}
          <div className="mx-auto mt-6 max-w-sm space-y-1 text-xs text-white/45">
            <div className="flex justify-between">
              <span>Drawdown capacity</span>
              <span className="font-mono text-white/60">{usd.format(drawdown)} ({drawdownPct.toFixed(1)}%)</span>
            </div>
            <div className="flex justify-between">
              <span>Survival target</span>
              <span className="font-mono text-white/60">{result.sessions} sessions</span>
            </div>
            {showTrades && (
              <div className="flex justify-between">
                <span>Trades per session</span>
                <span className="font-mono text-white/60">{trades}</span>
              </div>
            )}
          </div>

          {/* Session progression visual */}
          <SessionProgression
            sessions={result.sessions}
            dailyRisk={result.dailyRisk}
            drawdown={drawdown}
          />
        </div>
      )}

      {/* Disclaimer */}
      <p className="px-1 text-xs leading-relaxed text-white/35">
        This is a mathematical risk-capacity calculation, not a prediction of
        trading performance. It assumes every selected session reaches the full
        planned loss.
      </p>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        input[type='number']::-webkit-outer-spin-button,
        input[type='number']::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type='number'] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
}

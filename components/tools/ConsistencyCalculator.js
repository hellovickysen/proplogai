'use client';
import { useMemo, useRef, useState } from 'react';

const LIMIT_PRESETS = [20, 25, 30];

function fmtCurrency(n) {
  if (!Number.isFinite(n)) return '$0.00';
  return (
    '$' +
    n.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function fmtPct(n, digits = 2) {
  if (!Number.isFinite(n)) return '0.00%';
  return n.toFixed(digits) + '%';
}

function toNumber(v) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

export default function ConsistencyCalculator() {
  const [totalProfit, setTotalProfit] = useState('');
  const [largestWin, setLargestWin] = useState('');
  const [limitChoice, setLimitChoice] = useState('20');
  const [customLimit, setCustomLimit] = useState('');
  const [nextWin, setNextWin] = useState('');
  const [copied, setCopied] = useState(false);

  const resultsRef = useRef(null);

  const limit = useMemo(() => {
    if (limitChoice === 'custom') {
      const n = toNumber(customLimit);
      return n > 0 ? n : 0;
    }
    return toNumber(limitChoice);
  }, [limitChoice, customLimit]);

  const totalProfitNum = toNumber(totalProfit);
  const largestWinNum = toNumber(largestWin);

  const hasValidInputs =
    totalProfitNum > 0 && largestWinNum > 0 && limit > 0;

  const calc = useMemo(() => {
    if (!hasValidInputs) return null;

    const consistencyPct = (largestWinNum / totalProfitNum) * 100;
    const requiredProfit = largestWinNum / (limit / 100);
    const additionalNeeded = Math.max(requiredProfit - totalProfitNum, 0);
    const isEligible = consistencyPct <= limit;
    const progressPct = Math.min(
      (totalProfitNum / requiredProfit) * 100,
      100
    );

    let zone = 'green';
    if (consistencyPct > limit + 5) zone = 'red';
    else if (consistencyPct > limit) zone = 'amber';

    return {
      consistencyPct,
      requiredProfit,
      additionalNeeded,
      isEligible,
      progressPct,
      zone,
    };
  }, [hasValidInputs, largestWinNum, totalProfitNum, limit]);

  const nextWinNum = toNumber(nextWin);
  const whatIf = useMemo(() => {
    if (!calc || calc.isEligible || nextWinNum <= 0) return null;

    const futureProfit = totalProfitNum + nextWinNum;
    const futureLargestWin = Math.max(largestWinNum, nextWinNum);
    const futureConsistency = (futureLargestWin / futureProfit) * 100;
    const futureEligible = futureConsistency <= limit;

    return {
      futureProfit,
      futureLargestWin,
      futureConsistency,
      futureEligible,
    };
  }, [calc, nextWinNum, totalProfitNum, largestWinNum, limit]);

  const zoneColor = {
    green: '#34d399',
    amber: '#fbbf24',
    red: '#f87171',
  };

  const progressGradient = calc?.isEligible
    ? 'linear-gradient(90deg, #a78bfa, #22d3ee)'
    : calc?.zone === 'red'
    ? 'linear-gradient(90deg, #fbbf24, #f87171)'
    : 'linear-gradient(90deg, #a78bfa, #fbbf24)';

  const handleCalculateClick = () => {
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCopy = () => {
    if (!calc) return;
    const lines = [
      'Consistency Calculator Result',
      `Total Profit: ${fmtCurrency(totalProfitNum)}`,
      `Largest Winner: ${fmtCurrency(largestWinNum)}`,
      `Consistency: ${fmtPct(calc.consistencyPct)}`,
      `Status: ${
        calc.isEligible ? 'Ready for Payout ✅' : 'More Profit Required ❌'
      }`,
      `Rule: ${fmtPct(limit, 0)}`,
      '— PropLogAI (proplogai.com)',
    ];
    const text = lines.join('\n');

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-white md:text-3xl">
          Consistency Calculator
        </h1>
        <p className="mt-2 text-sm text-white/55 md:text-base">
          Check if your largest winning trade satisfies the consistency rule
          before requesting a payout.
        </p>
      </div>

      {/* Inputs Card */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Total Closed Profit */}
          <div>
            <label className="font-mono text-xs uppercase tracking-wider text-white/55">
              Total Closed Profit
            </label>
            <div className="relative mt-2">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-mono text-white/40">
                $
              </span>
              <input
                type="number"
                inputMode="decimal"
                value={totalProfit}
                onChange={(e) => setTotalProfit(e.target.value)}
                placeholder="776.40"
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-8 pr-4 font-mono text-white placeholder-white/30 transition-colors focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
              />
            </div>
            <p className="mt-1.5 text-xs text-white/40">Example: $1,365</p>
          </div>

          {/* Largest Winning Trade */}
          <div>
            <label className="font-mono text-xs uppercase tracking-wider text-white/55">
              Largest Winning Trade
            </label>
            <div className="relative mt-2">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-mono text-white/40">
                $
              </span>
              <input
                type="number"
                inputMode="decimal"
                value={largestWin}
                onChange={(e) => setLargestWin(e.target.value)}
                placeholder="265.80"
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-8 pr-4 font-mono text-white placeholder-white/30 transition-colors focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
              />
            </div>
            <p className="mt-1.5 text-xs leading-snug text-white/40">
              Your single largest winning trade, not largest day or position.
              Example: $265
            </p>
          </div>
        </div>

        {/* Consistency Limit */}
        <div className="mt-5">
          <label className="font-mono text-xs uppercase tracking-wider text-white/55">
            Consistency Limit
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {LIMIT_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setLimitChoice(String(preset))}
                className={`rounded-xl border px-4 py-2.5 font-mono text-sm transition-all ${
                  limitChoice === String(preset)
                    ? 'border-transparent text-[#08080f]'
                    : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                }`}
                style={
                  limitChoice === String(preset)
                    ? {
                        background:
                          'linear-gradient(120deg, #a78bfa, #22d3ee)',
                      }
                    : undefined
                }
              >
                {preset}%
              </button>
            ))}
            <button
              type="button"
              onClick={() => setLimitChoice('custom')}
              className={`rounded-xl border px-4 py-2.5 font-mono text-sm transition-all ${
                limitChoice === 'custom'
                  ? 'border-transparent text-[#08080f]'
                  : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
              }`}
              style={
                limitChoice === 'custom'
                  ? { background: 'linear-gradient(120deg, #a78bfa, #22d3ee)' }
                  : undefined
              }
            >
              Custom
            </button>
          </div>

          {limitChoice === 'custom' && (
            <div className="relative mt-3 max-w-[160px]">
              <input
                type="number"
                inputMode="decimal"
                value={customLimit}
                onChange={(e) => setCustomLimit(e.target.value)}
                placeholder="15"
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-4 pr-9 font-mono text-white placeholder-white/30 transition-colors focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-mono text-white/40">
                %
              </span>
            </div>
          )}
        </div>

        {/* Mobile calculate button */}
        <button
          type="button"
          onClick={handleCalculateClick}
          className="mt-5 w-full rounded-xl py-3 font-display text-sm font-semibold text-[#08080f] transition-transform active:scale-[0.98] md:hidden"
          style={{ background: 'linear-gradient(120deg, #a78bfa, #22d3ee)' }}
        >
          Calculate
        </button>
      </div>

      {/* Results */}
      <div ref={resultsRef} className="scroll-mt-6">
        {hasValidInputs && calc && (
          <div className="animate-[fadeIn_0.3s_ease-out] space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
              {/* Hero status */}
              <div className="text-center md:text-left">
                <p
                  className="text-2xl font-bold md:text-3xl"
                  style={{
                    color: calc.isEligible ? '#34d399' : '#f87171',
                  }}
                >
                  {calc.isEligible
                    ? '✅ Ready for Payout'
                    : '❌ More Profit Required'}
                </p>
                <p
                  className="mt-2 font-mono text-lg"
                  style={{ color: zoneColor[calc.zone] }}
                >
                  Current Consistency: {fmtPct(calc.consistencyPct)}
                </p>
                <p className="mt-1 text-sm text-white/55">
                  {calc.isEligible ? (
                    <>You satisfy the {fmtPct(limit, 0)} consistency rule.</>
                  ) : (
                    <>
                      Need another {fmtCurrency(calc.additionalNeeded)}{' '}
                      profit to meet the {fmtPct(limit, 0)} rule.
                    </>
                  )}
                </p>
              </div>

              {/* Required / Remaining */}
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <p className="font-mono text-xs uppercase tracking-wider text-white/55">
                    Required Total Closed Profit
                  </p>
                  <p className="mt-1 font-mono text-xl font-semibold text-white">
                    {fmtCurrency(calc.requiredProfit)}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <p className="font-mono text-xs uppercase tracking-wider text-white/55">
                    Remaining Profit Needed
                  </p>
                  <p
                    className="mt-1 font-mono text-xl font-semibold"
                    style={{
                      color: calc.isEligible ? '#34d399' : '#fbbf24',
                    }}
                  >
                    {calc.isEligible
                      ? '$0.00'
                      : fmtCurrency(calc.additionalNeeded)}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-6">
                <p className="font-mono text-xs uppercase tracking-wider text-white/55 mb-2">
                  Progress toward required profit
                </p>
                <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full transition-[width] duration-700 ease-out"
                    style={{
                      width: `${Math.max(calc.progressPct, 2)}%`,
                      background: progressGradient,
                    }}
                  />
                </div>
                <p className="mt-2 text-center font-mono text-xs text-white/50">
                  {fmtCurrency(totalProfitNum)} of{' '}
                  {fmtCurrency(calc.requiredProfit)}
                </p>
              </div>

              {/* Contextual message */}
              <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-sm leading-relaxed text-white/70">
                  {calc.isEligible ? (
                    <>
                      Congratulations! Your account satisfies the{' '}
                      <span className="font-mono text-white">
                        {fmtPct(limit, 0)}
                      </span>{' '}
                      consistency requirement. You may be eligible to request
                      a payout.
                    </>
                  ) : (
                    <>
                      Your largest winning trade is still contributing too
                      much to your total profit. Continue trading your normal
                      risk until your total closed profit reaches
                      approximately{' '}
                      <span className="font-mono text-white">
                        {fmtCurrency(calc.requiredProfit)}
                      </span>
                      .
                    </>
                  )}
                </p>

                <button
                  onClick={handleCopy}
                  className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-mono text-xs text-white/60 transition-all hover:bg-white/10 hover:text-white"
                >
                  {copied ? '✓ Copied!' : '📋 Copy Result'}
                </button>
              </div>
            </div>

            {/* What If Simulator */}
            {!calc.isEligible && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
                <h2 className="font-display text-lg font-semibold text-white">
                  🔮 What If Simulator
                </h2>
                <p className="mt-1 text-sm text-white/55">
                  See how your next winning trade would affect your
                  consistency.
                </p>

                <div className="mt-4">
                  <label className="font-mono text-xs uppercase tracking-wider text-white/55">
                    Next Winning Trade
                  </label>
                  <div className="relative mt-2 max-w-xs">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-mono text-white/40">
                      $
                    </span>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={nextWin}
                      onChange={(e) => setNextWin(e.target.value)}
                      placeholder="150"
                      className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-8 pr-4 font-mono text-white placeholder-white/30 transition-colors focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
                    />
                  </div>
                </div>

                {whatIf && (
                  <div className="mt-5 animate-[fadeIn_0.3s_ease-out] rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <p className="font-mono text-xs uppercase tracking-wider text-white/55">
                          Future Consistency
                        </p>
                        <p
                          className="mt-1 font-mono text-2xl font-bold"
                          style={{
                            color: whatIf.futureEligible
                              ? '#34d399'
                              : whatIf.futureConsistency > limit + 5
                              ? '#f87171'
                              : '#fbbf24',
                          }}
                        >
                          {fmtPct(whatIf.futureConsistency)}
                        </p>
                      </div>
                      <div className="flex items-center sm:justify-end">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-xs font-medium ${
                            whatIf.futureEligible
                              ? 'border-[#34d399]/30 bg-[#34d399]/10 text-[#34d399]'
                              : 'border-[#f87171]/30 bg-[#f87171]/10 text-[#f87171]'
                          }`}
                        >
                          {whatIf.futureEligible
                            ? '✅ Would Be Payout Ready'
                            : '❌ Still More Profit Required'}
                        </span>
                      </div>
                    </div>

                    <p className="mt-3 text-sm leading-relaxed text-white/60">
                      After this trade, your total profit would be{' '}
                      <span className="font-mono text-white">
                        {fmtCurrency(whatIf.futureProfit)}
                      </span>{' '}
                      with a largest win of{' '}
                      <span className="font-mono text-white">
                        {fmtCurrency(whatIf.futureLargestWin)}
                      </span>
                      {whatIf.futureEligible
                        ? ', putting you within the consistency limit. '
                        : ', which is still above the consistency limit. '}
                      {whatIf.futureEligible
                        ? 'This trade alone could unlock payout eligibility.'
                        : "You'll need additional profit beyond this trade before requesting a payout."}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Explanation Section */}
      <ExplanationSection limit={limit} />

      {/* Disclaimer */}
      <p className="text-xs text-white/35 leading-relaxed px-1">
        Note: This calculator uses the largest single winning trade method.
        Some prop firms may calculate consistency differently (e.g., largest
        trading day, largest position). Always verify your firm's specific
        payout rules before requesting a withdrawal.
      </p>

      {/* FAQ Section */}
      <FAQSection />

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

function ExplanationSection({ limit }) {
  const [open, setOpen] = useState(false);
  const exampleLimit = limit > 0 ? limit : 20;
  const exampleLargest = 200;
  const exampleRequired = exampleLargest / (exampleLimit / 100);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="font-display text-base font-semibold text-white">
          How is consistency calculated?
        </span>
        <span
          className={`font-mono text-white/50 transition-transform duration-300 ${
            open ? 'rotate-180' : ''
          }`}
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="mt-4 animate-[fadeIn_0.25s_ease-out] space-y-4 text-sm leading-relaxed text-white/65">
          <p>
            Most prop firms require that no single winning trade represents
            more than a set percentage of your total closed profit. This
            keeps payouts backed by consistent trading rather than one lucky
            trade.
          </p>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 font-mono text-xs text-white/70">
            consistency % = (largest winning trade / total closed profit) ×
            100
            <br />
            required profit = largest winning trade / (limit / 100)
          </div>

          <p>
            <span className="text-white/85">Example:</span> with a{' '}
            {fmtPct(exampleLimit, 0)} consistency limit and a largest winning
            trade of {fmtCurrency(exampleLargest)}, you'd need total closed
            profit of at least {fmtCurrency(exampleRequired)} for that trade
            to represent {fmtPct(exampleLimit, 0)} or less of your total.
          </p>

          <div>
            <p className="mb-2 text-white/85">Color legend</p>
            <ul className="space-y-1.5">
              <li className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: '#34d399' }}
                />
                Green — at or below the limit, likely eligible
              </li>
              <li className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: '#fbbf24' }}
                />
                Yellow — borderline, within 5% over the limit
              </li>
              <li className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: '#f87171' }}
                />
                Red — more than 5% over the limit
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

const FAQ_ITEMS = [
  {
    q: 'What is the consistency rule in prop trading?',
    a: "The consistency rule requires that no single winning trade (or, at some firms, a single trading day) accounts for more than a set percentage — typically 20-30% — of your total closed profit. It exists so that payouts reflect steady, repeatable trading rather than one large lucky trade carrying your whole account.",
  },
  {
    q: 'Why was my payout rejected for consistency?',
    a: "The most common reason is that one big winning trade (often from a news spike, an oversized position, or a lucky swing trade) made up too large a share of your total profit. Even if your account is profitable overall, firms will flag a payout if that single trade exceeds their consistency threshold.",
  },
  {
    q: 'How do I reduce my consistency percentage?',
    a: "Keep trading your normal strategy and position size rather than force-taking small trades just to pad the denominator — that can look artificial and firms may scrutinize it. The cleanest fix is simply accumulating more total closed profit over time through normal, consistent trading, which naturally lowers what percentage your largest win represents.",
  },
  {
    q: 'Does every prop firm use the same consistency rule?',
    a: 'No. Limits commonly range from 20% to 30%, and the calculation method varies by firm. Some measure the largest single trade against total profit (what this calculator uses), others measure the largest single trading day, and some apply the rule per position. Always check your specific firm\'s payout policy.',
  },
  {
    q: 'What counts as the largest winning trade?',
    a: "It's the profit from one individual closed trade, not your best day or your largest open position. If you had multiple winning trades on the same day, only the single largest trade counts toward this calculation — not the sum of that day's wins.",
  },
];

function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h2 className="font-display text-base font-semibold text-white">
        Frequently Asked Questions
      </h2>
      <div className="mt-4 divide-y divide-white/10">
        {FAQ_ITEMS.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={item.q} className="py-3 first:pt-0 last:pb-0">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 text-left"
              >
                <span className="text-sm font-medium text-white/85">
                  {item.q}
                </span>
                <span
                  className={`shrink-0 font-mono text-white/50 transition-transform duration-300 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                >
                  ▾
                </span>
              </button>
              {isOpen && (
                <p className="mt-3 animate-[fadeIn_0.25s_ease-out] text-sm leading-relaxed text-white/60">
                  {item.a}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

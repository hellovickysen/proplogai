'use client';

import { useMemo, useRef, useState } from 'react';
import {
  calculatePipPositionSize,
  calculatePricePositionSize,
} from '@/lib/positionSizeCalculator.mjs';

const fieldClass =
  'mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-white placeholder-white/25 outline-none transition focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/25';

function formatMoney(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function formatNumber(value, maximumFractionDigits = 4) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits,
  }).format(value || 0);
}

function Field({ id, label, hint, value, onChange, placeholder, step = 'any' }) {
  return (
    <div>
      <label htmlFor={id} className="font-mono text-xs uppercase tracking-wider text-white/60">
        {label}
      </label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min="0"
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={fieldClass}
      />
      {hint && <p className="mt-1.5 text-xs leading-relaxed text-white/40">{hint}</p>}
    </div>
  );
}

export default function PositionSizeCalculator() {
  const [mode, setMode] = useState('pip');
  const [riskMode, setRiskMode] = useState('percentage');
  const [balance, setBalance] = useState('');
  const [riskValue, setRiskValue] = useState('');
  const [stopPips, setStopPips] = useState('');
  const [pipValue, setPipValue] = useState('');
  const [entryPrice, setEntryPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  const [contractSize, setContractSize] = useState('');
  const [quoteToUsd, setQuoteToUsd] = useState('1');
  const [lotStep, setLotStep] = useState('0.01');
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const resultRef = useRef(null);

  const result = useMemo(() => {
    const shared = { balance, riskMode, riskValue, lotStep };
    return mode === 'pip'
      ? calculatePipPositionSize({
          ...shared,
          stopPips,
          pipValuePerLot: pipValue,
        })
      : calculatePricePositionSize({
          ...shared,
          entryPrice,
          stopPrice,
          contractSize,
          quoteToUsd,
        });
  }, [balance, contractSize, entryPrice, lotStep, mode, pipValue, quoteToUsd, riskMode, riskValue, stopPips, stopPrice]);

  const loadExample = (nextMode) => {
    setMode(nextMode);
    setRiskMode('percentage');
    setBalance('10000');
    setRiskValue('1');
    setLotStep('0.01');
    if (nextMode === 'pip') {
      setStopPips('20');
      setPipValue('10');
    } else {
      setEntryPrice('4150');
      setStopPrice('4148');
      setContractSize('100');
      setQuoteToUsd('1');
    }
    setSubmitted(true);
  };

  const handleCalculate = () => {
    setSubmitted(true);
    requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
  };

  const handleCopy = async () => {
    if (!result) return;
    const detail = mode === 'pip'
      ? `${formatNumber(result.stopDistance)} pips; ${formatMoney(Number(pipValue))} per pip for 1.00 lot`
      : `entry ${entryPrice}; stop ${stopPrice}; contract size ${contractSize}; USD conversion ${quoteToUsd}`;
    const summary = [
      'PropLogAI Position Size Estimate',
      `Method: ${mode === 'pip' ? 'Forex pip mode' : 'Price-distance mode'}`,
      `Planned loss: ${formatMoney(result.riskAmount)}`,
      `Inputs: ${detail}`,
      `Raw size: ${formatNumber(result.rawLots)} lots`,
      `Rounded down: ${formatNumber(result.roundedLots)} lots`,
      `Estimated loss at rounded size: ${formatMoney(result.estimatedLoss)}`,
      'Check the symbol specification, costs, open exposure and exact account rules before entry.',
    ].join('\n');
    await navigator.clipboard?.writeText(summary);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-cyan-300">Free trading tool</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-white md:text-4xl">
          Forex Position Size Calculator
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/60 md:text-base">
          Enter the risk and stop values from your own plan. The calculator estimates a lot size and shows every assumption it used.
        </p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6" aria-labelledby="calculator-inputs">
        <h2 id="calculator-inputs" className="font-display text-xl font-semibold text-white">Choose how your platform shows the value</h2>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2" role="tablist" aria-label="Calculation method">
          {[
            ['pip', 'Forex pip mode', 'Use stop distance in pips and the USD pip value for 1.00 lot.'],
            ['price', 'Price-distance mode', 'Use entry, stop, contract size and any required USD conversion.'],
          ].map(([value, label, description]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={mode === value}
              onClick={() => { setMode(value); setSubmitted(false); }}
              className={`rounded-xl border p-4 text-left transition ${mode === value ? 'border-cyan-400/45 bg-cyan-400/10' : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'}`}
            >
              <span className="block font-display text-sm font-semibold text-white">{label}</span>
              <span className="mt-1 block text-xs leading-relaxed text-white/45">{description}</span>
            </button>
          ))}
        </div>

        <div className="mt-6">
          <span className="font-mono text-xs uppercase tracking-wider text-white/60">My risk input is</span>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" aria-pressed={riskMode === 'percentage'} onClick={() => setRiskMode('percentage')} className={`rounded-lg border px-4 py-2 text-sm ${riskMode === 'percentage' ? 'border-violet-400/50 bg-violet-400/10 text-white' : 'border-white/10 text-white/55'}`}>Percentage</button>
            <button type="button" aria-pressed={riskMode === 'usd'} onClick={() => setRiskMode('usd')} className={`rounded-lg border px-4 py-2 text-sm ${riskMode === 'usd' ? 'border-violet-400/50 bg-violet-400/10 text-white' : 'border-white/10 text-white/55'}`}>USD amount</button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field id="account-balance" label={`Account balance ($)${riskMode === 'usd' ? ' — optional' : ''}`} hint={riskMode === 'usd' ? 'The direct USD amount is used for the calculation.' : 'Use the USD balance your own plan uses.'} value={balance} onChange={setBalance} placeholder="10000" />
          <Field id="risk-value" label={riskMode === 'percentage' ? 'Selected risk (%)' : 'Planned loss ($)'} hint="Your input, not a PropLogAI recommendation." value={riskValue} onChange={setRiskValue} placeholder={riskMode === 'percentage' ? '1' : '100'} />

          {mode === 'pip' ? (
            <>
              <Field id="stop-pips" label="Stop distance (pips)" hint="Measure from the planned entry to the planned stop." value={stopPips} onChange={setStopPips} placeholder="20" />
              <Field id="pip-value" label="USD pip value for 1.00 lot" hint="Copy or confirm this value from your platform for this pair and account currency." value={pipValue} onChange={setPipValue} placeholder="10" />
            </>
          ) : (
            <>
              <Field id="entry-price" label="Entry price" value={entryPrice} onChange={setEntryPrice} placeholder="4150" />
              <Field id="stop-price" label="Stop price" value={stopPrice} onChange={setStopPrice} placeholder="4148" />
              <Field id="contract-size" label="Contract size per 1.00 lot" hint="Check your platform's symbol specification. Do not assume every XAUUSD symbol is the same." value={contractSize} onChange={setContractSize} placeholder="100" />
              <Field id="quote-to-usd" label="Quote-to-USD conversion" hint="Use 1 only when the calculated loss is already in USD." value={quoteToUsd} onChange={setQuoteToUsd} placeholder="1" />
            </>
          )}
          <Field id="lot-step" label="Lot step" hint="The smallest size step your platform accepts." value={lotStep} onChange={setLotStep} placeholder="0.01" step="0.01" />
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={handleCalculate} className="rounded-xl px-6 py-3 font-display text-sm font-semibold text-[#07070b]" style={{ background: 'linear-gradient(120deg, #a78bfa, #22d3ee)' }}>
            Calculate position size
          </button>
          <button type="button" onClick={() => loadExample(mode)} className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/65 hover:bg-white/10">
            Load fictional XAUUSD example
          </button>
        </div>
      </section>

      <section ref={resultRef} className="scroll-mt-6" aria-live="polite" aria-atomic="true">
        {submitted && !result && (
          <div className="rounded-2xl border border-amber-300/25 bg-amber-300/5 p-5 text-sm leading-relaxed text-amber-100">
            Check every required field. Values must be above zero, the entry and stop must differ, and a percentage cannot be above 100%.
          </div>
        )}

        {submitted && result && (
          <div className="rounded-2xl border border-cyan-300/25 bg-gradient-to-br from-cyan-300/[0.08] to-violet-400/[0.06] p-5 md:p-7">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-cyan-200">Estimated position size</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <p className="font-mono text-4xl font-bold text-white md:text-5xl">{formatNumber(result.roundedLots)} lots</p>
              <p className="text-sm text-white/50">Raw result: {formatNumber(result.rawLots)} lots</p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-[#080810]/70 p-4"><p className="text-xs text-white/45">Planned loss</p><p className="mt-1 font-mono text-lg text-white">{formatMoney(result.riskAmount)}</p></div>
              <div className="rounded-xl border border-white/10 bg-[#080810]/70 p-4"><p className="text-xs text-white/45">Loss for 1.00 lot</p><p className="mt-1 font-mono text-lg text-white">{formatMoney(result.lossPerLot)}</p></div>
              <div className="rounded-xl border border-white/10 bg-[#080810]/70 p-4"><p className="text-xs text-white/45">Estimated loss after rounding</p><p className="mt-1 font-mono text-lg text-white">{formatMoney(result.estimatedLoss)}</p></div>
            </div>

            <div className="mt-5 rounded-xl border border-white/10 bg-[#080810]/55 p-4 text-sm leading-relaxed text-white/60">
              <strong className="text-white">Check before entry:</strong> verify the symbol specification, pip or tick value, account currency, costs, open exposure and current prop-firm rules. A stop can fill away from the requested price.
            </div>

            <button type="button" onClick={handleCopy} className="mt-4 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 font-mono text-xs text-white/65 hover:bg-white/10">
              {copied ? '✓ Copied' : 'Copy calculation'}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

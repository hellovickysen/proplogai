import Link from 'next/link';
import { gradientText, gradientBtn, BETA_LIMIT } from '@/components/landing/LandingData';

function BetaBar({ count }) {
  const pct = Math.min(100, (count / BETA_LIMIT) * 100);
  const remaining = Math.max(0, BETA_LIMIT - count);
  const barColor = count >= 480 ? 'linear-gradient(120deg, #f87171, #ef4444)'
    : count >= 400 ? 'linear-gradient(120deg, #fbbf24, #f59e0b)'
    : 'linear-gradient(120deg, #a78bfa, #22d3ee)';
  const dotColor = count >= 480 ? 'bg-red-400' : count >= 400 ? 'bg-amber-400' : 'bg-emerald-300';
  const textColor = count >= 480 ? 'text-red-300' : count >= 400 ? 'text-amber-300' : 'text-emerald-300';

  return (
    <div className="mx-auto mt-8 max-w-md rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-5 sm:px-6">
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-white/70">
          <span className={`h-2 w-2 rounded-full ${dotColor} shadow-[0_0_10px_rgba(52,211,153,0.7)]`} />
          Beta spots filling up
        </span>
        <span className={`font-mono text-sm font-bold ${textColor}`}>{remaining} left</span>
      </div>
      <div className="h-3 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: pct + '%', background: barColor }} />
      </div>
      <div className="mt-2 text-center font-mono text-xs text-white/40">{count} / {BETA_LIMIT} traders joined</div>
    </div>
  );
}

export default function BottomSection({ betaCount }) {
  return (
    <>
      {/* ═══════════════ FAQ ═══════════════ */}
      <section className="px-4 py-16 sm:px-10" data-reveal>
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center font-display text-2xl font-bold sm:text-3xl">Common questions</h2>
          <div className="space-y-4">
            {[
              { q: 'Is the beta really free?', a: 'Yes. Every feature — including AI coaching — is free during the beta. No credit card required.' },
              { q: 'What happens when Elite launches?', a: 'Basic plan stays free forever with the limits shown above. Beta users get early-adopter pricing on Elite.' },
              { q: 'Why no broker auto-import?', a: 'Deliberate choice. Manual logging forces you to reflect on every trade — the emotion, the setup, the decision. That reflection is where discipline is built. Auto-import skips it.' },
              { q: 'Is my trading data secure?', a: 'All data is encrypted at rest (AES-256) and in transit (TLS 1.2+). We never ask for broker credentials and never sell your data.' },
              { q: 'Can I cancel anytime?', a: 'Yes. No contracts, no commitments. Downgrade to Basic anytime and keep all your trade data.' },
              { q: 'How is Propol different from ChatGPT?', a: 'Propol is your AI Trading Performance Coach — it analyzes YOUR journal, YOUR emotions, YOUR discipline. It never gives financial advice or trading signals. It finds the patterns in your own data that you can\'t see.' },
              { q: 'Does Propol give trading advice?', a: 'No. Propol is an educational tool that analyzes your journal, behavior, and adherence to your own trading plan. It does not provide financial, investment, or trading advice of any kind.' },
            ].map((faq, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h3 className="font-display text-sm font-semibold">{faq.q}</h3>
                <p className="mt-1.5 text-sm text-white/50">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ CTA ═══════════════ */}
      <section className="px-4 py-20 sm:px-10" data-reveal>
        <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 p-10 text-center shadow-[0_0_80px_rgba(34,211,238,0.08)]" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(34,211,238,0.05))' }}>
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            Every failed challenge has a pattern.{' '}
            <span className="gradient-shimmer">Find yours.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm text-white/55">
            Free beta — every feature is live. Be one of the first traders with AI coaching that actually finds what&apos;s costing you money.
          </p>
          <Link href="/login?mode=signup" className="cta-glow mt-8 inline-block rounded-xl px-8 py-3.5 text-base font-semibold text-[#08080f] transition-transform hover:-translate-y-0.5" style={gradientBtn}>
            Start free — find your blind spot →
          </Link>
          <p className="mt-3 text-xs text-white/30">No credit card. 60 seconds to start. Your funded account will thank you.</p>
          <BetaBar count={betaCount} />
        </div>
      </section>
    </>
  );
}

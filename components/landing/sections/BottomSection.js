import Link from 'next/link';
import { gradientBtn } from '@/components/landing/LandingData';

export default function BottomSection() {
  return (
    <>
      {/* ═══════════════ FAQ ═══════════════ */}
      <section className="px-4 py-16 sm:px-10" data-reveal>
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center font-display text-2xl font-bold sm:text-3xl">Common questions</h2>
          <div className="space-y-4">
            {[
              { q: 'How does the 14-day Elite trial work?', a: 'Sign up without a credit card and use Elite features for 14 days. When the trial ends, continue on Basic or upgrade when you are ready.' },
              { q: 'Is Basic really free?', a: 'Yes. Basic stays free with the limits shown above, and your trade history remains yours.' },
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
            Thirty days to build habits{' '}
            <span className="gradient-shimmer">that protect your discipline.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm text-white/55">
            Start with Elite free for 14 days. Build your rulebook, expose recurring mistakes, and reinforce better trading habits.
          </p>
          <Link href="/login?mode=signup" className="cta-glow mt-8 inline-block rounded-xl px-8 py-3.5 text-base font-semibold text-[#08080f] transition-transform hover:-translate-y-0.5" style={gradientBtn}>
            Start my discipline system →
          </Link>
          <p className="mt-3 text-xs text-white/35">14-day Elite trial · No credit card</p>
        </div>
      </section>
    </>
  );
}

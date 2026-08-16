import Link from 'next/link';
import { gradientBtn } from '@/components/landing/LandingData';

const FAQS = [
  {
    q: 'How does the 14-day Elite trial work?',
    a: 'Sign up without a credit card and use Elite features for 14 days. When the trial ends, continue on Basic or upgrade when you are ready.',
  },
  {
    q: 'Is Basic really free?',
    a: 'Yes. Basic stays free with the limits shown above, and your trade history remains yours.',
  },
  {
    q: 'Why no broker auto-import?',
    a: 'Deliberate choice. Manual logging forces you to reflect on every trade — the emotion, the setup, the decision. That reflection is where discipline is built. Auto-import skips it.',
  },
  {
    q: 'Is my trading data secure?',
    a: 'All data is encrypted at rest (AES-256) and in transit (TLS 1.2+). We never ask for broker credentials and never sell your data.',
  },
  {
    q: 'Does Propol give trading advice?',
    a: 'No. Propol is an educational tool that analyzes your journal, behavior, and adherence to your own trading plan. It does not provide financial, investment, or trading advice of any kind.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. No contracts, no commitments. Downgrade to Basic anytime and keep all your trade data.',
  },
];

export default function BottomSection() {
  return (
    <>
      {/* ═══════════════ FAQ ═══════════════ */}
      <section className="border-t border-white/[0.06] px-4 py-20 sm:px-10" data-reveal>
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Common questions
          </h2>
          <div className="mt-10 divide-y divide-white/[0.06] rounded-3xl border border-white/[0.07] bg-white/[0.028]">
            {FAQS.map((faq) => (
              <div key={faq.q} className="p-6">
                <h3 className="font-display text-sm font-semibold text-white">{faq.q}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/50">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ FINAL CTA ═══════════════ */}
      <section className="px-4 pb-24 pt-4 sm:px-10" data-reveal>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Thirty days from now, the pattern{' '}
            <span className="bg-gradient-to-r from-[#8b7cf6] to-[#22d3ee] bg-clip-text text-transparent">
              is either broken or repeated.
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-white/55 sm:text-base">
            Build your rulebook, expose the recurring mistake, and prove the fix
            held — one disciplined week at a time.
          </p>
          <Link
            href="/login?mode=signup"
            className="cta-glow mt-9 inline-block rounded-xl px-9 py-4 text-base font-semibold text-[#070710] transition-transform hover:-translate-y-0.5"
            style={gradientBtn}
          >
            Start my 30 days →
          </Link>
          <p className="mt-4 text-xs text-white/35">14-day Elite trial · No credit card</p>
        </div>
      </section>
    </>
  );
}

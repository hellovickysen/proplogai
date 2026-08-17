/* FAQ — short, direct, honest about what PropLogAI is and isn't. */
const FAQS = [
  {
    q: 'What is PropLogAI?',
    a: 'A trading intelligence and discipline system. You log your trades; PropLogAI measures your behavior, finds your patterns, and scores your discipline — so every trade makes you better.',
  },
  {
    q: 'Is PropLogAI a trading journal?',
    a: 'The journal is just the input. PropLogAI adds the measurement layer (analytics), the intelligence layer (AI coaching), the control layer (Rulebook), and the feedback layer (Discipline Score) on top of it.',
  },
  {
    q: 'Who is PropLogAI for?',
    a: 'Beginners building habits, developing traders hunting for their patterns, and prop-firm traders who need to measure process, risk, and consistency under pressure.',
  },
  {
    q: 'Can I track prop firm accounts?',
    a: 'Yes. Track multiple accounts, log challenge fees and payouts in the expense tracker, and keep your daily loss limits visible as Rulebook guardrails.',
  },
  {
    q: 'Can I import my trades?',
    a: 'PropLogAI is deliberately manual-first. Logging each trade yourself — the setup, the emotion, the reason — is where the reflection happens. That reflection is what builds discipline.',
  },
  {
    q: 'Does PropLogAI analyze my trading behavior?',
    a: 'Yes. Every trade is evaluated against your Rulebook, your emotions are tracked, and Propol (your AI coach) reads your history to surface recurring patterns and mistakes.',
  },
  {
    q: 'How does the AI coach work?',
    a: 'Propol analyzes your journal — trades, emotions, rule adherence, and performance — then produces pattern detections and a concrete action plan. It works only from your data and never gives trading signals.',
  },
  {
    q: 'Can I create my own trading rules?',
    a: 'Yes. Define your setups, risk limits, and daily guardrails in your Rulebook. PropLogAI then measures every logged trade against those rules and tracks your adherence.',
  },
  {
    q: 'Is PropLogAI free?',
    a: 'Yes — the Basic plan is free forever with generous limits. During the beta, all Elite features are unlocked for every user, no credit card required.',
  },
  {
    q: 'Does PropLogAI provide trading signals?',
    a: 'No. PropLogAI is an analysis and discipline tool. It does not provide trading signals, financial advice, or personalized investment recommendations, and it does not guarantee profits of any kind.',
  },
];

export default function FAQSection() {
  return (
    <section className="px-4 py-20 sm:px-10 sm:py-28" data-reveal>
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-10 text-center font-display text-2xl font-bold sm:text-3xl">Common questions</h2>
        <div className="space-y-4">
          {FAQS.map((faq) => (
            <div key={faq.q} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h3 className="font-display text-sm font-semibold">{faq.q}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-white/50">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

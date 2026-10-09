import Link from 'next/link';
import LandingNav from '@/components/landing/LandingNav';
import LandingFooter from '@/components/landing/LandingFooter';
import styles from './trading-journal.module.css';

const pageUrl = 'https://proplogai.com/trading-journal';

export const metadata = {
  title: 'Free Trading Journal for Forex & Prop Firm Traders | PropLogAI',
  description: 'Record your forex trades, plan, emotions, screenshots and USD results in a free trading journal. Review the decisions behind your P&L with PropLogAI.',
  alternates: { canonical: pageUrl },
  openGraph: {
    title: 'Free Trading Journal for Forex & Prop Firm Traders',
    description: 'Keep your trade plan, result and lesson together. Start with PropLogAI Basic for free.',
    url: pageUrl,
    type: 'website',
    siteName: 'PropLogAI',
  },
};

const questions = [
  {
    q: 'Is the trading journal really free?',
    a: 'Yes. PropLogAI Basic is $0 and includes unlimited trade logging, journal entries with emotions, a P&L calendar, and one screenshot per trade. Elite is a separate paid plan with a 14-day trial. Check the pricing page for the current plan details.',
  },
  {
    q: 'What should I record after a trade?',
    a: 'Start with the instrument, session, setup, your plan, what you actually did, the result in USD, and one short lesson. Add a screenshot when it helps you understand the decision later.',
  },
  {
    q: 'Can I use it for a prop firm challenge?',
    a: 'You can record your trades and review whether you followed your own plan and the account rules you checked. PropLogAI does not replace your firm’s dashboard or confirm an official breach or pass.',
  },
  {
    q: 'Will PropLogAI import trades or tell me what to trade?',
    a: 'You enter your trade details yourself. The journal is for recording and reviewing your decisions; it does not provide trade signals or place orders.',
  },
];

const sample = [
  ['Instrument', 'XAUUSD'],
  ['Session', 'London'],
  ['Setup', 'Asian range breakout'],
  ['Plan', 'Wait for candle close'],
  ['Entry', '4150'],
  ['Stop', '4148'],
  ['Planned risk', '$50'],
  ['Result', '+$85'],
];

export default function TradingJournalPage() {
  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'PropLogAI Trading Journal',
    url: pageUrl,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    description: 'A trading journal for manually recording trades, plans, emotions and results for later review.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', url: 'https://proplogai.com/pricing' },
  };

  return (
    <div className="min-h-screen bg-[#07070b] text-white">
      <LandingNav showTrial={false} ctaLabel="Start Free Journal" pricingHref="/pricing" blogHref="https://proplogai.com/blogs" />
      <main>
        <section className="relative overflow-hidden px-5 pb-20 pt-14 sm:pt-24">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[560px] bg-[radial-gradient(ellipse_at_50%_0%,rgba(118,92,214,0.16),transparent_68%)]" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/5 px-4 py-2 text-xs font-semibold text-cyan-200">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" /> Basic is $0 forever
              </p>
              <h1 className="max-w-xl font-display text-[clamp(2.45rem,5vw,4.8rem)] font-bold leading-[1.08] tracking-tight">
                Free trading journal for <span className="text-cyan-300">forex</span> and prop firm traders
              </h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-white/65 sm:text-lg">
                You took the trade. What was the plan, what did you do, and what can you learn from it? Keep those answers beside the result, so your next review is based on a clear record.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/login?mode=signup" className="rounded-xl bg-gradient-to-r from-violet-400 to-cyan-300 px-6 py-3.5 text-sm font-bold text-[#08080f] transition hover:brightness-110">
                  Start your free journal <span aria-hidden="true">→</span>
                </Link>
                <Link href="/pricing" className="rounded-xl border border-white/15 px-6 py-3.5 text-sm font-semibold text-white/80 transition hover:border-white/30 hover:bg-white/5">
                  See current plan details
                </Link>
              </div>
              <p className="mt-4 text-xs text-white/40">Basic stays free. The 14-day Elite trial is a different plan.</p>
            </div>

            <div className={styles.heroPaper} aria-label="Fictional XAUUSD journal note showing a plan, result and lesson">
              <div className={styles.paperTape} aria-hidden="true" />
              <div className={styles.paperTopline}><span>ONE TRADE, THREE QUESTIONS</span><span>01 / 03</span></div>
              <h2 className={styles.paperTitle}>What did I actually do?</h2>
              <div className={styles.paperGrid}>
                <div className={styles.paperRow}><span className={styles.paperNum}>1</span><span><strong>My plan</strong><br />Wait for the London breakout candle to close.</span></div>
                <div className={styles.paperRow}><span className={styles.paperNum}>2</span><span><strong>My trade</strong><br />XAUUSD · planned risk $50 · result +$85</span></div>
                <div className={styles.paperRow}><span className={styles.paperNum}>3</span><span><strong>My lesson</strong><br />I waited for the close. Keep that rule next time.</span></div>
              </div>
              <p className={styles.paperFooter}>A good result is not the same as a good decision. Check both.</p>
              <span className={styles.paperExample}>Fictional example</span>
            </div>
          </div>
        </section>

        <section className="border-y border-white/[0.07] bg-white/[0.025] px-5 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300/80">Start small</p>
            <h2 className="mt-3 max-w-2xl font-display text-3xl font-bold leading-tight sm:text-4xl">Record one trade clearly. Then look for what repeats.</h2>
            <p className="mt-5 max-w-2xl leading-7 text-white/60">You do not need a long diary after every trade. A few consistent fields can help you compare your next XAUUSD setup with the last one.</p>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {[
                { n: '01', title: 'Write your plan', body: 'Name the instrument, session, setup and condition you are waiting for. Record the planned risk in dollars before the result changes your memory.', tint: 'cyan' },
                { n: '02', title: 'Record what happened', body: 'Add the actual entry and exit, USD profit or loss, a feeling tag and a chart screenshot if it adds useful context.', tint: 'violet' },
                { n: '03', title: 'Review one pattern', body: 'Compare several entries. Ask whether you followed the same rule each time, even when a trade ended in profit.', tint: 'emerald' },
              ].map((step) => (
                <div key={step.n} className="rounded-2xl border border-white/10 bg-[#0c0d15] p-6 sm:p-7">
                  <span className={`font-mono text-xs font-semibold ${step.tint === 'cyan' ? 'text-cyan-300' : step.tint === 'violet' ? 'text-violet-300' : 'text-emerald-300'}`}>{step.n} / 03</span>
                  <h3 className="mt-5 text-xl font-semibold">{step.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/55">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-20 sm:py-28">
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">A clear example</p>
              <h2 className="mt-3 font-display text-3xl font-bold leading-tight sm:text-4xl">The number tells you what happened. The note tells you why you need to review it.</h2>
              <p className="mt-5 leading-7 text-white/60">Imagine you planned an XAUUSD breakout in the London session. You waited for the candle to close, entered at 4150 with a stop at 4148, and made $85. You record the result, but also whether you followed the plan. A winning early entry would need a different lesson.</p>
              <p className="mt-5 leading-7 text-white/60">This is a fictional record for learning. It is not a trade idea or a promise that the same setup will work again.</p>
              <a href="https://proplogai.com/blogs/prop-firm-trading-journal" className="mt-7 inline-flex text-sm font-semibold text-cyan-300 underline decoration-cyan-300/40 underline-offset-4 hover:text-cyan-200">Learn how to review a prop firm trading journal →</a>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#10111b] p-5 shadow-[0_25px_80px_rgba(0,0,0,0.24)] sm:p-8">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 text-xs text-white/45"><span>FICTIONAL JOURNAL ENTRY</span><span>London · XAUUSD</span></div>
              <dl className="mt-3 grid grid-cols-2 gap-x-5">
                {sample.map(([term, value]) => (
                  <div key={term} className="min-w-0 border-b border-white/[0.07] py-4">
                    <dt className="text-xs text-white/40">{term}</dt><dd className="mt-1 text-sm font-semibold text-white/85">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-5 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.05] p-4"><span className="text-xs font-semibold uppercase tracking-wide text-emerald-300">Review note</span><p className="mt-2 text-sm leading-6 text-white/70">Plan followed: yes. I waited for the candle close. Next time, check the same condition before judging the result.</p></div>
            </div>
          </div>
        </section>

        <section className="border-y border-white/[0.07] bg-[#0c0b14] px-5 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">What Basic includes</p><h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">A free place to keep the whole trade.</h2><p className="mt-4 leading-7 text-white/60">Basic currently gives you unlimited trade logging, journal entries with emotions, one screenshot per trade, a full P&L calendar, and a dashboard with stats and an equity chart. The current limits for other features are on the <Link href="/pricing" className="text-cyan-300 underline underline-offset-4">pricing page</Link>.</p></div>
            <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['Trade details', 'Keep the setup and the actual entry together.'],
                ['Feelings and notes', 'Remember how you felt before judging the result.'],
                ['Chart evidence', 'Attach a screenshot to one Basic trade.'],
                ['P&L and review', 'See results in the calendar and dashboard.'],
              ].map(([title, body]) => <div key={title} className="rounded-xl border border-white/10 bg-white/[0.03] p-5"><h3 className="font-semibold text-white/90">{title}</h3><p className="mt-2 text-sm leading-6 text-white/50">{body}</p></div>)}
            </div>
          </div>
        </section>

        <section className="px-5 py-20 sm:py-24">
          <div className="mx-auto max-w-4xl">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Questions before you start</h2>
            <div className="mt-8 divide-y divide-white/10 border-y border-white/10">
              {questions.map(({ q, a }) => <div key={q} className="py-6"><h3 className="text-lg font-semibold text-white/90">{q}</h3><p className="mt-3 max-w-3xl text-sm leading-7 text-white/60">{a}</p></div>)}
            </div>
            <p className="mt-8 text-sm leading-7 text-white/50">Want a sheet instead? Use the <a href="https://proplogai.com/blogs/trading-journal-template" className="text-cyan-300 underline underline-offset-4">trading journal template</a>. New to the term? Read the <a href="https://proplogai.com/glossary/trading-journal" className="text-cyan-300 underline underline-offset-4">trading journal definition</a>.</p>
          </div>
        </section>

        <section className="px-5 pb-24"><div className="mx-auto max-w-6xl rounded-3xl border border-cyan-300/15 bg-gradient-to-br from-violet-500/10 to-cyan-300/10 px-6 py-12 text-center sm:px-12 sm:py-16"><h2 className="font-display text-3xl font-bold sm:text-4xl">Start with one clear trade record.</h2><p className="mx-auto mt-4 max-w-xl leading-7 text-white/60">You can add more fields later. First, keep the plan, what happened and one useful note in the same place.</p><Link href="/login?mode=signup" className="mt-8 inline-flex rounded-xl bg-gradient-to-r from-violet-400 to-cyan-300 px-6 py-3.5 text-sm font-bold text-[#08080f] hover:brightness-110">Start your free journal →</Link></div></section>
      </main>
      <LandingFooter />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
    </div>
  );
}

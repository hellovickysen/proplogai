import Link from 'next/link';
import LandingNav from '@/components/landing/LandingNav';
import LandingFooter from '@/components/landing/LandingFooter';
import AccountSurvivalCalculator from '@/components/tools/AccountSurvivalCalculator';

const faqs = [
  {
    q: 'How do I calculate how many losing days my prop firm account can survive?',
    a: "Divide your prop firm's maximum allowed drawdown by your planned maximum daily loss. For example, with a $2,000 drawdown and a $200 daily risk, your account can absorb 10 consecutive fully losing sessions before reaching the drawdown limit.",
  },
  {
    q: 'How much can I risk per day on a $50K prop firm account?',
    a: "It depends on the firm's maximum drawdown, not the account size. A $50,000 account with a $2,000 drawdown has only $2,000 of risk capacity. If you want to survive 20 losing sessions, your maximum daily risk is $2,000 ÷ 20 = $100 per day.",
  },
  {
    q: 'How much should I risk per trade if I want to survive 20 losing sessions?',
    a: "First calculate your maximum daily risk: divide your maximum drawdown by 20. Then divide that daily risk by the number of trades you take per session. For example, with a $2,000 drawdown: $2,000 ÷ 20 = $100/day. If you take 2 trades per session: $100 ÷ 2 = $50 per trade.",
  },
  {
    q: "How do I calculate daily risk from a prop firm's maximum drawdown?",
    a: "Divide the firm's maximum allowed drawdown by the number of consecutive losing sessions you want your account to survive. The result is your maximum planned daily loss. For example, $2,000 drawdown ÷ 20 sessions = $100 per day.",
  },
  {
    q: 'What is the difference between daily loss and maximum drawdown?',
    a: "Maximum drawdown is the total amount your account can lose before the firm closes or resets it. Daily loss is how much you lose in a single trading session. Your daily loss contributes toward the overall drawdown. Some firms also enforce a separate daily loss limit.",
  },
  {
    q: 'How much can I risk per trade if I take 2 trades per day?',
    a: "Divide your maximum planned daily risk by the number of trades per session. If your daily risk is $100 and you take 2 trades, your maximum risk per trade is $50. This keeps your total daily exposure within your planned limit.",
  },
  {
    q: 'How many losing sessions can a $50K account survive?',
    a: "It depends on the drawdown, not the account size. A $50,000 account with a $2,000 maximum drawdown and $100 daily risk can survive 20 consecutive fully losing sessions. A $50,000 account with a $5,000 drawdown and $100 daily risk can survive 50 sessions.",
  },
  {
    q: 'How do I convert prop firm drawdown percentage into dollars?',
    a: "Multiply your account size by the drawdown percentage. For example, a 4% drawdown on a $50,000 account is $50,000 × 0.04 = $2,000. Use the dollar amount for all risk calculations.",
  },
];

export default function PublicAccountSurvivalCalculatorPage() {
  return (
    <>
      <LandingNav />
      <div className="min-h-screen bg-[#07070b]">
        <div className="mx-auto max-w-3xl p-4 md:p-8">
          <Link
            href="/tools"
            className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-white/55 transition-colors hover:text-white/90"
          >
            &larr; Tools
          </Link>

          <div className="mt-4">
            <AccountSurvivalCalculator />
          </div>

          {/* How It Works */}
          <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
            <h2 className="font-display text-lg font-semibold text-white md:text-xl">
              How the Prop Firm Survival Calculator Works
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              Enter your prop firm account size, maximum allowed drawdown, and
              how many losing trading sessions you want your account to survive.
              The calculator tells you the maximum planned daily risk you can
              take. Optionally, enter your trades per session to see per-trade
              risk.
            </p>
            <ol className="mt-5 list-decimal space-y-4 pl-5 text-sm text-white/60">
              <li>
                <b className="text-white">Enter your account size</b>
                <br />
                Your prop firm account size or personal trading capital.
              </li>
              <li>
                <b className="text-white">Enter your maximum drawdown</b>
                <br />
                The maximum amount your account can lose, in dollars or as a
                percentage. The calculator converts between the two
                automatically.
              </li>
              <li>
                <b className="text-white">Set your survival target or daily risk</b>
                <br />
                Choose how many consecutive losing sessions you want to survive,
                or enter your planned daily risk to see how many sessions your
                drawdown can absorb.
              </li>
            </ol>
          </section>

          {/* FAQ */}
          <section className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
            <h2 className="font-display text-lg font-semibold text-white md:text-xl">
              Prop Firm Survival Calculator FAQ
            </h2>
            <p className="mt-3 text-sm text-white/60">
              Common questions about calculating daily risk, per-trade risk, and
              drawdown survival for prop firm accounts.
            </p>

            <div className="mt-6 divide-y divide-white/10">
              {faqs.map((item) => (
                <details key={item.q} className="group py-4 first:pt-0 last:pb-0">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 text-left marker:content-none [&::-webkit-details-marker]:hidden">
                    <h3 className="text-sm font-medium text-white/85">
                      {item.q}
                    </h3>
                    <span className="shrink-0 font-mono text-white/50 transition-transform duration-300 group-open:rotate-180">
                      &#9662;
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-white/60">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </section>

          {/* CTA Banner */}
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center md:p-8">
            <p className="font-display text-base font-semibold text-white md:text-lg">
              Want to track your risk automatically?
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-white/50">
              PropLogAI logs your trades, tracks emotions, and gives you AI
              coaching to improve your trading discipline.
            </p>
            <Link
              href="/login"
              className="mt-5 inline-block rounded-xl px-6 py-3 text-sm font-semibold text-[#08080f] transition-transform active:scale-[0.98]"
              style={{ background: 'linear-gradient(120deg, #a78bfa, #22d3ee)' }}
            >
              Start journaling free &rarr;
            </Link>
          </div>
        </div>
      </div>
      <LandingFooter />
    </>
  );
}

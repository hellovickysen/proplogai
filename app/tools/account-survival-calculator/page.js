import Link from 'next/link';
import LandingNav from '@/components/landing/LandingNav';
import LandingFooter from '@/components/landing/LandingFooter';
import AccountSurvivalCalculator from '@/components/tools/AccountSurvivalCalculator';

const faqs = [
  {
    q: 'How many losing trades can my account survive?',
    a: 'Your account’s survival depends on your maximum allowed loss and how much you risk per trade. Divide your maximum allowed loss by your risk per trade to estimate the maximum number of consecutive losing trades before reaching your loss limit.',
    formula: 'Maximum Allowed Loss ÷ Risk Per Trade = Consecutive Losing Trades',
  },
  {
    q: 'How many losing trading days can my account survive?',
    a: 'Divide your maximum allowed loss or drawdown by your planned maximum daily loss. For example, with a $2,000 drawdown and $200 maximum daily loss, your account can absorb 10 consecutive fully losing sessions.',
    formula: 'Maximum Drawdown ÷ Daily Risk = Consecutive Losing Sessions',
  },
  {
    q: 'How much should I risk per day to survive 20 losing days?',
    a: 'Divide your maximum allowed loss by the number of losing sessions you want your account to survive. For example, with a $2,000 maximum loss and a target of 20 losing sessions: $2,000 ÷ 20 = $100 per day. Your planned maximum daily loss would therefore be $100.',
  },
  {
    q: 'How much should I risk per trade if I take 2 trades per day?',
    a: 'First calculate your maximum daily risk based on your desired survival period. Then divide that daily risk by your maximum number of trades per session. For example: $2,000 ÷ 20 sessions = $100/day. $100 ÷ 2 trades = $50/trade. So risking $50 per trade allows for two maximum-loss trades per day while maintaining the 20-session survival target.',
  },
  {
    q: 'What percentage should I risk per trade?',
    a: 'There is no single risk percentage that is appropriate for every trader or prop firm. Your risk should take into account your maximum drawdown, strategy, trading frequency, and the number of consecutive losses you want your account to withstand. Use the calculator above to convert your dollar risk into a percentage of your account size.',
  },
  {
    q: 'What is the difference between account size and maximum drawdown?',
    a: 'Account size is the nominal value of the account. Maximum drawdown is the amount the account can lose before reaching its loss limit. For example, a $50,000 prop account with a $2,000 maximum drawdown does not have $50,000 of risk capacity. Its relevant survival boundary is $2,000.',
  },
  {
    q: 'How do I calculate risk per trade for a prop firm account?',
    a: 'Start with the firm’s maximum allowed drawdown, decide how many consecutive losing trades or sessions you want to survive, and work backward from that limit. Remember to consider the firm’s specific daily loss and maximum drawdown rules.',
  },
  {
    q: 'What happens if I lose my maximum daily loss every day?',
    a: 'If you reach your planned maximum daily loss on every trading session, divide your maximum allowed drawdown by your daily loss to determine how many consecutive losing sessions you can withstand. This represents a worst-case risk scenario, not a prediction of future performance.',
  },
  {
    q: 'Is risking 1% per trade safe for a prop firm account?',
    a: 'Not necessarily. A 1% risk per trade may represent a large portion of a prop firm’s available drawdown. For example, if a $50,000 account has a $2,000 drawdown, a 1% risk is $500—25% of the entire drawdown. Five consecutive losses of $500 would exhaust the $2,000 drawdown.',
  },
  {
    q: 'How can I make my trading account survive longer?',
    a: 'One way is to reduce the amount you risk per trade or per trading session. Lower risk increases the number of consecutive losses your account can withstand before reaching its maximum allowed loss. Your actual risk should also account for your trading strategy and the rules of your prop firm.',
  },
  {
    q: 'Does this calculator predict whether I will lose money?',
    a: 'No. The calculator does not predict your trading performance or future losses. It only shows how many consecutive losing trades or trading sessions your account could withstand based on the risk limits you enter.',
  },
  {
    q: 'Can I use this calculator for prop firm accounts?',
    a: 'Yes. Enter the account’s nominal size and use the firm’s actual maximum allowed drawdown or loss as your maximum loss. Then enter your planned daily or per-trade risk to see how many consecutive losses your account could theoretically withstand.',
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
              How the Account Survival Calculator Works
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              The Account Survival Calculator helps traders understand how their
              planned risk relates to their account&rsquo;s maximum loss. Enter your
              account size, maximum allowed drawdown, and either your planned risk
              per trade or maximum daily loss. The calculator shows how many
              consecutive losing trades or trading sessions your account could
              survive.
            </p>
            <ol className="mt-5 list-decimal space-y-4 pl-5 text-sm text-white/60">
              <li>
                <b className="text-white">Enter your account size</b>
                <br />
                Enter your personal trading capital or prop firm account size.
              </li>
              <li>
                <b className="text-white">Enter your maximum loss</b>
                <br />
                Enter your maximum drawdown as either a dollar amount or
                percentage.
              </li>
              <li>
                <b className="text-white">Set your risk or survival target</b>
                <br />
                Enter your planned risk per trade/day, or choose how many
                consecutive losing sessions you want to survive.
              </li>
            </ol>
          </section>

          {/* FAQ */}
          <section className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
            <h2 className="font-display text-lg font-semibold text-white md:text-xl">
              Account Survival Calculator FAQ
            </h2>
            <p className="mt-3 text-sm text-white/60">
              Learn how account drawdown, daily risk, and risk per trade affect
              how many consecutive losing trading sessions your account can
              survive.
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
                  <div className="mt-3 space-y-2 text-sm leading-relaxed text-white/60">
                    <p>{item.a}</p>
                    {item.formula && (
                      <p className="rounded-lg border border-white/10 bg-white/[0.02] px-4 py-2.5 font-mono text-xs text-white/70">
                        {item.formula}
                      </p>
                    )}
                  </div>
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

          {/* Disclaimer */}
          <p className="mt-6 px-1 text-xs leading-relaxed text-white/35">
            This calculator does not predict trading performance or future
            losses. Results are based entirely on the values you enter and
            represent a theoretical worst-case scenario. Always verify your prop
            firm&rsquo;s specific drawdown and daily loss rules before trading.
          </p>
        </div>
      </div>
      <LandingFooter />
    </>
  );
}

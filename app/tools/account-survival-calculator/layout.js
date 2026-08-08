const faqStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How many losing trades can my account survive?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Your account's survival depends on your maximum allowed loss and how much you risk per trade. Divide your maximum allowed loss by your risk per trade to estimate the maximum number of consecutive losing trades before reaching your loss limit. Formula: Maximum Allowed Loss ÷ Risk Per Trade = Consecutive Losing Trades.",
      },
    },
    {
      '@type': 'Question',
      name: 'How many losing trading days can my account survive?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Divide your maximum allowed loss or drawdown by your planned maximum daily loss. For example, with a $2,000 drawdown and $200 maximum daily loss, your account can absorb 10 consecutive fully losing sessions. Formula: Maximum Drawdown ÷ Daily Risk = Consecutive Losing Sessions.',
      },
    },
    {
      '@type': 'Question',
      name: 'How much should I risk per day to survive 20 losing days?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Divide your maximum allowed loss by the number of losing sessions you want your account to survive. For example, with a $2,000 maximum loss and a target of 20 losing sessions: $2,000 ÷ 20 = $100 per day. Your planned maximum daily loss would therefore be $100.',
      },
    },
    {
      '@type': 'Question',
      name: 'How much should I risk per trade if I take 2 trades per day?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'First calculate your maximum daily risk based on your desired survival period. Then divide that daily risk by your maximum number of trades per session. For example: $2,000 ÷ 20 sessions = $100/day. $100 ÷ 2 trades = $50/trade. So risking $50 per trade allows for two maximum-loss trades per day while maintaining the 20-session survival target.',
      },
    },
    {
      '@type': 'Question',
      name: 'What percentage should I risk per trade?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'There is no single risk percentage that is appropriate for every trader or prop firm. Your risk should take into account your maximum drawdown, strategy, trading frequency, and the number of consecutive losses you want your account to withstand. Use the calculator to convert your dollar risk into a percentage of your account size.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the difference between account size and maximum drawdown?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Account size is the nominal value of the account. Maximum drawdown is the amount the account can lose before reaching its loss limit. For example, a $50,000 prop account with a $2,000 maximum drawdown does not have $50,000 of risk capacity. Its relevant survival boundary is $2,000.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I calculate risk per trade for a prop firm account?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Start with the firm's maximum allowed drawdown, decide how many consecutive losing trades or sessions you want to survive, and work backward from that limit. Remember to consider the firm's specific daily loss and maximum drawdown rules.",
      },
    },
    {
      '@type': 'Question',
      name: 'What happens if I lose my maximum daily loss every day?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'If you reach your planned maximum daily loss on every trading session, divide your maximum allowed drawdown by your daily loss to determine how many consecutive losing sessions you can withstand. This represents a worst-case risk scenario, not a prediction of future performance.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is risking 1% per trade safe for a prop firm account?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Not necessarily. A 1% risk per trade may represent a large portion of a prop firm's available drawdown. For example, if a $50,000 account has a $2,000 drawdown, a 1% risk is $500—25% of the entire drawdown. Five consecutive losses of $500 would exhaust the $2,000 drawdown.",
      },
    },
    {
      '@type': 'Question',
      name: 'How can I make my trading account survive longer?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'One way is to reduce the amount you risk per trade or per trading session. Lower risk increases the number of consecutive losses your account can withstand before reaching its maximum allowed loss. Your actual risk should also account for your trading strategy and the rules of your prop firm.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does this calculator predict whether I will lose money?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. The calculator does not predict your trading performance or future losses. It only shows how many consecutive losing trades or trading sessions your account could withstand based on the risk limits you enter.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I use this calculator for prop firm accounts?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Yes. Enter the account's nominal size and use the firm's actual maximum allowed drawdown or loss as your maximum loss. Then enter your planned daily or per-trade risk to see how many consecutive losses your account could theoretically withstand.",
      },
    },
  ],
};

export const metadata = {
  title: 'Account Survival Calculator – Calculate Losing Streak & Risk | ProplogAI',
  description:
    'Calculate how many consecutive losing trades or trading sessions your account can survive. Find your maximum daily or per-trade risk based on your drawdown and survival target.',
  keywords: [
    'account survival calculator',
    'how many losing trades can I survive',
    'prop firm drawdown calculator',
    'risk per trade calculator',
    'daily loss calculator',
    'how much should I risk per trade',
    'prop firm risk calculator',
    'losing streak calculator',
    'drawdown survival calculator',
  ],
  alternates: {
    canonical: 'https://proplogai.com/tools/account-survival-calculator',
  },
  openGraph: {
    title: 'Account Survival Calculator – Calculate Losing Streak & Risk | ProplogAI',
    description:
      'Calculate losing streak capacity and maximum daily or per-trade risk from your drawdown.',
    url: 'https://proplogai.com/tools/account-survival-calculator',
    siteName: 'PropLogAI',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Account Survival Calculator – Losing Streak & Risk | ProplogAI',
    description:
      'Calculate how many consecutive losing trades or sessions your account can survive.',
  },
};

export default function AccountSurvivalCalculatorLayout({ children }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      {children}
    </>
  );
}

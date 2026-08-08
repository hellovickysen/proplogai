const faqStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How do I calculate how many losing days my prop firm account can survive?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Divide your prop firm's maximum allowed drawdown by your planned maximum daily loss. For example, with a $2,000 drawdown and a $200 daily risk, your account can absorb 10 consecutive fully losing sessions before reaching the drawdown limit.",
      },
    },
    {
      '@type': 'Question',
      name: 'How much can I risk per day on a $50K prop firm account?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "It depends on the firm's maximum drawdown, not the account size. A $50,000 account with a $2,000 drawdown has only $2,000 of risk capacity. If you want to survive 20 losing sessions, your maximum daily risk is $2,000 / 20 = $100 per day.",
      },
    },
    {
      '@type': 'Question',
      name: 'How much should I risk per trade if I want to survive 20 losing sessions?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'First calculate your maximum daily risk: divide your maximum drawdown by 20. Then divide that daily risk by the number of trades you take per session. For example, with a $2,000 drawdown: $2,000 / 20 = $100/day. If you take 2 trades per session: $100 / 2 = $50 per trade.',
      },
    },
    {
      '@type': 'Question',
      name: "How do I calculate daily risk from a prop firm's maximum drawdown?",
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Divide the firm's maximum allowed drawdown by the number of consecutive losing sessions you want your account to survive. The result is your maximum planned daily loss. For example, $2,000 drawdown / 20 sessions = $100 per day.",
      },
    },
    {
      '@type': 'Question',
      name: 'What is the difference between daily loss and maximum drawdown?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Maximum drawdown is the total amount your account can lose before the firm closes or resets it. Daily loss is how much you lose in a single trading session. Your daily loss contributes toward the overall drawdown. Some firms also enforce a separate daily loss limit.',
      },
    },
    {
      '@type': 'Question',
      name: 'How much can I risk per trade if I take 2 trades per day?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Divide your maximum planned daily risk by the number of trades per session. If your daily risk is $100 and you take 2 trades, your maximum risk per trade is $50. This keeps your total daily exposure within your planned limit.',
      },
    },
    {
      '@type': 'Question',
      name: 'How many losing sessions can a $50K account survive?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'It depends on the drawdown, not the account size. A $50,000 account with a $2,000 maximum drawdown and $100 daily risk can survive 20 consecutive fully losing sessions. A $50,000 account with a $5,000 drawdown and $100 daily risk can survive 50 sessions.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I convert prop firm drawdown percentage into dollars?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Multiply your account size by the drawdown percentage. For example, a 4% drawdown on a $50,000 account is $50,000 x 0.04 = $2,000. Use the dollar amount for all risk calculations.',
      },
    },
  ],
};

export const metadata = {
  title: 'Prop Firm Survival Calculator – Daily Risk & Losing Streak | ProplogAI',
  description:
    'Calculate how much you can risk per day or per trade based on your prop firm maximum drawdown and how many losing sessions you want your account to survive.',
  keywords: [
    'prop firm survival calculator',
    'prop firm drawdown calculator',
    'how many losing trades can I survive',
    'risk per trade calculator',
    'daily loss calculator',
    'how much should I risk per trade',
    'prop firm risk calculator',
    'losing streak calculator',
    'account survival calculator',
  ],
  alternates: {
    canonical: 'https://proplogai.com/tools/account-survival-calculator',
  },
  openGraph: {
    title: 'Prop Firm Survival Calculator – Daily Risk & Losing Streak | ProplogAI',
    description:
      'Calculate how much you can risk per day or per trade based on your drawdown and survival target.',
    url: 'https://proplogai.com/tools/account-survival-calculator',
    siteName: 'PropLogAI',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prop Firm Survival Calculator | ProplogAI',
    description:
      'Calculate daily risk and per-trade risk from your prop firm drawdown.',
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

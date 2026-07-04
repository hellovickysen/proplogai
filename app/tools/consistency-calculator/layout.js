export const metadata = {
  title: 'Free Consistency Calculator for Prop Firms | PropLogAI',
  description:
    'Check if your largest winning trade satisfies the 20% consistency rule before requesting a payout. Free calculator with live simulation for funded traders.',
  keywords: [
    'consistency calculator',
    'prop firm consistency rule',
    'payout eligibility',
    'prop firm payout calculator',
    'funded trader consistency',
    'consistency rule 20%',
    'prop trading payout',
    'FTMO consistency',
    'instant funding consistency',
  ],
  openGraph: {
    title: 'Free Consistency Calculator for Prop Firms | PropLogAI',
    description:
      'Check if your largest winning trade satisfies the consistency rule. Free calculator with What-If simulator.',
    url: 'https://proplogai.com/tools/consistency-calculator',
    siteName: 'PropLogAI',
    type: 'website',
    images: [
      {
        url: 'https://proplogai.com/og-consistency-calculator.png',
        width: 1344,
        height: 768,
        alt: 'PropLogAI Consistency Calculator — Check your payout eligibility',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prop Firm Consistency Calculator — Free',
    description:
      'Check your payout eligibility under the 20% consistency rule. Includes a What-If simulator.',
    images: ['https://proplogai.com/og-consistency-calculator.png'],
  },
  alternates: {
    canonical: 'https://proplogai.com/tools/consistency-calculator',
  },
};

export default function ConsistencyCalculatorLayout({ children }) {
  return children;
}

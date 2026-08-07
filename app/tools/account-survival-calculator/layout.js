export const metadata = {
  title: 'Account Survival Calculator | Free Prop Trading Tool | PropLogAI',
  description: 'Calculate how many consecutive losing trading sessions your account can absorb from its allowed drawdown and planned maximum daily loss. No login required.',
  keywords: [
    'account survival calculator',
    'prop firm drawdown calculator',
    'daily loss limit calculator',
    'consecutive losing days calculator',
    'prop firm risk calculator',
  ],
  openGraph: {
    title: 'Account Survival Calculator — Free Prop Trading Tool | PropLogAI',
    description: 'Calculate how many consecutive losing trading sessions your configured account can absorb. No login required.',
    url: 'https://proplogai.com/tools/account-survival-calculator',
    siteName: 'PropLogAI',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Account Survival Calculator — Free Prop Trading Tool',
    description: 'Calculate your configured drawdown buffer from your planned maximum daily loss.',
  },
  alternates: { canonical: 'https://proplogai.com/tools/account-survival-calculator' },
};

export default function AccountSurvivalCalculatorLayout({ children }) {
  return children;
}

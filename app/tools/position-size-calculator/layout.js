export const metadata = {
  title: 'Forex Position Size Calculator | PropLogAI',
  description:
    'Calculate forex lot size from your planned USD risk and stop distance. Includes pip mode and price-distance mode for XAUUSD and other symbols.',
  keywords: [
    'forex position size calculator',
    'position size calculator',
    'position sizing calculator',
    'forex lot size calculator',
  ],
  alternates: {
    canonical: 'https://proplogai.com/tools/position-size-calculator',
  },
  openGraph: {
    title: 'Forex Position Size Calculator | PropLogAI',
    description: 'Estimate lot size from planned USD risk, stop distance and the value shown by your platform.',
    url: 'https://proplogai.com/tools/position-size-calculator',
    siteName: 'PropLogAI',
    type: 'website',
    images: [{
      url: 'https://proplogai.com/og-position-size-calculator.webp',
      width: 1200,
      height: 630,
      alt: 'Handwritten position-size calculation flow for forex traders',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Forex Position Size Calculator | PropLogAI',
    description: 'Estimate lot size from planned USD risk, stop distance and platform values.',
    images: ['https://proplogai.com/og-position-size-calculator.webp'],
  },
};

export default function PositionSizeCalculatorLayout({ children }) {
  return children;
}

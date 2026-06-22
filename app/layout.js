import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const space = Space_Grotesk({ subsets: ['latin'], variable: '--font-space', display: 'swap' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata = {
  title: 'PipMind \u2014 AI Forex Trading Journal',
  description: 'Log your forex trades and let AI find your costliest mistake, decode your psychology, and coach you to fix it.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${space.variable} ${inter.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}

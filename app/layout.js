import './globals.css';
import PostHogProvider from '@/components/PostHogProvider';
import { ToastProvider } from '@/components/Toast';

export const metadata = {
  title: 'PropJournal — AI Trading Journal for Prop Firm Traders',
  description: 'The AI-powered trading journal built for prop firm traders. Log trades, track your psychology, manage challenge expenses, and get AI coaching that finds the patterns costing you money.',
  openGraph: {
    title: 'PropJournal — AI Trading Journal for Prop Firm Traders',
    description: 'Log trades, track your psychology, and get AI coaching that finds the patterns costing you money.',
    siteName: 'PropJournal',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PropJournal — AI Trading Journal',
    description: 'AI-powered trading journal for prop firm traders.',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <PostHogProvider>
          <ToastProvider>{children}</ToastProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}

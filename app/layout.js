import './globals.css';
import PostHogProvider from '@/components/layout/PostHogProvider';
import { ToastProvider } from '@/components/ui/Toast';

export const metadata = {
  metadataBase: new URL('https://proplogai.com'),
  title: 'PropLogAI — AI Trading Journal for Prop Firm Traders',
  description: 'Still losing funded accounts to the same mistakes? PropLogAI is an AI-powered trading journal that finds the one pattern costing you money. Free beta — join 500 traders.',
  openGraph: {
    title: 'Still losing funded accounts to the same mistakes?',
    description: 'AI-powered trading journal that finds the pattern costing you funded accounts. Log trades, track psychology, get AI coaching. Free beta.',
    siteName: 'PropLogAI',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Still losing funded accounts to the same mistakes?',
    description: 'AI-powered trading journal that finds the pattern costing you funded accounts. Free beta — join now.',
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
      <body className="min-h-screen antialiased" style={{ overflowX: 'clip', width: '100%', maxWidth: '100vw' }}>
        <div style={{ overflowX: 'hidden', width: '100%', maxWidth: '100vw' }}>
          <PostHogProvider>
            <ToastProvider>{children}</ToastProvider>
          </PostHogProvider>
        </div>
      </body>
    </html>
  );
}

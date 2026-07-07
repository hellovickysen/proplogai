import './globals.css';
import Script from 'next/script';
import PostHogProvider from '@/components/layout/PostHogProvider';
import { ToastProvider } from '@/components/ui/Toast';

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

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
        {GTM_ID && (
          <Script id="gtm" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${GTM_ID}');`}
          </Script>
        )}
      </head>
      <body className="min-h-screen antialiased overflow-x-hidden">
        {GTM_ID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        )}
        <PostHogProvider>
          <ToastProvider>{children}</ToastProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}

import { Suspense } from 'react';
import { Poppins, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Script from 'next/script';
import { ToastProvider } from '@/components/ui/Toast';
import NavigationLoader from '@/components/layout/NavigationLoader';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-poppins',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
});

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
    <html lang="en" className={`${poppins.variable} ${jetbrainsMono.variable}`}>
      <head>
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
        <Suspense fallback={null}>
          <NavigationLoader />
        </Suspense>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

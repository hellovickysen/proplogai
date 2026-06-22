import './globals.css';
import PostHogProvider from '@/components/PostHogProvider';
import { ToastProvider } from '@/components/Toast';

export const metadata = {
  title: 'PipMind — AI Forex Trading Journal',
  description: 'Log your forex trades and let AI find your costliest mistake, decode your psychology, and coach you to fix it.',
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

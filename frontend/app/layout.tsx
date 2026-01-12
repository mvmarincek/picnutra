import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { FeedbackProvider } from '@/lib/feedback';
import FeedbackModal from '@/components/FeedbackModal';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'] });

const ADSENSE_CLIENT_ID = 'ca-pub-3364979853180818';

export const metadata: Metadata = {
  title: 'Nutri-Vision Web',
  description: 'Analise suas refeições com IA e receba sugestões nutricionais personalizadas',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Nutri-Vision'
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#10b981'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.svg" />
        <meta name="google-adsense-account" content={ADSENSE_CLIENT_ID} />
      </head>
      <body className={inter.className}>
        <FeedbackProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
          <FeedbackModal />
        </FeedbackProvider>
        <Script
          id="adsense-script"
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'HUUM — Hear the whole room',
  description:
    'A social platform for constructive discourse. Every voice matters. Beyond the bubble.',
  keywords: ['social media', 'free speech', 'discourse', 'community', 'diverse perspectives'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-gray-50 font-sans text-gray-900 antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { borderRadius: '12px', background: '#1f2937', color: '#fff' },
          }}
        />
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import Providers from './Providers';
import SmoothScroll from '@/components/SmoothScroll';
import Navbar from '@/components/Navbar';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const playfairDisplay = Playfair_Display({
  variable: '--font-display',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Cinema Paradiso',
  description: 'A cinematic discovery website for Hollywood and Tamil movies and series.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfairDisplay.variable} dark`}
      style={{ backgroundColor: '#07070b' }}
    >
      <body
        className="min-h-screen text-[#f4f4f5] antialiased relative"
        style={{
          backgroundColor: '#07070b',
          fontFamily: 'var(--font-inter), sans-serif',
        }}
      >
        {/* Fixed background radial amber glow */}
        <div
          className="fixed inset-0 pointer-events-none -z-10"
          style={{
            background:
              'radial-gradient(circle 600px at 50% 0%, rgba(245, 165, 36, 0.06), transparent 100%)',
          }}
          aria-hidden="true"
        />

        <Providers>
          <SmoothScroll>
            <Navbar />
            <main className="min-h-screen pt-[100px] max-w-[1600px] mx-auto px-6">
              {children}
            </main>
          </SmoothScroll>
        </Providers>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { Space_Grotesk } from 'next/font/google';
import { ThemeProvider } from '@/providers/theme-provider';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const spaceGrotesk = Space_Grotesk({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://trykristin.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Kristin',
    template: '%s | Kristin',
  },
  description:
    'Discover movies and TV shows through community-driven recommendations.',
  openGraph: {
    type: 'website',
    siteName: 'Kristin',
    title: 'Kristin',
    description:
      'Discover movies and TV shows through community-driven recommendations.',
    url: siteUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kristin',
    description:
      'Discover movies and TV shows through community-driven recommendations.',
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${spaceGrotesk.variable} font-sans antialiased`}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

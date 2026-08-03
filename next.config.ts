import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const securityHeaders = [
  // Prevent clickjacking — only allow same origin to iframe
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Prevent MIME type sniffing — browser trusts the Content-Type header
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Control referrer information — only send origin, never the full URL path
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Restrict browser features — disable camera, microphone, geolocation
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  // Force HTTPS — tell browsers to always use HTTPS for this domain
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
];

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['framer-motion', 'lucide-react', 'sonner'],
  },
  images: {
    // Resize on TMDB's CDN instead of Vercel's Image Optimization. TMDB already
    // serves pre-sized variants, so optimizing them again spends transformation
    // quota (5,000/month on Hobby) for no benefit — and once exhausted, new
    // images return HTTP 402 and render as alt text. See src/lib/tmdb/image-loader.ts.
    loader: 'custom',
    loaderFile: './src/lib/tmdb/image-loader.ts',
    // A custom loader bypasses the built-in optimizer, so remotePatterns no
    // longer applies. It's kept because it documents the only remote host we
    // render, and it becomes load-bearing again if the loader is ever removed.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        pathname: '/t/p/**',
      },
    ],
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default withNextIntl(nextConfig);

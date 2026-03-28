import type { MetadataRoute } from 'next';

/**
 * Robots.txt — controls what search engine crawlers can access.
 *
 * Strategy:
 * - Allow all public content pages (discover, search, media detail, profiles)
 * - Block auth pages (no SEO value, wastes crawl budget)
 * - Block API routes and Next.js internals
 * - Block filtered/sorted URLs to prevent duplicate content indexing
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://trykristin.vercel.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/', '/*/login', '/*/signup', '/*/lists'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

/**
 * GET /api/og
 *
 * Generates dynamic Open Graph images for social sharing.
 * Accepts: title, type (movie|tv), rating, year
 *
 * Example: /api/og?title=Breaking+Bad&type=tv&rating=9.5&year=2008
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = searchParams.get('title') || 'Kristin';
  const type = searchParams.get('type') || '';
  const rating = searchParams.get('rating') || '';
  const year = searchParams.get('year') || '';

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '60px',
        background:
          'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        fontFamily: 'sans-serif',
      }}
    >
      {/* Decorative circles */}
      <div
        style={{
          position: 'absolute',
          top: -60,
          right: -60,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'rgba(124, 58, 237, 0.15)',
          filter: 'blur(40px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -40,
          left: -40,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'rgba(124, 58, 237, 0.1)',
          filter: 'blur(40px)',
        }}
      />

      {/* Brand */}
      <div
        style={{
          position: 'absolute',
          top: 40,
          left: 60,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 24,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #7C3AED, #9F67FF)',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          Kristin
        </span>
      </div>

      {/* Meta badges */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        {type && (
          <span
            style={{
              background: 'rgba(124, 58, 237, 0.2)',
              color: '#a78bfa',
              padding: '6px 16px',
              borderRadius: 999,
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            {type === 'movie' ? 'Movie' : 'TV Show'}
          </span>
        )}
        {year && (
          <span
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#94a3b8',
              padding: '6px 16px',
              borderRadius: 999,
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            {year}
          </span>
        )}
        {rating && (
          <span
            style={{
              background: 'rgba(250, 204, 21, 0.15)',
              color: '#fbbf24',
              padding: '6px 16px',
              borderRadius: 999,
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            ★ {rating}
          </span>
        )}
      </div>

      {/* Title */}
      <h1
        style={{
          fontSize: title.length > 30 ? 48 : 64,
          fontWeight: 700,
          color: '#ffffff',
          lineHeight: 1.1,
          margin: 0,
          maxWidth: '90%',
        }}
      >
        {title}
      </h1>

      {/* Tagline */}
      <p
        style={{
          fontSize: 18,
          color: '#94a3b8',
          marginTop: 16,
        }}
      >
        Community-powered recommendations
      </p>
    </div>,
    {
      width: 1200,
      height: 630,
    },
  );
}

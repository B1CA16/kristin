import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/health
 *
 * Health check endpoint for uptime monitoring.
 * Verifies Supabase connectivity by running a simple query.
 * Returns 200 if healthy, 503 if database is unreachable.
 */
export async function GET() {
  const start = Date.now();

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .single();

    // PGRST116 = no rows found — that's fine, DB is reachable
    if (error && error.code !== 'PGRST116') {
      return NextResponse.json(
        {
          status: 'unhealthy',
          database: 'error',
          error: error.message,
          latency: Date.now() - start,
        },
        { status: 503 },
      );
    }

    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      latency: Date.now() - start,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      {
        status: 'unhealthy',
        database: 'unreachable',
        latency: Date.now() - start,
      },
      { status: 503 },
    );
  }
}

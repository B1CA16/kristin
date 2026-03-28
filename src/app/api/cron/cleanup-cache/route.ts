import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

/**
 * POST /api/cron/cleanup-cache
 *
 * Deletes expired rows from the media_cache table.
 * Called by a scheduled GitHub Actions workflow (or external cron).
 * Protected by a secret token in the Authorization header.
 */
export async function POST(request: NextRequest) {
  // Verify the cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('media_cache')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select('id');

    if (error) {
      logger.error('Cache cleanup failed', { error: error.message });
      return NextResponse.json(
        { error: 'Cleanup failed', details: error.message },
        { status: 500 },
      );
    }

    const deletedCount = data?.length ?? 0;
    logger.info('Cache cleanup completed', { deletedCount });

    return NextResponse.json({
      status: 'ok',
      deleted: deletedCount,
      timestamp: new Date().toISOString(),
    });
  } catch {
    logger.error('Cache cleanup crashed');
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

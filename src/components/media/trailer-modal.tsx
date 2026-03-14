'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { Video } from '@/lib/tmdb/types';

type TrailerModalProps = {
  videos: Video[];
};

/**
 * Button that opens a modal with a YouTube trailer embed.
 * Picks the best trailer: official YouTube trailers first,
 * then teasers, then any YouTube video.
 */
export function TrailerModal({ videos }: TrailerModalProps) {
  const t = useTranslations('media');
  const [open, setOpen] = useState(false);

  const trailer = pickTrailer(videos);
  if (!trailer) return null;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5"
      >
        <Play className="size-4" />
        {t('playTrailer')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl overflow-hidden p-0">
          <DialogTitle className="sr-only">{trailer.name}</DialogTitle>
          <div className="relative aspect-video w-full">
            <iframe
              src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1&rel=0`}
              title={trailer.name}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Picks the best video to use as a trailer.
 * Priority: official trailer > official teaser > any YouTube video.
 */
function pickTrailer(videos: Video[]): Video | null {
  const youtube = videos.filter((v) => v.site === 'YouTube');
  if (youtube.length === 0) return null;

  const officialTrailer = youtube.find(
    (v) => v.type === 'Trailer' && v.official,
  );
  if (officialTrailer) return officialTrailer;

  const anyTrailer = youtube.find((v) => v.type === 'Trailer');
  if (anyTrailer) return anyTrailer;

  const teaser = youtube.find((v) => v.type === 'Teaser');
  if (teaser) return teaser;

  return youtube[0];
}

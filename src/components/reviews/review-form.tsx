'use client';

import { useCallback, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';

import { toast } from 'sonner';
import { inputClass, textareaClass } from '@/lib/styles';
import { trackEvent } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StarRating } from '@/components/reviews/star-rating';
import { createReview, updateReview } from '@/actions/reviews';

type ReviewFormProps = {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  isLoggedIn: boolean;
  /** If provided, the form is in edit mode. */
  existingReview?: {
    id: string;
    rating: number;
    title: string | null;
    body: string | null;
  } | null;
  /** Called after successful submit to refresh data. */
  onSuccess?: () => void;
};

export function ReviewForm({
  tmdbId,
  mediaType,
  isLoggedIn,
  existingReview,
  onSuccess,
}: ReviewFormProps) {
  const t = useTranslations('reviews');
  const isEditing = !!existingReview;

  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [title, setTitle] = useState(existingReview?.title ?? '');
  const [body, setBody] = useState(existingReview?.body ?? '');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const resetForm = useCallback(() => {
    setRating(existingReview?.rating ?? 0);
    setTitle(existingReview?.title ?? '');
    setBody(existingReview?.body ?? '');
    setError('');
  }, [existingReview]);

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    if (!isOpen) resetForm();
  }

  const handleSubmit = useCallback(() => {
    if (rating === 0) {
      setError(t('ratingRequired'));
      return;
    }

    setError('');
    startTransition(async () => {
      const input = {
        rating,
        title: title.trim() || undefined,
        body: body.trim() || undefined,
      };

      const result = isEditing
        ? await updateReview(existingReview.id, input)
        : await createReview({ tmdbId, mediaType }, input);

      if (result.error) {
        setError(result.error);
        return;
      }

      trackEvent('review_submitted', {
        media_type: mediaType,
        tmdb_id: tmdbId,
        rating,
        is_edit: isEditing,
      });
      setOpen(false);
      resetForm();
      onSuccess?.();
      toast.success(isEditing ? t('reviewUpdated') : t('reviewSubmitted'));
    });
  }, [
    rating,
    title,
    body,
    isEditing,
    existingReview,
    tmdbId,
    mediaType,
    resetForm,
    onSuccess,
    t,
  ]);

  if (!isLoggedIn) {
    return (
      <Button variant="outline" size="sm" disabled>
        {t('loginToReview')}
      </Button>
    );
  }

  return (
    <>
      <Button
        variant={isEditing ? 'ghost' : 'outline'}
        size="sm"
        onClick={() => setOpen(true)}
      >
        {isEditing ? t('editReview') : t('writeReview')}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? t('editReview') : t('writeReview')}
            </DialogTitle>
            <DialogDescription>
              {t('rateThis', {
                mediaType: mediaType === 'movie' ? t('movie') : t('tvShow'),
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Star rating */}
            <div>
              <label className="text-muted-foreground mb-2 block text-sm">
                {t('yourRating')}
              </label>
              <StarRating
                interactive
                rating={rating}
                onChange={setRating}
                size="lg"
              />
            </div>

            {/* Title */}
            <div>
              <label
                htmlFor="review-title"
                className="text-muted-foreground mb-1.5 block text-sm"
              >
                {t('titleOptional')}
              </label>
              <input
                id="review-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('titlePlaceholder')}
                maxLength={150}
                className={inputClass}
                autoComplete="off"
              />
            </div>

            {/* Body */}
            <div>
              <label
                htmlFor="review-body"
                className="text-muted-foreground mb-1.5 block text-sm"
              >
                {t('bodyOptional')}
              </label>
              <textarea
                id="review-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={t('bodyPlaceholder')}
                rows={4}
                maxLength={2000}
                className={textareaClass}
              />
            </div>

            {error && <p className="text-destructive text-sm">{error}</p>}

            <Button
              onClick={handleSubmit}
              disabled={isPending || rating === 0}
              className="w-full"
            >
              {isPending
                ? t('submitting')
                : isEditing
                  ? t('updateReview')
                  : t('submitReview')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

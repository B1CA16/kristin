import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  const t = useTranslations('notFound');

  return (
    <div className="noise-texture relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 text-center">
      <div className="blob bg-primary/10 absolute -top-20 -left-20 size-72" />
      <div className="blob bg-primary/[0.06] absolute -right-20 -bottom-20 size-64" />

      <div className="relative z-10">
        <h1 className="font-display text-gradient text-8xl font-bold sm:text-9xl">
          404
        </h1>
        <p className="text-muted-foreground mt-4 text-lg">{t('description')}</p>
        <Button className="mt-8 rounded-full px-8" asChild>
          <Link href="/">{t('goHome')}</Link>
        </Button>
      </div>
    </div>
  );
}

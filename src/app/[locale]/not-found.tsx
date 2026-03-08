import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function NotFound() {
  const t = useTranslations('notFound');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-bold tracking-tight">404</h1>
      <p className="text-muted-foreground mt-4 text-lg">{t('description')}</p>
      <Link
        href="/"
        className="mt-8 text-sm font-medium underline underline-offset-4"
      >
        {t('goHome')}
      </Link>
    </div>
  );
}

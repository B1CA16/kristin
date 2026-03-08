import { useTranslations } from 'next-intl';

export function Footer() {
  const t = useTranslations('common');
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-border/50 border-t">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <p className="text-muted-foreground text-sm">
          &copy; {currentYear} Kristin. {t('allRightsReserved')}
        </p>
      </div>
    </footer>
  );
}

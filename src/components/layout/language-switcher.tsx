'use client';

import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { locales, localeNames, type Locale } from '@/i18n/config';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations('common');

  function handleSelect(loc: Locale) {
    const search = searchParams.toString();
    const href = search ? `${pathname}?${search}` : pathname;
    router.replace(href, { locale: loc });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('changeLanguage')}>
          <Globe size={18} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => handleSelect(loc)}
            className={loc === locale ? 'text-primary font-medium' : ''}
          >
            {localeNames[loc]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

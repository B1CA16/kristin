'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { User, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Props = {
  username: string;
  avatarUrl: string | null;
};

export function UserMenu({ username, avatarUrl }: Props) {
  const t = useTranslations('common');
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('userMenu')}>
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={username}
              width={24}
              height={24}
              className="rounded-full object-cover"
            />
          ) : (
            <User size={18} />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          disabled
          className="text-muted-foreground font-medium"
        >
          {username}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut size={16} />
          {t('logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

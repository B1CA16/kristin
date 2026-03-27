import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { LoginForm } from './login-form';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth' });
  return { title: t('login') };
}

export default async function LoginPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/');
  }

  return (
    <div className="noise-texture relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="blob bg-primary/10 absolute -top-20 -right-20 size-80" />
      <div className="blob bg-primary/[0.06] absolute -bottom-20 -left-20 size-72" />
      <div className="relative z-10">
        <LoginForm />
      </div>
    </div>
  );
}

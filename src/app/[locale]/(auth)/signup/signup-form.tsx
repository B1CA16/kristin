'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { inputClass } from '@/lib/styles';

export function SignupForm() {
  const t = useTranslations('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.user?.identities?.length === 0) {
      setError(t('emailAlreadyExists'));
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="bg-card w-full max-w-sm space-y-4 rounded-3xl p-8 text-center shadow-xl">
        <h1 className="font-display text-3xl font-bold">{t('checkEmail')}</h1>
        <p className="text-muted-foreground text-sm">{t('confirmationSent')}</p>
      </div>
    );
  }

  return (
    <div className="bg-card w-full max-w-sm space-y-6 rounded-3xl p-8 shadow-xl">
      <div className="space-y-2 text-center">
        <Link href="/" className="mb-2 inline-block">
          <Image
            src="/kristin_logo.svg"
            alt="Kristin"
            width={40}
            height={40}
            className="mx-auto size-10"
          />
        </Link>
        <h1 className="font-display text-3xl font-bold">{t('signUp')}</h1>
        <p className="text-muted-foreground text-sm">{t('signUpSubtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            {t('email')}
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputClass}
            placeholder={t('emailPlaceholder')}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            {t('password')}
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className={inputClass}
            placeholder={t('passwordPlaceholder')}
          />
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <Button
          type="submit"
          disabled={loading}
          className="w-full rounded-full"
        >
          {loading ? t('signingUp') : t('signUp')}
        </Button>
      </form>

      <p className="text-muted-foreground text-center text-sm">
        {t('hasAccount')}{' '}
        <Link
          href="/login"
          className="text-primary font-medium hover:underline"
        >
          {t('login')}
        </Link>
      </p>
    </div>
  );
}

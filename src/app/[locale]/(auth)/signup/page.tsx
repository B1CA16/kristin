import { setRequestLocale } from 'next-intl/server';
import { SignupForm } from './signup-form';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function SignupPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <SignupForm />
    </div>
  );
}

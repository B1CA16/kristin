import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';

type Props = {
  children: React.ReactNode;
};

export default function MainLayout({ children }: Props) {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="bg-primary text-primary-foreground sr-only fixed top-4 left-1/2 z-[100] -translate-x-1/2 rounded-full px-6 py-2 text-sm font-medium shadow-lg focus:not-sr-only"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}

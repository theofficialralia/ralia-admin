import { ThemeToggle } from '@/components/layout/ThemeToggle';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-wash px-4">
      <div className="absolute right-5 top-5">
        <ThemeToggle />
      </div>
      {children}
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '../ThemeProvider';
import { useAuth } from '../AuthProvider';

const bottomNavLinks = [
  { label: 'Home', href: '/dashboard', icon: 'dashboard' },
  { label: 'Services', href: '/book/service', icon: 'content_cut' },
  { label: 'Book', href: '/book/time', icon: 'calendar_today' },
  { label: 'Queue', href: '/dashboard', icon: 'groups' },
];

export function CustomerTopNav({ showBack = false, title = 'Selor' }: { showBack?: boolean; title?: string }) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  return (
    <nav className="bg-background/80 backdrop-blur-md sticky top-0 z-50 border-b border-outline-variant shadow-sm">
      <div className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          {showBack ? (
            <button
              onClick={() => router.back()}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors text-on-surface"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
          ) : null}
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary-container bg-surface-container-high flex items-center justify-center md:hidden">
              <span className="material-symbols-outlined text-primary text-sm">content_cut</span>
            </div>
            <span className="text-lg font-bold tracking-widest text-on-surface uppercase">{title}</span>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-surface-container transition-colors text-outline hover:text-primary"
            aria-label="Toggle Theme"
          >
            <span className="material-symbols-outlined">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
          </button>
          {loading ? null : user && (user as any).role === 'admin' ? (
            <Link href="/admin" className="text-outline hover:text-primary text-sm font-medium transition-colors hidden md:block border border-outline-variant px-3 py-1 rounded-full hover:bg-surface-container">
              Admin Portal
            </Link>
          ) : null}
          {loading ? null : user ? (
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-outline-variant hover:bg-surface-container text-sm font-medium transition-colors text-on-surface"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span className="hidden md:inline">Sign Out</span>
            </button>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-container text-on-primary-container text-sm font-medium transition-all hover:brightness-110 shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">login</span>
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

export function CustomerBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-4 py-3 bg-background border-t border-outline-variant shadow-[0_-10px_30px_rgba(0,0,0,0.03)] z-50 rounded-t-xl pb-safe">
      {bottomNavLinks.map((link) => {
        const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));
        return (
          <Link
            key={link.label}
            href={link.href}
            className={`flex flex-col items-center justify-center gap-1 text-[11px] font-medium uppercase tracking-wider transition-transform ${
              isActive ? 'text-primary scale-105' : 'text-outline hover:text-primary'
            }`}
          >
            <span
              className="material-symbols-outlined text-2xl"
              style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {link.icon}
            </span>
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

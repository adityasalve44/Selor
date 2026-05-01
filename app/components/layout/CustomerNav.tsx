"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "../ThemeProvider";
import { useAuth } from "../AuthProvider";

const bottomNavLinks = [
  { label: "Home", href: "/dashboard", icon: "dashboard" },
  { label: "Services", href: "/book/service", icon: "content_cut" },
  { label: "Book", href: "/book/time", icon: "calendar_today" },
  { label: "Queue", href: "/dashboard", icon: "groups" },
];

export function CustomerTopNav({
  showBack = false,
  title = "The Selor",
}: {
  showBack?: boolean;
  title?: string;
}) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  return (
    <nav className="bg-surface sticky top-0 z-50 transition-all duration-500">
      <div className="flex justify-between items-center w-full px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-6">
          {showBack ? (
            <button
              onClick={() => router.back()}
              className="w-12 h-12 flex items-center justify-center rounded-md bg-surface-container-low hover:bg-surface-container-high transition-all text-on-surface shadow-technical active:scale-95"
            >
              <span className="material-symbols-outlined text-lg">
                arrow_back
              </span>
            </button>
          ) : null}
          <Link href="/dashboard" className="flex items-center gap-4 group">
            <div className="w-11 h-11 rounded-md overflow-hidden bg-primary flex items-center justify-center shadow-technical transition-transform group-hover:scale-105">
              <span className="material-symbols-outlined text-on-primary text-xl">
                architecture
              </span>
            </div>
            <div className="flex flex-col -gap-1">
              <span className="text-xl font-display-lg text-on-surface tracking-tighter lowercase leading-none">
                Selor<span className="text-primary">.</span>
              </span>
              <span className="text-[9px] font-label-md uppercase tracking-[0.3em] text-on-surface-variant opacity-40">
                Precision Grooming
              </span>
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-5">
          <button
            onClick={toggleTheme}
            className="w-11 h-11 flex items-center justify-center rounded-md bg-surface-container-low hover:bg-surface-container-high transition-all text-outline hover:text-primary active:scale-90"
            aria-label="Toggle Theme"
          >
            <span className="material-symbols-outlined text-[20px]">
              {theme === "dark" ? "light_mode" : "dark_mode"}
            </span>
          </button>
          {loading ? null : user && (user as any).role === "admin" ? (
            <Link
              href="/admin"
              className="text-on-surface-variant font-label-md uppercase tracking-[0.2em] text-[10px] opacity-40 hover:opacity-100 transition-all px-4 py-2 rounded-md hover:bg-surface-container-low"
            >
              Portal
            </Link>
          ) : null}
          {loading ? null : user ? (
            <button
              onClick={signOut}
              className="flex items-center gap-3 px-6 py-3 rounded-md bg-surface-container-low hover:bg-surface-container-high text-[10px] font-label-md transition-all text-on-surface-variant uppercase tracking-[0.2em] active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">
                logout
              </span>
              <span className="hidden md:inline">Sign Out</span>
            </button>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="flex items-center gap-3 px-8 py-3 rounded-md bg-primary text-on-primary text-[10px] font-label-md transition-all hover:opacity-90 shadow-technical uppercase tracking-[0.2em] active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">
                login
              </span>
              <span>Authenticate</span>
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
    <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-lg flex justify-around items-center px-8 py-6 bg-surface-container-low/80 backdrop-blur-xl rounded-full shadow-technical z-50 pb-safe border border-white/5">
      {bottomNavLinks.map((link) => {
        const isActive =
          pathname === link.href ||
          (link.href !== "/dashboard" && pathname.startsWith(link.href));
        return (
          <Link
            key={link.label}
            href={link.href}
            className={`flex flex-col items-center justify-center gap-2 transition-all duration-500 ${
              isActive
                ? "text-primary scale-110"
                : "text-on-surface-variant opacity-40 hover:opacity-100"
            }`}
          >
            <span
              className="material-symbols-outlined text-[26px]"
              style={
                isActive ? { fontVariationSettings: "'FILL' 1" } : undefined
              }
            >
              {link.icon}
            </span>
            <span className="text-[9px] font-label-md uppercase tracking-[0.2em]">
              {link.label}
            </span>
            {isActive && (
              <div className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_var(--color-primary)]"></div>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

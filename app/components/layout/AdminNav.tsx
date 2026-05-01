"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "../ThemeProvider";
import { useAuth } from "../AuthProvider";
import { useState } from "react";

const allNavLinks = [
  { label: "Dashboard", href: "/admin", icon: "dashboard" },
  { label: "Queue", href: "/admin/queue", icon: "reorder" },
  { label: "Bookings", href: "/admin/bookings", icon: "calendar_month" },
  { label: "Inventory", href: "/admin/inventory", icon: "inventory_2" },
  { label: "Staff", href: "/admin/staff", icon: "badge" },
  { label: "Services", href: "/admin/services", icon: "content_cut" },
  { label: "Clients", href: "/admin/clients", icon: "groups" },
  { label: "Settings", href: "/admin/settings", icon: "settings" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-80 bg-surface-container-low z-[60] shadow-technical">
      <div className="p-10 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-4 group">
          <div className="w-12 h-12 rounded-md overflow-hidden bg-primary flex items-center justify-center shadow-technical transition-transform group-hover:scale-105">
            <span className="material-symbols-outlined text-on-primary text-2xl">
              architecture
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-display-lg text-on-surface tracking-tighter lowercase leading-none">Selor<span className="text-primary">.</span></span>
            <span className="text-[9px] font-label-md uppercase tracking-[0.3em] text-on-surface-variant opacity-40">Command Center</span>
          </div>
        </Link>
      </div>

      <div className="px-10 pb-10">
        {user && (
          <div className="flex items-center gap-5 p-6 rounded-md bg-surface-container-high shadow-inner border border-white/5">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-on-primary font-display-lg text-xl shadow-technical">
              {user.name?.[0] || user.email[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-display-lg text-on-surface truncate tracking-tighter lowercase leading-tight">
                {user.name || "Admin"}
              </p>
              <p className="text-[9px] text-on-surface-variant opacity-40 truncate uppercase tracking-[0.2em] font-bold">
                {user.role}
              </p>
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 px-8 space-y-3 overflow-y-auto mt-8">
        <div className="px-5 mb-8">
           <span className="text-[9px] font-bold tracking-[0.3em] text-on-surface-variant opacity-40 uppercase">Manifest Registry</span>
        </div>
        {allNavLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.label}
              href={link.href}
              className={`flex items-center gap-5 px-6 py-5 rounded-md transition-all group relative overflow-hidden ${
                isActive
                  ? "bg-primary text-on-primary shadow-technical"
                  : "text-on-surface-variant opacity-40 hover:opacity-100 hover:bg-surface-container-high"
              }`}
            >
              <span
                className={`material-symbols-outlined text-[22px] transition-transform duration-300 ${isActive ? "text-on-primary" : "text-outline group-hover:scale-110"}`}
                style={
                  isActive ? { fontVariationSettings: "'FILL' 1" } : undefined
                }
              >
                {link.icon}
              </span>
              <span className="tracking-[0.15em] uppercase text-[10px] font-bold">
                {link.label}
              </span>
              {isActive && (
                 <div className="absolute left-0 w-1.5 h-full bg-white/20"></div>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-8 space-y-3">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-5 px-6 py-4 rounded-md bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-[20px] opacity-40">
            {theme === "dark" ? "light_mode" : "dark_mode"}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
             {theme === "dark" ? "Luminescence" : "Obscurity"}
          </span>
        </button>
        <Link
          href="/dashboard"
          className="w-full flex items-center gap-5 px-6 py-4 rounded-md bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest transition-all border border-white/5 active:scale-95 group"
        >
          <span className="material-symbols-outlined text-[20px] text-primary opacity-60 group-hover:opacity-100 transition-opacity">
            visibility
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
            Studio View
          </span>
        </Link>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-5 px-6 py-4 rounded-md text-error/60 hover:text-error hover:bg-error/5 transition-all active:scale-95 group"
        >
          <span className="material-symbols-outlined text-[20px] transition-transform group-hover:rotate-12">logout</span>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
            De-authenticate
          </span>
        </button>
      </div>
    </aside>
  );
}

export function AdminTopNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { signOut } = useAuth();

  return (
    <>
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b border-outline-variant/30">
        <div className="flex justify-between items-center px-6 py-4">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg overflow-hidden border border-primary-container bg-surface-container-high flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-lg">
                content_cut
              </span>
            </div>
            <h1 className="text-sm font-bold tracking-[0.15em] text-on-surface uppercase">
              Selor
            </h1>
          </Link>

          <div className="flex items-center gap-1">
            <Link
              href="/admin/clients"
              className="p-2 rounded-full text-outline hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[22px]">
                notifications
              </span>
            </Link>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-outline hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[22px]">
                {theme === "dark" ? "light_mode" : "dark_mode"}
              </span>
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 ml-1 rounded-full text-outline hover:text-primary transition-colors"
              aria-label="Toggle Menu"
            >
              <span className="material-symbols-outlined text-[30px]">
                {isMenuOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <div
        className={`lg:hidden fixed inset-0 z-[100] transition-all duration-500 ${isMenuOpen ? "visible" : "invisible"}`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/80 transition-opacity duration-500 ${isMenuOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setIsMenuOpen(false)}
        />

        {/* Drawer Content */}
        <div
          className={`absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-surface-container-low shadow-technical border-l border-white/5 transition-transform duration-500 ease-out ${isMenuOpen ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="p-10 flex flex-col h-full">
            <div className="flex justify-between items-center mb-12">
               <div className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                  <span className="text-[10px] font-bold tracking-[0.3em] text-on-surface-variant opacity-40 uppercase">Manifest</span>
               </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="text-on-surface-variant opacity-40 hover:opacity-100 transition-all"
              >
                <span className="material-symbols-outlined text-[28px]">close</span>
              </button>
            </div>

            <nav className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
              {allNavLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-6 px-6 py-5 rounded-md transition-all ${
                      isActive
                        ? "bg-primary text-on-primary shadow-technical"
                        : "text-on-surface-variant opacity-60 hover:opacity-100 hover:bg-surface-container-high"
                    }`}
                  >
                    <span
                      className="material-symbols-outlined text-[24px]"
                      style={
                        isActive
                          ? { fontVariationSettings: "'FILL' 1" }
                          : undefined
                      }
                    >
                      {link.icon}
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-[0.1em]">
                      {link.label}
                    </span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-12 pt-12 space-y-4">
              <Link
                href="/dashboard"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-6 px-6 py-5 rounded-md bg-surface-container-high/50 text-on-surface transition-all active:scale-95 border border-white/5"
              >
                <span className="material-symbols-outlined text-primary opacity-60">
                  visibility
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                  Studio View
                </span>
              </Link>
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  signOut();
                }}
                className="w-full flex items-center gap-6 px-6 py-5 rounded-md text-error/60 hover:text-error hover:bg-error/5 transition-all active:scale-95"
              >
                <span className="material-symbols-outlined">logout</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                  De-authenticate
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function AdminBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-lg bg-surface-container-low/80 backdrop-blur-xl rounded-full shadow-technical z-50 pb-safe border border-white/5 flex justify-around items-center px-6 py-4">
      {allNavLinks.slice(0, 5).map((link) => {
        const isActive = link.href === pathname;
        return (
          <Link
            key={link.label}
            href={link.href}
            className={`flex flex-col items-center justify-center gap-2 transition-all duration-500 ${
              isActive
                ? "text-primary scale-110"
                : "text-on-surface-variant opacity-40"
            }`}
          >
            <span
              className="material-symbols-outlined text-[24px]"
              style={
                isActive ? { fontVariationSettings: "'FILL' 1" } : undefined
              }
            >
              {link.icon}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-[0.1em]">
              {link.label}
            </span>
            {isActive && <div className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_var(--color-primary)]"></div>}
          </Link>
        );
      })}
    </nav>
  );
}

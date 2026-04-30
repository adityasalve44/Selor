"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "../ThemeProvider";
import { useAuth } from "../AuthProvider";
import { useState } from "react";

const adminLinks = [
  { label: "Dashboard", href: "/admin", icon: "dashboard" },
  { label: "Queue", href: "/admin/queue", icon: "reorder" },
  { label: "Bookings", href: "/admin/bookings", icon: "calendar_month" },
  { label: "Staff", href: "/admin/staff", icon: "badge" },
  { label: "Inventory", href: "/admin/inventory", icon: "inventory_2" },
];

const allNavLinks = [
  ...adminLinks,
  { label: "Services", href: "/admin/services", icon: "content_cut" },
  { label: "Clients", href: "/admin/clients", icon: "groups" },
  { label: "Settings", href: "/admin/settings", icon: "settings" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-72 bg-surface-container-low border-r border-outline-variant/30 z-[60]">
      <div className="p-8 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden border-2 border-primary-container bg-surface-container-high flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-xl">
              content_cut
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-[0.2em] text-on-surface uppercase">
            Selor
          </h1>
        </Link>
      </div>

      <div className="px-8 pb-6 border-b border-outline-variant/10">
        {user && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-high/50">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {user.name?.[0] || user.email[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-on-surface truncate">
                {user.name || "Admin"}
              </p>
              <p className="text-[10px] text-outline truncate uppercase tracking-tighter">
                {user.role}
              </p>
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto mt-6">
        <p className="px-5 text-[10px] font-bold tracking-[0.15em] text-outline uppercase mb-4 mt-2">
          Management
        </p>
        {allNavLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.label}
              href={link.href}
              className={`flex items-center gap-4 px-5 py-3.5 rounded-xl font-label-md transition-all group ${
                isActive
                  ? "bg-primary text-on-primary shadow-lg shadow-primary/20"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              }`}
            >
              <span
                className={`material-symbols-outlined text-[24px] ${isActive ? "text-on-primary" : "text-outline group-hover:text-primary"}`}
                style={
                  isActive ? { fontVariationSettings: "'FILL' 1" } : undefined
                }
              >
                {link.icon}
              </span>
              <span className="tracking-wide uppercase text-xs font-bold">
                {link.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-outline-variant/20 space-y-2">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-4 px-5 py-3 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-all"
        >
          <span className="material-symbols-outlined text-[22px] text-outline">
            {theme === "dark" ? "light_mode" : "dark_mode"}
          </span>
          <span className="text-xs font-bold uppercase tracking-wider">
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </span>
        </button>
        <Link
          href="/dashboard"
          className="w-full flex items-center gap-4 px-5 py-3 rounded-xl bg-surface-container-highest text-on-surface hover:brightness-110 transition-all border border-outline-variant/10"
        >
          <span className="material-symbols-outlined text-[22px] text-primary">
            open_in_new
          </span>
          <span className="text-xs font-bold uppercase tracking-wider">
            Customer View
          </span>
        </Link>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-4 px-5 py-3 rounded-xl text-error hover:bg-error/10 transition-all"
        >
          <span className="material-symbols-outlined text-[22px]">logout</span>
          <span className="text-xs font-bold uppercase tracking-wider">
            Sign Out
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
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-outline-variant/30">
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
        className={`lg:hidden fixed inset-0 z-[55] transition-all duration-300 ${isMenuOpen ? "visible" : "invisible"}`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isMenuOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setIsMenuOpen(false)}
        />

        {/* Drawer Content */}
        <div
          className={`absolute right-0 top-0 bottom-0 w-[80%] max-w-sm bg-surface-container shadow-2xl transition-transform duration-300 ease-out ${isMenuOpen ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="p-8 flex flex-col h-full">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-xs font-bold tracking-[0.2em] text-outline uppercase">
                Menu
              </h2>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto">
              {allNavLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-5 px-5 py-4 rounded-xl transition-all ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-on-surface-variant hover:bg-surface-container-high"
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
                    <span className="text-base font-semibold uppercase tracking-wider">
                      {link.label}
                    </span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-8 pt-8 border-t border-outline-variant/20 space-y-3">
              <Link
                href="/dashboard"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-5 px-5 py-4 rounded-xl bg-surface-container-highest text-on-surface font-semibold uppercase tracking-wider"
              >
                <span className="material-symbols-outlined text-primary">
                  open_in_new
                </span>
                Customer View
              </Link>
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  signOut();
                }}
                className="w-full flex items-center gap-5 px-5 py-4 rounded-xl text-error font-semibold uppercase tracking-wider hover:bg-error/10 transition-all"
              >
                <span className="material-symbols-outlined">logout</span>
                Sign Out
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
    <nav className="md:hidden fixed bottom-0 left-0 w-full bg-background/90 backdrop-blur-lg z-50 border-t border-outline-variant/20 shadow-[0_-10px_30px_rgba(0,0,0,0.1)] flex justify-around items-center px-4 py-2 pb-safe">
      {adminLinks.map((link) => {
        const isActive = link.href === pathname;
        return (
          <Link
            key={link.label}
            href={link.href}
            className={`flex flex-col items-center justify-center gap-1.5 py-2 px-3 rounded-xl transition-all ${
              isActive
                ? "text-primary scale-110"
                : "text-outline hover:text-on-surface"
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
            <span className="text-[10px] font-bold uppercase tracking-tighter">
              {link.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useBookingStore } from '@/lib/stores/booking-store';
import type { ServiceDto } from '@/types/domain';

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Cuts: ['cut', 'fade', 'buzz', 'trim', 'shape'],
  Shaves: ['shave', 'razor', 'beard', 'sculpt'],
  Treatments: ['facial', 'therapy', 'treatment', 'colour', 'color', 'blend', 'mask'],
};

function categorise(service: ServiceDto): string {
  const nameLower = service.name.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => nameLower.includes(kw))) return cat;
  }
  return 'Other';
}

export default function ServicesPage() {
  const { services, setServices, selectedServiceIds, toggleService, getTotalPrice, getTotalDuration } =
    useBookingStore();
  const [loading, setLoading] = useState(services.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  useEffect(() => {
    if (services.length > 0) return;
    setTimeout(() => setLoading(true), 0);
    fetch('/api/services')
      .then((r) => r.json())
      .then((d) => {
        setServices(d.services ?? []);
        setLoading(false);
      })
      .catch(() => {
        setError('Unable to load services. Please try again.');
        setLoading(false);
      });
  }, [services.length, setServices]);

  const categories = ['All', ...Array.from(new Set(services.map(categorise)))];
  const filtered =
    activeCategory === 'All' ? services : services.filter((s) => categorise(s) === activeCategory);

  const grouped: Record<string, ServiceDto[]> = {};
  for (const s of filtered) {
    const cat = categorise(s);
    (grouped[cat] ??= []).push(s);
  }

  const totalPrice = getTotalPrice();
  const totalDuration = getTotalDuration();
  const hasSelection = selectedServiceIds.length > 0;

  return (
    <main className="px-4 md:px-margin-desktop max-w-container-max mx-auto min-h-screen pb-40">
      {/* Hero */}
      <section className="mb-stack-lg">
        <p className="text-primary font-label-md uppercase mb-2">Service Menu</p>
        <h2 className="font-headline-lg text-headline-lg text-on-surface">Precision &amp; Craft</h2>
        <p className="text-secondary mt-2 max-w-xl">
          Select your preferred treatment. Every session is tailored to your unique aesthetic and grooming needs.
        </p>
      </section>

      {/* Category Tabs */}
      <div className="flex gap-4 mb-stack-lg overflow-x-auto hide-scrollbar py-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`whitespace-nowrap px-6 py-2 rounded-full font-label-md transition-colors ${
              activeCategory === cat
                ? 'bg-primary-container text-on-primary-container shadow-sm'
                : 'bg-surface-container-lowest border border-outline-variant text-on-surface-variant hover:border-primary-container'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="flex flex-col gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-lg bg-surface-container-low animate-pulse" />
          ))}
        </div>
      )}
      {error && (
        <div className="p-6 rounded-lg bg-error/10 text-error text-center">{error}</div>
      )}

      {/* Service Groups */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="md:col-span-12 mt-4">
              <div className="flex items-center gap-4 mb-stack-md">
                <h3 className="font-headline-md text-headline-md">{cat}</h3>
                <div className="flex-grow h-px bg-outline-variant/30" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-stack-md">
                {items.map((service) => {
                  const selected = selectedServiceIds.includes(service.id);
                  return (
                    <button
                      key={service.id}
                      onClick={() => toggleService(service.id)}
                      className={`bg-surface-container-lowest p-6 rounded-lg shadow-md shadow-black/5 flex justify-between items-start group transition-all cursor-pointer text-left border ${
                        selected
                          ? 'border-primary ring-2 ring-primary/20 shadow-primary/10'
                          : 'border-transparent hover:border-primary-container/20'
                      }`}
                    >
                      <div className="flex-grow">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-headline-md text-on-surface">{service.name}</h4>
                        </div>
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center gap-1 text-tertiary">
                            <span className="material-symbols-outlined text-[18px]">schedule</span>
                            <span className="font-label-sm">{service.durationMinutes}m</span>
                          </div>
                          <div className="flex items-center gap-1 text-primary">
                            <span className="material-symbols-outlined text-[18px]">payments</span>
                            <span className="font-label-md">₹{service.price.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 flex flex-col items-center justify-center">
                        <div
                          className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                            selected
                              ? 'bg-primary text-on-primary'
                              : 'bg-surface-container text-primary group-hover:bg-primary-container group-hover:text-on-primary'
                          }`}
                        >
                          <span className="material-symbols-outlined">
                            {selected ? 'check' : 'add'}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Footer */}
      {hasSelection && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-md bg-surface-container-highest text-on-surface p-4 rounded-xl shadow-2xl flex justify-between items-center z-[60] border border-outline-variant">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-secondary font-bold mb-0.5">
              {selectedServiceIds.length} service{selectedServiceIds.length > 1 ? 's' : ''} · {totalDuration}m
            </p>
            <p className="font-headline-md text-sm">₹{totalPrice.toFixed(2)} total</p>
          </div>
          <Link
            href="/book/time"
            className="bg-primary-container text-on-primary-container px-6 py-2 rounded-lg font-label-md hover:opacity-90 transition-opacity"
          >
            Next →
          </Link>
        </div>
      )}
    </main>
  );
}

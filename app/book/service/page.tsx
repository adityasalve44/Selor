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
      <section className="mb-16">
        <p className="text-on-surface-variant font-label-md uppercase tracking-[0.2em] mb-4 opacity-60">Treatment Menu</p>
        <h2 className="font-display-lg text-display-lg text-on-surface tracking-tight lowercase">Precision <span className="text-primary">&</span> Craft</h2>
        <p className="text-on-surface-variant font-body-lg mt-4 max-w-xl opacity-70">
          Experience our signature grooming rituals. Every session is an orchestration of technical mastery and refined aesthetic.
        </p>
      </section>

      {/* Category Tabs */}
      <div className="flex gap-4 mb-16 overflow-x-auto hide-scrollbar py-2 border-b border-outline-variant/30">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`whitespace-nowrap px-8 py-3 rounded-md font-label-md transition-all uppercase tracking-widest text-[11px] ${
              activeCategory === cat
                ? 'bg-primary text-on-primary shadow-lg shadow-primary/20'
                : 'text-on-surface-variant opacity-60 hover:opacity-100 hover:bg-surface-container'
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
        <div className="space-y-20">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <div className="flex items-baseline justify-between mb-12 border-b border-outline-variant/30 pb-4">
                <h3 className="font-display-lg text-headline-lg text-on-surface tracking-tighter lowercase">{cat}</h3>
                <span className="font-label-md text-on-surface-variant opacity-40 uppercase tracking-[0.2em] text-[10px]">{items.length} options</span>
              </div>
              <div className="space-y-4">
                {items.map((service) => {
                  const selected = selectedServiceIds.includes(service.id);
                  return (
                    <button
                      key={service.id}
                      onClick={() => toggleService(service.id)}
                      className={`w-full group text-left transition-all duration-300 relative overflow-hidden rounded-md ${
                        selected 
                          ? 'bg-surface-container-low p-10 shadow-technical' 
                          : 'bg-transparent p-10 hover:bg-surface-container-low/50'
                      }`}
                    >
                      {/* Left Accent for Selection */}
                      <div className={`absolute top-0 left-0 h-full w-1.5 bg-primary transition-transform duration-500 ${selected ? 'scale-y-100' : 'scale-y-0'}`}></div>
                      
                      <div className="flex items-center justify-between gap-10">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-3">
                             <h4 className={`font-display-lg text-2xl transition-colors duration-300 ${selected ? 'text-primary' : 'text-on-surface'}`}>
                                {service.name}
                             </h4>
                             {selected && <span className="material-symbols-outlined text-primary text-xl">check_circle</span>}
                          </div>
                          <p className="text-on-surface-variant font-body-md opacity-60 max-w-2xl leading-relaxed">
                             Experience our bespoke {service.name.toLowerCase()} tailored to your unique anatomical structure.
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-12 text-right">
                          <div className="hidden sm:block">
                            <p className="font-label-md uppercase tracking-[0.2em] text-[9px] opacity-40 mb-1">duration</p>
                            <p className="font-display-lg text-xl text-on-surface-variant">{service.durationMinutes}m</p>
                          </div>
                          <div>
                            <p className="font-label-md uppercase tracking-[0.2em] text-[9px] opacity-40 mb-1">investment</p>
                            <p className="font-display-lg text-3xl text-primary tracking-tighter">₹{service.price.toFixed(0)}</p>
                          </div>
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
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-lg bg-inverse-surface text-inverse-on-surface p-8 rounded-lg shadow-[0_32px_64px_rgba(0,0,0,0.2)] flex justify-between items-center z-[60] border border-primary/10">
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold mb-2">
              {selectedServiceIds.length} service{selectedServiceIds.length > 1 ? 's' : ''} selected
            </p>
            <div className="flex items-baseline gap-3">
               <p className="font-display-lg text-display-lg leading-none">₹{totalPrice.toFixed(0)}</p>
               <p className="text-inverse-on-surface/50 text-[12px] uppercase tracking-widest">{totalDuration}m total</p>
            </div>
          </div>
          <Link
            href="/book/time"
            className="bg-primary text-on-primary px-10 py-5 rounded-md font-label-md uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-3"
          >
            proceed
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </Link>
        </div>
      )}
    </main>
  );
}

'use client';

import { useEffect, useCallback } from 'react';
import Link from 'next/link';
import { format, addDays, startOfToday, parseISO } from 'date-fns';
import { useBookingStore } from '@/lib/stores/booking-store';
import type { AvailabilitySlotDto } from '@/types/domain';

export default function TimeSelectionPage() {
  const {
    barbers,
    setBarbers,
    slots,
    setSlots,
    selectedBarberId,
    setSelectedBarberId,
    selectedDate,
    setSelectedDate,
    selectedSlot,
    setSelectedSlot,
    loading,
    setLoading,
    error,
    setError,
    selectedServiceIds,
    getSelectedServices,
    getTotalPrice,
    getSelectedBarber,
  } = useBookingStore();

  // Load barbers once
  useEffect(() => {
    if (barbers.length > 0) return;
    fetch('/api/barbers')
      .then((r) => r.json())
      .then((d) => {
        const list = d.barbers ?? [];
        setBarbers(list);
        if (list.length > 0) setSelectedBarberId(list[0].id);
      })
      .catch(() => setError('Unable to load barbers.'));
  }, [barbers.length, setBarbers, setSelectedBarberId, setError]);

  // Fetch availability whenever barber or date changes
  const fetchSlots = useCallback(async () => {
    if (!selectedBarberId || selectedServiceIds.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ barber_id: selectedBarberId, date: selectedDate });
      selectedServiceIds.forEach((id) => params.append('service_id', id));
      const r = await fetch(`/api/availability?${params}`);
      const d = await r.json();
      setSlots(d.slots ?? []);
    } catch {
      setError('Unable to load availability.');
    } finally {
      setLoading(false);
    }
  }, [selectedBarberId, selectedDate, selectedServiceIds, setLoading, setError, setSlots]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const today = startOfToday();
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i));

  const selectedServices = getSelectedServices();
  const totalPrice = getTotalPrice();
  const selectedBarber = getSelectedBarber();
  const canBook = selectedSlot && selectedServiceIds.length > 0;

  return (
    <main className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop min-h-screen pb-32">
      {/* Header */}
      <div className="mb-16 mt-8">
        <p className="text-on-surface-variant font-label-md uppercase tracking-[0.2em] mb-4 opacity-60">Scheduling</p>
        <h1 className="font-display-lg text-display-lg text-on-surface tracking-tight lowercase">Secure your <span className="text-primary">artisan</span></h1>
        <p className="text-on-surface-variant font-body-lg mt-4 max-w-xl opacity-70">
          Coordinate with our master artisans. Select your preferred specialist and available window for a distinguished grooming experience.
        </p>
      </div>

      {/* No services fallback */}
      {selectedServiceIds.length === 0 && (
        <div className="p-6 rounded-xl bg-surface-container-low border border-outline-variant text-center mb-8">
          <p className="text-tertiary mb-4">No services selected yet.</p>
          <Link href="/book/service" className="text-primary font-label-md underline">
            ← Choose Services First
          </Link>
        </div>
      )}

      {/* Barber Selection */}
      <section className="mb-24">
        <div className="flex items-baseline justify-between mb-12 border-b border-outline-variant/30 pb-4">
          <h2 className="font-display-lg text-headline-lg text-on-surface tracking-tighter lowercase">select artisan</h2>
        </div>
        <div className="flex gap-10 overflow-x-auto hide-scrollbar pb-10 -mx-margin-mobile px-margin-mobile">
          {barbers.map((barber) => {
            const isSelected = barber.id === selectedBarberId;
            return (
              <button
                key={barber.id}
                onClick={() => setSelectedBarberId(barber.id)}
                className={`flex-shrink-0 w-60 p-12 rounded-lg text-center transition-all relative overflow-hidden group ${
                  isSelected
                    ? 'bg-surface-container-low shadow-technical scale-105 z-10'
                    : 'bg-transparent hover:bg-surface-container-low/50'
                }`}
              >
                {isSelected && <div className="absolute top-0 left-0 w-full h-1.5 bg-primary"></div>}
                <div className="relative w-32 h-32 mx-auto mb-10">
                  <div className={`w-full h-full rounded-md flex items-center justify-center text-primary transition-all duration-700 ${
                    isSelected ? 'bg-primary text-on-primary shadow-xl shadow-primary/20 scale-110' : 'bg-surface-container-high/40 group-hover:bg-surface-container-high'
                  }`}>
                    <span className="material-symbols-outlined text-[56px]">
                      person
                    </span>
                  </div>
                </div>
                <span className={`block font-display-lg text-2xl mb-2 transition-colors duration-300 ${isSelected ? 'text-primary' : 'text-on-surface'}`}>{barber.name ?? 'Artisan'}</span>
                <span className="block text-label-md text-on-surface-variant uppercase tracking-[0.2em] text-[10px] opacity-40 font-bold">Specialist</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Date & Time */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-stack-lg items-start">
        {/* Calendar Strip */}
        <div className="lg:col-span-7 bg-surface-container-low rounded-lg p-12 shadow-technical">
          <div className="flex items-baseline justify-between mb-12">
            <h2 className="font-display-lg text-display-lg text-on-surface tracking-tighter lowercase">
               {format(parseISO(selectedDate), 'MMMM')} <span className="text-primary">{format(parseISO(selectedDate), 'yyyy')}</span>
            </h2>
            <div className="w-16 h-1 bg-primary/20 rounded-full"></div>
          </div>
          <div className="flex gap-5 overflow-x-auto hide-scrollbar pb-6">
            {days.map((day) => {
              const iso = format(day, 'yyyy-MM-dd');
              const isActive = iso === selectedDate;
              return (
                <button
                  key={iso}
                  onClick={() => setSelectedDate(iso)}
                  className={`flex-shrink-0 w-24 h-32 rounded-md flex flex-col items-center justify-center transition-all duration-500 ${
                    isActive
                      ? 'bg-primary text-on-primary shadow-xl shadow-primary/30 scale-110 z-10'
                      : 'bg-surface-container-lowest text-on-surface-variant hover:bg-white opacity-60 hover:opacity-100 hover:scale-105'
                  }`}
                >
                  <span className={`text-[10px] uppercase tracking-[0.2em] mb-4 font-bold ${isActive ? 'text-on-primary/60' : 'opacity-40'}`}>{format(day, 'EEE')}</span>
                  <span className="font-display-lg text-3xl tracking-tighter">{format(day, 'd')}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Slots */}
        <div className="lg:col-span-5 bg-surface-container-low rounded-lg p-12 shadow-technical">
          <h3 className="font-display-lg text-display-lg text-on-surface mb-12 tracking-tighter lowercase">the <span className="text-primary">window</span></h3>
          {loading && (
            <div className="grid grid-cols-2 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-20 rounded-md bg-surface-container-highest animate-pulse opacity-20" />
              ))}
            </div>
          )}
          {!loading && slots.length === 0 && !error && (
            <div className="text-center py-16 px-10 border border-dashed border-outline-variant/30 rounded-md">
              <p className="text-on-surface-variant font-label-md uppercase tracking-[0.2em] text-[10px] opacity-40 leading-relaxed">
                {selectedServiceIds.length === 0
                  ? 'synchronize ritual selection to unlock availability'
                  : 'no available windows discovered'}
              </p>
            </div>
          )}
          {error && <p className="text-error font-label-md text-sm text-center">{error}</p>}
          {!loading && slots.length > 0 && (
            <div className="grid grid-cols-2 gap-5">
              {slots.map((slot: AvailabilitySlotDto) => {
                const isSelected = selectedSlot?.startTime === slot.startTime;
                const timeLabel = format(parseISO(slot.startTime), 'HH:mm');
                return (
                  <button
                    key={slot.startTime}
                    disabled={!slot.available}
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-7 rounded-md font-display-lg text-xl tracking-tighter transition-all relative overflow-hidden ${
                      !slot.available
                        ? 'bg-transparent text-on-surface-variant opacity-10 cursor-not-allowed'
                        : isSelected
                        ? 'bg-primary text-on-primary shadow-xl shadow-primary/30 scale-[1.05] z-10'
                        : 'bg-surface-container-lowest text-on-surface hover:bg-white hover:scale-105'
                    }`}
                  >
                    {timeLabel}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Summary & Action */}
      {canBook && selectedBarber && (
        <div className="mt-24 mb-16 p-10 bg-inverse-surface text-inverse-on-surface rounded-lg shadow-[0_32px_64px_rgba(0,0,0,0.2)] border border-primary/10 flex flex-col md:flex-row items-center justify-between gap-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-primary"></div>
          <div className="flex items-center gap-8 relative z-10">
            <div className="w-20 h-20 rounded-md bg-white/5 flex items-center justify-center border border-white/10">
              <span className="material-symbols-outlined text-primary text-[40px]">schedule</span>
            </div>
            <div>
              <p className="text-primary font-bold uppercase tracking-[0.2em] text-[10px] mb-2">Finalization pending</p>
              <h4 className="font-display-lg text-headline-lg text-inverse-on-surface mb-2 tracking-tight">
                {selectedServices.map((s) => s.name).join(' + ')}
              </h4>
              <p className="text-inverse-on-surface/50 font-label-md uppercase tracking-widest text-[11px] flex items-center gap-3">
                {format(parseISO(selectedDate), 'EEEE, dd MMMM')} • {format(parseISO(selectedSlot!.startTime), 'HH:mm')} IST
                <span className="w-1 h-1 bg-primary rounded-full"></span>
                with {selectedBarber.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-10 w-full md:w-auto relative z-10 border-t md:border-t-0 md:border-l border-white/10 pt-10 md:pt-0 md:pl-10">
            <div className="text-right">
              <p className="text-inverse-on-surface/40 font-label-md uppercase tracking-widest text-[10px] mb-2">Investment</p>
              <p className="font-display-lg text-display-lg text-primary tracking-tighter">₹{totalPrice.toFixed(0)}</p>
            </div>
            <Link
              href="/book/confirm"
              className="flex-1 md:flex-none px-12 py-6 bg-primary text-on-primary rounded-md font-label-md uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all text-center flex items-center gap-3"
            >
              review
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}

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
      <div className="mb-stack-lg">
        <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Book Your Artisan</h1>
        <p className="font-body-md text-body-md text-tertiary">
          Select a master barber and your preferred time for a premium grooming experience.
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
      <section className="mb-section-gap">
        <div className="flex items-center justify-between mb-stack-md">
          <h2 className="font-headline-md text-headline-md text-on-surface">Choose Artisan</h2>
        </div>
        {barbers.length === 0 && !loading && (
          <p className="text-tertiary font-label-md">Loading artisans…</p>
        )}
        <div className="flex gap-stack-md overflow-x-auto hide-scrollbar pb-4 -mx-margin-mobile px-margin-mobile">
          {barbers.map((barber) => {
            const isSelected = barber.id === selectedBarberId;
            return (
              <button
                key={barber.id}
                onClick={() => setSelectedBarberId(barber.id)}
                className={`flex-shrink-0 w-44 p-stack-md bg-surface-container-lowest rounded-xl text-center transition-all border-2 ${
                  isSelected
                    ? 'border-primary shadow-[0_10px_30px_rgba(212,175,55,0.08)]'
                    : 'border-outline-variant hover:border-primary-container shadow-sm'
                }`}
              >
                <div className="relative w-24 h-24 mx-auto mb-stack-sm">
                  <div className="w-full h-full rounded-full bg-surface-container-high flex items-center justify-center text-primary text-4xl">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                      person
                    </span>
                  </div>
                  {isSelected && (
                    <div className="absolute bottom-0 right-0 bg-primary text-on-primary p-1 rounded-full border-2 border-on-primary">
                      <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        check
                      </span>
                    </div>
                  )}
                </div>
                <span className="block font-label-md text-on-surface mb-1">{barber.name ?? 'Artisan'}</span>
                <span className="block text-label-sm text-tertiary">Barber</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Date & Time */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-stack-lg items-start">
        {/* Calendar Strip */}
        <div className="lg:col-span-7 bg-surface-container-lowest rounded-xl p-6">
          <div className="flex items-center justify-between mb-stack-lg">
            <h2 className="font-headline-md text-headline-md text-on-surface">
              {format(parseISO(selectedDate), 'MMMM yyyy')}
            </h2>
          </div>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
            {days.map((day) => {
              const iso = format(day, 'yyyy-MM-dd');
              const isActive = iso === selectedDate;
              return (
                <button
                  key={iso}
                  onClick={() => setSelectedDate(iso)}
                  className={`flex-shrink-0 w-16 h-24 rounded-xl flex flex-col items-center justify-center transition-all ${
                    isActive
                      ? 'bg-primary-container text-on-primary-container shadow-lg scale-110 mx-2'
                      : 'border border-outline-variant hover:bg-surface-container-low'
                  }`}
                >
                  <span className="text-label-sm uppercase mb-2 opacity-70">{format(day, 'EEE')}</span>
                  <span className="font-headline-md font-bold">{format(day, 'd')}</span>
                  {isActive && <div className="w-1.5 h-1.5 bg-surface-container-lowest rounded-full mt-1" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Slots */}
        <div className="lg:col-span-5 bg-surface-container-lowest rounded-xl p-6">
          <h3 className="font-headline-md text-headline-md text-on-surface mb-stack-md">Available Times</h3>
          {loading && (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-14 rounded-lg bg-surface-container-low animate-pulse" />
              ))}
            </div>
          )}
          {!loading && slots.length === 0 && !error && (
            <p className="text-tertiary text-center py-8 font-label-md">
              {selectedServiceIds.length === 0
                ? 'Select services to see availability.'
                : 'No slots available for this day.'}
            </p>
          )}
          {error && <p className="text-error text-sm">{error}</p>}
          {!loading && slots.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {slots.map((slot: AvailabilitySlotDto) => {
                const isSelected = selectedSlot?.startTime === slot.startTime;
                const timeLabel = new Date(slot.startTime).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return (
                  <button
                    key={slot.startTime}
                    disabled={!slot.available}
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-4 rounded-lg font-label-md transition-all ${
                      !slot.available
                        ? 'border border-outline-variant opacity-30 cursor-not-allowed text-on-surface'
                        : isSelected
                        ? 'bg-primary text-on-primary shadow-md ring-2 ring-primary ring-offset-2'
                        : 'border border-outline-variant text-on-surface hover:border-primary-container hover:bg-surface'
                    }`}
                  >
                    {timeLabel} IST
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Summary & Action */}
      {canBook && selectedBarber && (
        <div className="mt-section-gap mb-stack-lg p-6 bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-surface-container-high flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-[32px]">content_cut</span>
            </div>
            <div>
              <h4 className="font-headline-md text-on-surface">
                {selectedServices.map((s) => s.name).join(' + ')}
              </h4>
              <p className="text-label-md text-tertiary">
                {format(parseISO(selectedDate), 'dd-MM-yyyy')} at{' '}
                {new Date(selectedSlot!.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST
                &nbsp;•&nbsp;with {selectedBarber.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6 w-full md:w-auto">
            <div className="text-right">
              <p className="text-label-sm text-tertiary uppercase">Estimated Price</p>
              <p className="font-headline-md text-primary">₹{totalPrice.toFixed(2)}</p>
            </div>
            <Link
              href="/book/confirm"
              className="flex-1 md:flex-none px-12 py-4 bg-primary text-on-primary rounded-lg font-label-md hover:bg-primary/90 transition-all shadow-lg active:scale-95 text-center"
            >
              CONFIRM BOOKING
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}

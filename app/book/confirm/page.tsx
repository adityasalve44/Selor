'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { useBookingStore } from '@/lib/stores/booking-store';
import { useAuth } from '@/app/components/AuthProvider';

export default function BookingConfirmPage() {
  const { user, signInWithGoogle } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const {
    selectedServiceIds,
    selectedBarberId,
    selectedDate,
    selectedSlot,
    getSelectedServices,
    getTotalPrice,
    getTotalDuration,
    getSelectedBarber,
    setBookingId,
    reset,
  } = useBookingStore();

  const selectedServices = getSelectedServices();
  const totalPrice = getTotalPrice();
  const totalDuration = getTotalDuration();
  const selectedBarber = getSelectedBarber();
  const selectedSlotStartTime = selectedSlot?.startTime ?? null;
  const formattedSelectedDate = selectedDate ? format(parseISO(selectedDate), 'dd MMM yyyy') : null;
  const formattedSelectedDateCompact = selectedDate ? format(parseISO(selectedDate), 'dd-MM-yyyy') : null;
  const formattedSelectedTime = selectedSlotStartTime
    ? new Date(selectedSlotStartTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : null;

  const isReady = selectedServiceIds.length > 0 && !!selectedBarberId && !!selectedSlotStartTime;

  const handleConfirm = async () => {
    if (!isReady) return;
    if (!user) {
      signInWithGoogle();
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barberId: selectedBarberId,
          serviceIds: selectedServiceIds,
          startTime: selectedSlotStartTime,
          idempotencyKey: `${user.id}-${selectedBarberId}-${selectedSlotStartTime}`,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error?.message ?? 'Booking failed. Please try again.');
      }

      setBookingId(data.appointment?.id ?? data.id ?? null);
      setConfirmed(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success Screen ──────────────────────────────────────────────────────────
  if (confirmed) {
    return (
      <main className="max-w-2xl mx-auto px-margin-mobile md:px-0 py-section-padding min-h-screen flex flex-col items-center justify-center text-center gap-12">
        <div className="w-40 h-40 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10 shadow-technical relative">
           <div className="absolute inset-0 bg-primary/5 rounded-full animate-ping opacity-20"></div>
          <span className="material-symbols-outlined text-primary text-[72px] relative z-10" style={{ fontVariationSettings: "'FILL' 1" }}>
            verified
          </span>
        </div>
        <div>
          <h1 className="font-display-lg text-display-lg text-on-surface mb-4 tracking-tighter lowercase">ritual <span className="text-primary">secured</span></h1>
          <p className="text-on-surface-variant font-body-lg opacity-60 max-w-sm mx-auto leading-relaxed">
            Your orchestration is complete. We have integrated your session into our master schedule.
          </p>
        </div>
        <div className="bg-surface-container-low rounded-lg p-12 w-full text-left shadow-technical relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full group-hover:scale-110 transition-transform duration-700"></div>
          <p className="font-label-md text-primary uppercase tracking-[0.3em] mb-8 font-bold text-[10px]">Session Manifest</p>
          <h2 className="font-display-lg text-on-surface text-3xl mb-4 tracking-tight lowercase">
             {selectedServices.map((s) => s.name).join(' + ')}
          </h2>
          {(formattedSelectedDate || formattedSelectedTime) && (
            <div className="flex items-center gap-4 text-on-surface-variant font-display-lg text-xl mb-10 opacity-70">
              <span>{formattedSelectedDate}</span>
              <span className="w-1 h-1 bg-primary rounded-full"></span>
              <span>{formattedSelectedTime} IST</span>
            </div>
          )}
          {selectedBarber && (
            <div className="flex items-center gap-6 pt-8 border-t border-outline-variant/30">
               <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">person</span>
               </div>
               <div>
                  <p className="text-[10px] font-label-md uppercase tracking-[0.2em] opacity-40">Artisan assigned</p>
                  <p className="text-on-surface font-display-lg text-xl leading-none">{selectedBarber.name}</p>
               </div>
            </div>
          )}
        </div>
        <div className="flex flex-col md:flex-row gap-6 w-full">
          <Link
            href="/dashboard"
            onClick={reset}
            className="flex-1 py-6 bg-primary text-on-primary font-label-md rounded-md text-center shadow-technical hover:opacity-90 transition-all uppercase tracking-[0.2em] active:scale-[0.98]"
          >
            return home
          </Link>
          <Link
            href="/book/service"
            onClick={reset}
            className="flex-1 py-6 bg-surface-container-low text-on-surface font-label-md rounded-md text-center hover:bg-surface-container-high transition-all uppercase tracking-[0.2em] active:scale-[0.98] shadow-technical"
          >
            new ritual
          </Link>
        </div>
      </main>
    );
  }

  // ── Incomplete Selection Fallback ───────────────────────────────────────────
  if (!isReady) {
    return (
      <main className="max-w-2xl mx-auto px-margin-mobile md:px-0 py-section-padding min-h-screen flex flex-col items-center justify-center text-center gap-10">
        <div className="w-24 h-24 rounded-full bg-surface-container flex items-center justify-center border border-outline-variant/30">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant opacity-40">calendar_today</span>
        </div>
        <div>
          <h1 className="font-display-lg text-display-lg text-on-surface mb-4 tracking-tight">Empty Selection</h1>
          <p className="text-on-surface-variant font-body-lg opacity-70">Please complete your service and time selection to proceed with the booking.</p>
        </div>
        <Link
          href="/book/service"
          className="px-12 py-5 bg-primary text-on-primary rounded-md font-label-md uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-[0.98]"
        >
          Begin Selection
        </Link>
      </main>
    );
  }

  // ── Review Screen ───────────────────────────────────────────────────────────
  return (
    <main className="max-w-2xl mx-auto px-margin-mobile md:px-0 py-section-padding min-h-screen">
      <header className="mb-16">
        <h1 className="font-display-lg text-display-lg text-on-surface mb-4 tracking-tight">Review Appointment</h1>
        <p className="font-body-lg text-on-surface-variant opacity-70">Please verify your session details before final confirmation.</p>
      </header>

      <div className="space-y-8">
        {/* Services Summary */}
        <section className="bg-surface-container-low rounded-lg p-12 shadow-technical relative overflow-hidden">
          <div className="absolute top-0 right-0 w-2 h-full bg-primary"></div>
          <div className="flex justify-between items-start mb-12">
            <div>
              <p className="font-label-md text-primary uppercase tracking-[0.3em] text-[10px] mb-4 font-bold">Selected treatments</p>
              <h2 className="font-display-lg text-4xl text-on-surface tracking-tighter lowercase">
                {selectedServices.map((s) => s.name).join(' + ')}
              </h2>
              <div className="flex items-center gap-4 mt-6">
                 <p className="font-display-lg text-xl text-primary">{totalDuration}m</p>
                 <span className="w-1 h-1 bg-outline-variant/30 rounded-full"></span>
                 <p className="text-on-surface-variant font-display-lg text-xl opacity-60">₹{totalPrice.toFixed(0)}</p>
              </div>
            </div>
            <div className="w-20 h-20 rounded-md bg-surface-container-high flex items-center justify-center text-primary/30">
              <span className="material-symbols-outlined text-[40px]">
                architecture
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-10 pt-12 border-t border-outline-variant/30">
            <div className="flex items-start gap-5">
              <span className="material-symbols-outlined text-primary/40 mt-1">calendar_today</span>
              <div>
                <p className="font-label-md text-on-surface-variant uppercase tracking-[0.2em] text-[9px] opacity-40 mb-2">Scheduled Date</p>
                <p className="font-display-lg text-xl text-on-surface tracking-tight">
                  {formattedSelectedDateCompact}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-5">
              <span className="material-symbols-outlined text-primary/40 mt-1">schedule</span>
              <div>
                <p className="font-label-md text-on-surface-variant uppercase tracking-[0.2em] text-[9px] opacity-40 mb-2">Window</p>
                <p className="font-display-lg text-xl text-on-surface tracking-tight">
                  {formattedSelectedTime} IST
                </p>
              </div>
            </div>
            {selectedBarber && (
              <div className="flex items-start gap-5 col-span-2 mt-4 pt-10 border-t border-outline-variant/30 border-dashed">
                <span className="material-symbols-outlined text-primary/40 mt-1">person</span>
                <div>
                  <p className="font-label-md text-on-surface-variant uppercase tracking-[0.2em] text-[9px] opacity-40 mb-2">Assigned Artisan</p>
                  <p className="font-display-lg text-xl text-on-surface tracking-tight">{selectedBarber.name}</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Individual services breakdown */}
        {selectedServices.length > 1 && (
          <section className="bg-surface-container rounded-lg p-10 border border-outline-variant/30">
            <h3 className="font-label-md text-on-surface-variant uppercase mb-8 tracking-[0.2em] opacity-60">Services Breakdown</h3>
            <div className="space-y-6">
              {selectedServices.map((s) => (
                <div key={s.id} className="flex justify-between items-baseline group">
                  <span className="font-body-lg text-on-surface opacity-80 group-hover:opacity-100 transition-opacity">{s.name} ({s.durationMinutes}m)</span>
                  <div className="flex-1 border-b border-dotted border-outline-variant/50 mx-4 mb-1"></div>
                  <span className="font-headline-md text-on-surface">₹{s.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Payment Summary */}
        <section className="bg-primary text-on-primary rounded-lg p-12 shadow-technical relative overflow-hidden border border-white/5">
           <div className="absolute inset-0 @apply technical-grid opacity-10"></div>
          <h3 className="font-label-md uppercase mb-10 tracking-[0.3em] text-[10px] opacity-60">
            Total Investment
          </h3>
          <div className="space-y-6">
            <div className="flex justify-between font-label-md uppercase tracking-[0.2em] text-[11px] opacity-50">
              <span>Professional Fee</span>
              <span>₹{totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-baseline pt-10 border-t border-white/10">
              <span className="font-display-lg text-2xl tracking-tighter opacity-70">Final Amount</span>
              <span className="font-display-lg text-5xl tracking-tighter drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">₹{totalPrice.toFixed(0)}</span>
            </div>
          </div>
        </section>

        {/* Auth notice */}
        {!user && (
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">info</span>
            <p className="text-sm text-on-surface">You&apos;ll be asked to sign in with Google to confirm this booking.</p>
          </div>
        )}

        {/* Error */}
        {submitError && (
          <div className="p-4 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
            {submitError}
          </div>
        )}
      </div>

      {/* Action */}
      <footer className="mt-16 flex flex-col gap-6">
        <button
          onClick={handleConfirm}
          disabled={submitting}
          className="w-full bg-primary text-on-primary font-label-md text-lg py-6 rounded-md shadow-xl shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all uppercase tracking-[0.2em] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {submitting && (
            <span className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
          )}
          {submitting ? 'Confirming Appointment…' : user ? 'Secure Appointment' : 'Sign In & Confirm'}
        </button>
        <Link href="/book/time" className="text-center text-on-surface-variant font-label-md uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Modify Time selection
        </Link>
        <p className="text-center font-label-md text-[10px] text-on-surface-variant opacity-40 uppercase tracking-widest px-10 leading-relaxed mt-4">
          By securing this appointment, you acknowledge our professional studio policies and 24-hour rescheduling window.
        </p>
      </footer>
    </main>
  );
}

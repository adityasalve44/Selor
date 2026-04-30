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

  const isReady = selectedServiceIds.length > 0 && selectedBarberId && selectedSlot;

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
          startTime: selectedSlot!.startTime,
          idempotencyKey: `${user.id}-${selectedBarberId}-${selectedSlot!.startTime}`,
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
      <main className="max-w-2xl mx-auto px-margin-mobile md:px-0 py-stack-lg min-h-screen flex flex-col items-center justify-center text-center gap-6">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-[56px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            check_circle
          </span>
        </div>
        <h1 className="font-headline-lg text-on-surface">Booking Confirmed!</h1>
        <p className="text-tertiary font-body-md max-w-sm">
          Your appointment has been booked. You&apos;ll receive a reminder before your session.
        </p>
        <div className="bg-surface-container-lowest rounded-xl p-6 w-full text-left border border-outline-variant/30">
          <p className="font-label-sm text-tertiary uppercase tracking-widest mb-3">Booking Summary</p>
          <p className="font-headline-md text-on-surface">{selectedServices.map((s) => s.name).join(' + ')}</p>
          <p className="text-secondary mt-1">
            {format(parseISO(selectedDate), 'dd MMM yyyy')} ·{' '}
            {new Date(selectedSlot!.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST
          </p>
          {selectedBarber && (
            <p className="text-secondary">with {selectedBarber.name}</p>
          )}
          <p className="font-label-md text-primary mt-3">₹{totalPrice.toFixed(2)} · {totalDuration} min</p>
        </div>
        <div className="flex gap-4 w-full">
          <Link
            href="/dashboard"
            onClick={reset}
            className="flex-1 py-4 bg-primary-container text-on-primary-container font-label-md rounded-lg text-center hover:brightness-110 transition-all uppercase tracking-wider"
          >
            View Dashboard
          </Link>
          <Link
            href="/book/service"
            onClick={reset}
            className="flex-1 py-4 border border-outline-variant text-on-surface font-label-md rounded-lg text-center hover:bg-surface-container transition-all uppercase tracking-wider"
          >
            Book Again
          </Link>
        </div>
      </main>
    );
  }

  // ── Incomplete Selection Fallback ───────────────────────────────────────────
  if (!isReady) {
    return (
      <main className="max-w-2xl mx-auto px-margin-mobile md:px-0 py-stack-lg min-h-screen flex flex-col items-center justify-center text-center gap-6">
        <span className="material-symbols-outlined text-[64px] text-outline">calendar_today</span>
        <h1 className="font-headline-lg text-on-surface">Nothing to Confirm Yet</h1>
        <p className="text-tertiary">Please select a service and time slot first.</p>
        <Link
          href="/book/service"
          className="px-8 py-3 bg-primary-container text-on-primary-container rounded-lg font-label-md hover:brightness-110 transition-all"
        >
          Start Booking
        </Link>
      </main>
    );
  }

  // ── Review Screen ───────────────────────────────────────────────────────────
  return (
    <main className="max-w-2xl mx-auto px-margin-mobile md:px-0 py-stack-lg min-h-screen">
      <header className="mb-stack-lg">
        <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Review Appointment</h1>
        <p className="font-body-md text-body-md text-tertiary">Confirm your service details before booking.</p>
      </header>

      <div className="space-y-stack-md">
        {/* Services Summary */}
        <section className="bg-surface-container-lowest rounded-lg p-6 shadow-md shadow-black/5 border border-outline-variant/30">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface">
                {selectedServices.map((s) => s.name).join(' + ')}
              </h2>
              <p className="text-tertiary font-label-sm mt-1 uppercase tracking-wider">
                {totalDuration} mins · ₹{totalPrice.toFixed(2)}
              </p>
            </div>
            <div className="w-14 h-14 rounded-lg bg-surface-container-high flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                content_cut
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-stack-md pt-6 border-t border-outline-variant/30">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary-container">calendar_today</span>
              <div>
                <p className="font-label-sm text-tertiary uppercase tracking-wider">Date</p>
                <p className="font-body-md text-on-surface font-semibold">
                  {format(parseISO(selectedDate), 'dd-MM-yyyy')}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary-container">schedule</span>
              <div>
                <p className="font-label-sm text-tertiary uppercase tracking-wider">Time</p>
                <p className="font-body-md text-on-surface font-semibold">
                  {new Date(selectedSlot!.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST
                </p>
              </div>
            </div>
            {selectedBarber && (
              <div className="flex items-start gap-3 col-span-2">
                <span className="material-symbols-outlined text-primary-container">person</span>
                <div>
                  <p className="font-label-sm text-tertiary uppercase tracking-wider">Professional</p>
                  <p className="font-body-md text-on-surface font-semibold">{selectedBarber.name ?? 'Artisan'}</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Individual services breakdown */}
        {selectedServices.length > 1 && (
          <section className="bg-surface-container-lowest rounded-lg p-6 shadow-md shadow-black/5 border border-outline-variant/30">
            <h3 className="font-label-md text-label-md text-on-surface uppercase mb-4 tracking-widest">Services</h3>
            <div className="space-y-3">
              {selectedServices.map((s) => (
                <div key={s.id} className="flex justify-between font-body-md text-tertiary">
                  <span>{s.name} ({s.durationMinutes}m)</span>
                  <span>₹{s.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Payment Summary */}
        <section className="bg-surface-container-low rounded-lg p-6 border border-primary-container/10">
          <h3 className="font-label-md text-label-md text-on-surface uppercase mb-4 tracking-widest">
            Payment Summary
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between font-body-md text-tertiary">
              <span>Service Subtotal</span>
              <span>₹{totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-headline-md text-on-surface pt-3 border-t border-outline-variant/30">
              <span>Total</span>
              <span className="text-primary-container">₹{totalPrice.toFixed(2)}</span>
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
      <footer className="mt-stack-lg flex flex-col gap-4">
        <button
          onClick={handleConfirm}
          disabled={submitting}
          className="w-full bg-primary-container text-on-primary-container font-label-md text-lg py-5 rounded-lg shadow-lg shadow-primary-container/20 hover:brightness-110 active:scale-[0.98] transition-all uppercase tracking-[0.2em] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting && (
            <span className="w-5 h-5 border-2 border-on-primary-container/30 border-t-on-primary-container rounded-full animate-spin" />
          )}
          {submitting ? 'Confirming…' : user ? 'Confirm Booking' : 'Sign In & Confirm'}
        </button>
        <Link href="/book/time" className="text-center text-tertiary font-label-sm hover:text-on-surface transition-colors">
          ← Back to Time Selection
        </Link>
        <p className="text-center font-label-sm text-tertiary px-6">
          By confirming, you agree to our 24-hour cancellation policy.
        </p>
      </footer>
    </main>
  );
}

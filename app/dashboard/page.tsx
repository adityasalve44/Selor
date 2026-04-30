"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { useAuth } from "@/app/components/AuthProvider";
import type { AppointmentDto, BarberDto } from "@/types/domain";

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`bg-surface-container-low animate-pulse rounded-lg ${className ?? ""}`} />;
}

export default function CustomerDashboardPage() {
  const { user, loading: authLoading, signInWithGoogle } = useAuth();

  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
  const [barbers, setBarbers] = useState<BarberDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    async function load() {
      setLoading(true);
      try {
        const [apptRes, barberRes] = await Promise.all([
          fetch("/api/appointments?status=booked&limit=5"),
          fetch("/api/barbers"),
        ]);
        if (apptRes.ok) {
          const d = await apptRes.json();
          setAppointments(d.data ?? []);
        }
        if (barberRes.ok) {
          const d = await barberRes.json();
          setBarbers(d.barbers ?? []);
        }
      } catch {
        // silently handle
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [authLoading, user]);

  const nextAppointment = appointments[0] ?? null;
  const visitCount = appointments.length;
  const loyaltyGoal = 10;
  const loyaltyProgress = Math.min(visitCount, loyaltyGoal);

  return (
    <main className="max-w-7xl mx-auto px-6 pt-12 min-h-screen pb-28">
      {/* Welcome */}
      {user && (
        <div className="mb-6">
          <p className="text-tertiary font-label-md">Welcome back,</p>
          <h1 className="font-headline-lg text-on-surface">{user.name ?? user.email}</h1>
        </div>
      )}

      {/* Not signed in */}
      {!authLoading && !user && (
        <section className="mb-section-gap p-8 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-center shadow-sm">
          <span className="material-symbols-outlined text-[48px] text-primary mb-4 block" style={{ fontVariationSettings: "'FILL' 1" }}>
            person_outline
          </span>
          <h2 className="font-headline-lg text-on-surface mb-2">Sign In to Manage Bookings</h2>
          <p className="text-tertiary mb-6">Track your appointments, join the queue, and more.</p>
          <button
            onClick={signInWithGoogle}
            className="inline-flex items-center gap-2 px-8 py-3 bg-primary-container text-on-primary-container rounded-lg font-label-md hover:brightness-110 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined">login</span>
            Sign In with Google
          </button>
        </section>
      )}

      {/* Upcoming & Loyalty */}
      <section className="mb-section-gap">
        <div className="flex flex-col md:flex-row gap-gutter">
          {/* Next Appointment */}
          <div className="flex-1 bg-surface-container-lowest p-stack-lg rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.03)] border border-outline-variant/30 flex flex-col justify-between min-h-[300px]">
            <div>
              <span className="font-label-md text-primary uppercase tracking-[0.2em] mb-stack-sm block">Upcoming</span>
              <h2 className="font-headline-lg text-on-surface mb-stack-md">Next Visit</h2>
              {loading ? (
                <SkeletonBlock className="h-20" />
              ) : nextAppointment ? (
                <div className="flex items-start gap-4 p-stack-md bg-surface-container-low rounded-lg">
                  <div className="bg-primary text-on-primary w-14 h-14 rounded-lg flex flex-col items-center justify-center font-bold flex-shrink-0">
                    <span className="text-[10px] uppercase leading-none">
                      {format(parseISO(nextAppointment.startTime), "MMM")}
                    </span>
                    <span className="text-xl leading-none">
                      {format(parseISO(nextAppointment.startTime), "d")}
                    </span>
                  </div>
                  <div>
                    <p className="font-headline-md text-on-surface">
                      {nextAppointment.services.map((s) => s.name).join(" + ") || "Appointment"}
                    </p>
                    <p className="font-body-md text-tertiary">
                      {format(parseISO(nextAppointment.startTime), "EEEE")} &bull;{" "}
                      {new Date(nextAppointment.startTime).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      IST
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-stack-md bg-surface-container-low rounded-lg text-center">
                  <p className="text-tertiary font-body-md mb-3">No upcoming appointments.</p>
                  <Link href="/book/service" className="text-primary font-label-md underline">
                    Book Now →
                  </Link>
                </div>
              )}
            </div>
            <div className="mt-stack-lg flex gap-4">
              <Link
                href="/book/service"
                className="bg-primary-container text-on-primary-container px-6 py-3 rounded-lg font-label-md uppercase tracking-wider hover:brightness-110 transition-all"
              >
                Book New
              </Link>
              {nextAppointment && (
                <button className="border border-outline-variant text-on-surface px-6 py-3 rounded-lg font-label-md uppercase tracking-wider hover:bg-surface-container transition-all">
                  View Details
                </button>
              )}
            </div>
          </div>

          {/* Loyalty Card */}
          <div className="md:w-[400px] bg-primary text-on-primary p-stack-lg rounded-xl shadow-[0_10px_30px_rgba(212,175,55,0.15)] relative overflow-hidden group">
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <span className="font-label-md text-primary-fixed uppercase tracking-[0.2em] mb-stack-sm block">
                  Loyalty Tier
                </span>
                <h2 className="font-headline-lg mb-stack-sm">
                  {loyaltyProgress >= 10 ? "Gold Member" : loyaltyProgress >= 5 ? "Aureate Member" : "New Member"}
                </h2>
                {loading ? (
                  <SkeletonBlock className="h-8 bg-on-primary/10" />
                ) : (
                  <p className="font-body-md text-on-primary/80">
                    {loyaltyProgress >= loyaltyGoal
                      ? "You've reached Gold status! Enjoy your perks."
                      : `${loyaltyGoal - loyaltyProgress} visits until your next complimentary Signature Shave.`}
                  </p>
                )}
              </div>
              <div className="mt-8">
                <div className="flex justify-between font-label-sm uppercase mb-2">
                  <span>Progress</span>
                  <span>{loyaltyProgress} / {loyaltyGoal}</span>
                </div>
                <div className="h-1.5 w-full bg-surface-container-lowest/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-fixed-dim transition-all duration-700"
                    style={{ width: `${(loyaltyProgress / loyaltyGoal) * 100}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="absolute -right-12 -bottom-12 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <span className="material-symbols-outlined text-[240px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                stars
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Artisans */}
      <section className="mb-section-gap">
        <div className="flex items-center justify-between mb-stack-lg">
          <h3 className="font-headline-lg text-on-surface">Artisans</h3>
          <Link
            className="font-label-md text-primary uppercase border-b border-primary-container pb-1 hover:text-on-primary-container transition-colors"
            href="/book/service"
          >
            View All Services
          </Link>
        </div>
        {loading ? (
          <div className="flex gap-gutter">
            {[1, 2, 3].map((i) => (
              <SkeletonBlock key={i} className="min-w-[70 aspect-[3/4]" />
            ))}
          </div>
        ) : (
          <div className="flex gap-gutter overflow-x-auto pb-8 custom-scrollbar snap-x">
            {barbers.length === 0 ? (
              <p className="text-tertiary font-label-md">No artisans available right now.</p>
            ) : (
              barbers.map((barber) => (
                <Link
                  key={barber.id}
                  href={`/book/time`}
                  className="min-w-[280px] snap-start group block"
                >
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-stack-sm bg-surface-container-high shadow-sm">
                    <div className="w-full h-full bg-gradient-to-br from-surface-container to-surface-container-high flex items-center justify-center">
                      <span
                        className="material-symbols-outlined text-[80px] text-primary/30"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        person
                      </span>
                    </div>
                    <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="text-on-primary font-headline-md mb-0">{barber.name ?? "Artisan"}</p>
                      <p className="text-primary-fixed font-label-sm uppercase">Master Barber</p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </section>

      {/* Quick Book CTA */}
      <section className="mb-section-gap">
        <div className="p-8 rounded-xl bg-primary text-on-primary text-center shadow-lg">
          <h3 className="font-headline-lg mb-3">Ready for Your Next Visit?</h3>
          <p className="text-on-primary/80 mb-6 font-body-md">
            Book an appointment or join the walk-in queue instantly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/book/service"
              className="px-8 py-3 bg-surface text-primary rounded-lg font-label-md hover:bg-surface-container transition-all shadow-sm"
            >
              Book Appointment
            </Link>
            <Link
              href="/dashboard"
              className="px-8 py-3 border border-on-primary/40 text-on-primary rounded-lg font-label-md hover:bg-on-primary/10 transition-all"
            >
              Join Walk-in Queue
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

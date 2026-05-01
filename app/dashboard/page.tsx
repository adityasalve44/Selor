"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { useAuth } from "@/app/components/AuthProvider";
import type { AppointmentDto, BarberDto } from "@/types/domain";

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={`bg-surface-container-highest animate-pulse rounded-md ${className ?? ""}`}
    />
  );
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
        <div className="mb-12">
          <p className="text-on-surface-variant font-label-md uppercase tracking-[0.2em] opacity-60 mb-2">
            Member Dashboard
          </p>
          <h1 className="font-display-lg text-display-lg text-on-surface tracking-tight lowercase">
            welcome back,{" "}
            <span className="text-primary">
              {user.name?.split(" ")[0] ?? user.email?.split("@")[0]}
            </span>
          </h1>
        </div>
      )}

      {/* Not signed in */}
      {!authLoading && !user && (
        <section className="mb-16 p-12 rounded-lg bg-surface-container border border-outline-variant/30 text-center shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mx-auto mb-8 border border-primary/10">
            <span
              className="material-symbols-outlined text-[32px] text-primary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              person_outline
            </span>
          </div>
          <h2 className="font-headline-lg text-display-lg text-on-surface mb-4 tracking-tight">
            Access Your Profile
          </h2>
          <p className="text-on-surface-variant font-body-lg opacity-70 mb-10 max-w-md mx-auto">
            Sign in to manage your appointments, view service history, and
            access exclusive membership perks.
          </p>
          <button
            onClick={signInWithGoogle}
            className="inline-flex items-center gap-3 px-10 py-4 bg-primary text-on-primary rounded-md font-label-md uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:opacity-90 transition-all active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[18px]">login</span>
            Authenticate with Google
          </button>
        </section>
      )}

      {/* Upcoming & Loyalty */}
      <section className="mb-16">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Next Appointment (Ticket Aesthetic) */}
          <div className="flex-1 bg-surface-container-low p-10 rounded-lg flex flex-col justify-between min-h-[340px] relative overflow-hidden shadow-technical">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-10">
                <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                <span className="font-label-md text-primary uppercase tracking-[0.2em] font-bold text-[10px]">
                  Reservation active
                </span>
              </div>
              <h2 className="font-display-lg text-display-lg text-on-surface mb-8 tracking-tighter lowercase">
                the next <span className="text-primary">ritual</span>
              </h2>
              {loading ? (
                <SkeletonBlock className="h-32" />
              ) : nextAppointment ? (
                <div className="relative">
                  <div className="p-8 bg-surface-container-lowest rounded-md flex items-center justify-between group/ticket transition-all hover:bg-white">
                    <div className="flex items-center gap-8">
                      <div className="flex flex-col items-center justify-center border-r border-outline-variant/30 pr-8">
                        <span className="text-display-lg font-display-lg text-primary leading-none">
                          {format(parseISO(nextAppointment.startTime), "d")}
                        </span>
                        <span className="font-label-md uppercase tracking-[0.2em] text-[10px] opacity-40">
                          {format(parseISO(nextAppointment.startTime), "MMM")}
                        </span>
                      </div>
                      <div>
                        <p className="font-headline-md text-xl text-on-surface mb-1 tracking-tight">
                          {nextAppointment.services
                            .map((s) => s.name)
                            .join(" + ")}
                        </p>
                        <p className="font-label-md text-on-surface-variant opacity-50 uppercase tracking-widest text-[10px]">
                          {format(parseISO(nextAppointment.startTime), "EEEE")}{" "}
                          •{" "}
                          {format(parseISO(nextAppointment.startTime), "HH:mm")}{" "}
                          IST
                        </p>
                      </div>
                    </div>
                    <div className="hidden md:block">
                      <span className="material-symbols-outlined text-primary/20 text-4xl group-hover/ticket:text-primary/100 transition-colors">
                        confirmation_number
                      </span>
                    </div>
                  </div>
                  {/* Ticket Punches */}
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-surface-container-low rounded-full"></div>
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-surface-container-low rounded-full"></div>
                </div>
              ) : (
                <div className="p-12 border border-dashed border-outline-variant/30 rounded-md text-center group hover:bg-surface-container transition-colors">
                  <p className="text-on-surface-variant font-label-md uppercase tracking-widest opacity-40 mb-8">
                    No upcoming sessions discovered
                  </p>
                  <Link
                    href="/book/service"
                    className="inline-flex items-center gap-4 text-primary font-bold uppercase tracking-[0.2em] text-[11px] group-hover:gap-6 transition-all"
                  >
                    Initiate Ritual
                    <span className="material-symbols-outlined text-sm">
                      arrow_forward
                    </span>
                  </Link>
                </div>
              )}
            </div>
            <div className="mt-12 flex gap-6 relative z-10">
              <Link
                href="/book/service"
                className="bg-primary text-on-primary px-10 py-5 rounded-md font-label-md uppercase tracking-[0.2em] shadow-technical hover:opacity-90 active:scale-[0.98] transition-all"
              >
                schedule new
              </Link>
              {nextAppointment && (
                <button className="text-on-surface-variant px-8 py-5 rounded-md font-label-md uppercase tracking-[0.2em] hover:text-on-surface transition-all active:scale-[0.98] text-[11px] opacity-60">
                  Reschedule
                </button>
              )}
            </div>
          </div>

          {/* Loyalty Card (Premium Membership Aesthetic) */}
          <div className="md:w-[420px] bg-primary text-on-primary p-12 rounded-lg shadow-technical relative overflow-hidden group border border-white/5">
            {/* Technical Background Details */}
            <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute inset-0 @apply technical-grid"></div>
              <div className="absolute top-[-20%] right-[-20%] w-64 h-64 border border-white/20 rounded-full"></div>
            </div>

            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="flex justify-between items-start mb-10">
                  <span className="font-label-md uppercase tracking-[0.3em] text-[10px] opacity-60">
                    Selor • Privilege
                  </span>
                  <span className="material-symbols-outlined text-white/30 text-3xl">
                    contactless
                  </span>
                </div>
                <h2 className="font-display-lg text-headline-lg mb-4 tracking-tight lowercase">
                  {loyaltyProgress >= 10
                    ? "platinum tier"
                    : loyaltyProgress >= 5
                      ? "elite status"
                      : "studio guest"}
                </h2>
                <div className="mt-8 space-y-1">
                  <p className="font-label-md uppercase tracking-widest text-[9px] opacity-40">
                    Account Name
                  </p>
                  <p className="font-headline-md text-xl tracking-tight">
                    {user?.name || "Guest Holder"}
                  </p>
                </div>
              </div>

              <div className="mt-16">
                <div className="flex justify-between font-label-md uppercase tracking-[0.2em] text-[9px] opacity-50 mb-4">
                  <span>Rituals achieved</span>
                  <span>
                    {loyaltyProgress} / {loyaltyGoal}
                  </span>
                </div>
                <div className="h-0.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(255,255,255,0.8)]"
                    style={{
                      width: `${(loyaltyProgress / loyaltyGoal) * 100}%`,
                    }}
                  />
                </div>
                <p className="mt-6 font-label-md text-[10px] uppercase tracking-[0.2em] opacity-40 text-center">
                  {loyaltyGoal - loyaltyProgress} sessions to next echelon
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Artisans */}
      <section className="mb-24">
        <div className="flex items-baseline justify-between mb-10 border-b border-outline-variant/30 pb-4">
          <h3 className="font-display-lg text-headline-lg text-on-surface tracking-tight lowercase">
            our artisans
          </h3>
          <Link
            className="font-label-md text-primary uppercase tracking-widest text-[11px] hover:opacity-70 transition-all flex items-center gap-2"
            href="/book/service"
          >
            VIEW COLLECTION
            <span className="material-symbols-outlined text-sm">
              arrow_forward
            </span>
          </Link>
        </div>
        {loading ? (
          <div className="flex gap-8">
            {[1, 2, 3].map((i) => (
              <SkeletonBlock key={i} className="min-w-[280px] aspect-[3/4]" />
            ))}
          </div>
        ) : (
          <div className="flex gap-8 overflow-x-auto pb-12 custom-scrollbar snap-x">
            {barbers.length === 0 ? (
              <p className="text-on-surface-variant font-label-md uppercase tracking-widest opacity-40 py-10">
                No active artisans listed.
              </p>
            ) : (
              barbers.map((barber) => (
                <Link
                  key={barber.id}
                  href={`/book/time`}
                  className="min-w-[280px] snap-start group block"
                >
                  <div className="relative aspect-[4/5] rounded-lg overflow-hidden mb-6 bg-surface-container-low transition-all duration-500 hover:shadow-technical group-hover:-translate-y-2">
                    <div className="w-full h-full bg-gradient-to-br from-surface-container-high/50 to-surface-container-low flex items-center justify-center">
                      <span
                        className="material-symbols-outlined text-[100px] text-primary/5 group-hover:text-primary/10 transition-colors duration-500"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        person
                      </span>
                    </div>
                    {/* Floating Info Overlay */}
                    <div className="absolute inset-0 p-8 flex flex-col justify-end bg-gradient-to-t from-primary/80 via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500">
                      <p className="text-white font-display-lg text-2xl mb-1 tracking-tight">
                        {barber.name ?? "Artisan"}
                      </p>
                      <div className="flex items-center gap-3">
                        <span className="w-1 h-1 bg-white rounded-full"></span>
                        <p className="text-white/70 font-label-md uppercase tracking-[0.2em] text-[9px]">
                          Master Specialist
                        </p>
                      </div>
                    </div>
                    {/* Master Badge */}
                    <div className="absolute top-6 right-6 w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
                      <span className="material-symbols-outlined text-white text-[20px]">
                        workspace_premium
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </section>

      {/* Quick Book CTA */}
      <section className="mb-32">
        <div className="p-16 rounded-lg bg-surface-container border border-outline-variant/30 text-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-1 bg-tertiary"></div>
          <h3 className="font-display-lg text-display-lg mb-4 tracking-tight lowercase">
            ready for refinement?
          </h3>
          <p className="text-on-surface-variant/70 mb-12 font-body-lg max-w-lg mx-auto">
            Experience the pinnacle of grooming. Secure your next session with
            our master artisans.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              href="/book/service"
              className="px-12 py-5 bg-primary text-on-primary rounded-md font-label-md uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:opacity-90 transition-all active:scale-[0.98]"
            >
              Book Session
            </Link>
            <Link
              href="/dashboard"
              className="px-12 py-5 border border-outline text-on-surface rounded-md font-label-md uppercase tracking-[0.2em] hover:bg-surface-container-highest transition-all active:scale-[0.98]"
            >
              Virtual Queue
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

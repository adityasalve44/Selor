"use client";

import { useEffect } from "react";

import { useBookingDemoStore } from "@/lib/stores/booking-demo-store";

async function parseJson(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error?.message ?? "Request failed");
  }
  return data;
}

export function BookingDemo() {
  const {
    services,
    barbers,
    selectedServiceIds,
    selectedBarberId,
    selectedDate,
    slots,
    loading,
    error,
    success,
    setServices,
    setBarbers,
    setSelectedServiceIds,
    setSelectedBarberId,
    setSelectedDate,
    setSlots,
    setLoading,
    setError,
    setSuccess,
  } = useBookingDemoStore();

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        const [servicesResponse, barbersResponse] = await Promise.all([
          fetch("/api/services"),
          fetch("/api/barbers"),
        ]);
        const [servicesData, barbersData] = await Promise.all([
          parseJson(servicesResponse),
          parseJson(barbersResponse),
        ]);
        setServices(servicesData.services ?? []);
        setBarbers(barbersData.barbers ?? []);
        setSelectedServiceIds(servicesData.services?.[0] ? [servicesData.services[0].id] : []);
        setSelectedBarberId(barbersData.barbers?.[0]?.id ?? "");
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load data.");
      } finally {
        setLoading(false);
      }
    })();
  }, [
    setBarbers,
    setError,
    setLoading,
    setSelectedBarberId,
    setSelectedServiceIds,
    setServices,
  ]);

  async function loadAvailability() {
    if (!selectedBarberId || selectedServiceIds.length === 0) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        barber_id: selectedBarberId,
        date: selectedDate,
      });
      selectedServiceIds.forEach((serviceId) => params.append("service_id", serviceId));
      const response = await fetch(`/api/availability?${params.toString()}`);
      const data = await parseJson(response);
      setSlots(data.slots ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load availability.");
    } finally {
      setLoading(false);
    }
  }

  async function bookSlot(startTime: string) {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-idempotency-key": crypto.randomUUID(),
        },
        body: JSON.stringify({
          barberId: selectedBarberId,
          serviceIds: selectedServiceIds,
          startTime,
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      const data = await parseJson(response);
      setSuccess(`Booked appointment ${data.appointment?.id ?? ""}`.trim());
      await loadAvailability();
    } catch (bookingError) {
      setError(
        bookingError instanceof Error ? bookingError.message : "Failed to create booking.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="grid gap-6 rounded-lg border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
      <div className="grid gap-2">
        <h2 className="text-2xl font-semibold text-on-surface">Reference Booking Flow</h2>
        <p className="text-sm text-secondary">
          This demo uses the real route handlers, keeps UI state in Zustand, and expects
          Supabase auth/session cookies for writes.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm text-zinc-700">
          Barber
          <select
            className="rounded-md border border-zinc-300 px-3 py-2"
            value={selectedBarberId}
            onChange={(event) => setSelectedBarberId(event.target.value)}
          >
            <option value="">Select barber</option>
            {barbers.map((barber) => (
              <option key={barber.id} value={barber.id}>
                {barber.name ?? barber.id}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm text-zinc-700">
          Service
          <select
            className="rounded-md border border-zinc-300 px-3 py-2"
            value={selectedServiceIds[0] ?? ""}
            onChange={(event) => setSelectedServiceIds(event.target.value ? [event.target.value] : [])}
          >
            <option value="">Select service</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} ({service.durationMinutes}m)
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm text-zinc-700">
          Date
          <input
            className="rounded-md border border-zinc-300 px-3 py-2"
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
          onClick={() => void loadAvailability()}
          type="button"
        >
          Load availability
        </button>
        <a
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700"
          href="/api/auth/login?next=/"
        >
          Sign in with Google
        </a>
      </div>

      {loading ? <p className="text-sm text-zinc-500">Working...</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-600">{success}</p> : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {slots.length === 0 ? (
          <p className="text-sm text-zinc-500">No slots loaded yet.</p>
        ) : (
          slots.map((slot) => (
            <button
              key={slot.startTime}
              className="rounded-md border border-outline-variant px-4 py-3 text-left disabled:cursor-not-allowed disabled:bg-surface-container-low disabled:text-zinc-400"
              disabled={!slot.available}
              onClick={() => void bookSlot(slot.startTime)}
              type="button"
            >
              <span className="block text-sm font-medium">{slot.startTime}</span>
              <span className="block text-xs text-zinc-500">{slot.available ? "Available" : "Blocked"}</span>
            </button>
          ))
        )}
      </div>
    </section>
  );
}

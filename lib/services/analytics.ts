/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppError } from "@/lib/http/errors";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { AnalyticsSeriesDto } from "@/types/domain";

export async function getAnalyticsOverview(input: { from?: string; to?: string }) {
  const supabase = createAdminSupabaseClient() as any;

  console.log('[getAnalyticsOverview] Range:', input);
  let bookingsQuery = supabase.from("analytics_bookings_daily").select("*").order("bucket_date", { ascending: true });
  let queueQuery = supabase.from("analytics_queue_daily").select("*").order("bucket_date", { ascending: true });
  let utilizationQuery = supabase.from("analytics_barber_utilization").select("*").order("bucket_start", { ascending: true });

  if (input.from) {
    bookingsQuery = bookingsQuery.gte("bucket_date", input.from);
    queueQuery = queueQuery.gte("bucket_date", input.from);
    utilizationQuery = utilizationQuery.gte("bucket_start", `${input.from}T00:00:00Z`);
  }
  if (input.to) {
    bookingsQuery = bookingsQuery.lte("bucket_date", input.to);
    queueQuery = queueQuery.lte("bucket_date", input.to);
    utilizationQuery = utilizationQuery.lte("bucket_start", `${input.to}T23:59:59Z`);
  }

  const [{ data: bookings, error: bookingsError }, { data: queue, error: queueError }, { data: utilization, error: utilizationError }] =
    await Promise.all([bookingsQuery, queueQuery, utilizationQuery]);

  if (bookingsError || queueError || utilizationError) {
    console.error('[getAnalyticsOverview] DB Errors:', { bookingsError, queueError, utilizationError });
    throw new AppError("ANALYTICS_FAILED", "Unable to load analytics.", 500, {
      bookingsError,
      queueError,
      utilizationError,
    });
  }

  const withinRange = (value: string) =>
    (!input.from || value >= input.from) && (!input.to || value <= input.to);

  const bookingSeries: AnalyticsSeriesDto[] = [
    {
      key: "bookings",
      label: "Bookings",
      points: ((bookings ?? []) as Array<{ bucket_date: string; booked_count: number }>)
        .filter((row) => withinRange(row.bucket_date))
        .map((row) => ({ bucket: row.bucket_date, value: row.booked_count })),
    },
    {
      key: "completed",
      label: "Completed",
      points: ((bookings ?? []) as Array<{ bucket_date: string; completed_count: number }>)
        .filter((row) => withinRange(row.bucket_date))
        .map((row) => ({ bucket: row.bucket_date, value: row.completed_count })),
    },
    {
      key: "revenue",
      label: "Revenue",
      points: ((bookings ?? []) as Array<{ bucket_date: string; paid_revenue: string | null }>)
        .filter((row) => withinRange(row.bucket_date))
        .map((row) => ({
          bucket: row.bucket_date,
          value: Number(row.paid_revenue ?? 0),
        })),
    },
    {
      key: "queue_completed",
      label: "Queue Completed",
      points: ((queue ?? []) as Array<{ bucket_date: string; completed_count: number }>)
        .filter((row) => withinRange(row.bucket_date))
        .map((row) => ({ bucket: row.bucket_date, value: row.completed_count })),
    },
    {
      key: "barber_utilization",
      label: "Barber Utilization",
      points: (
        (utilization ?? []) as Array<{
          bucket_start: string | null;
          occupied_minutes: number | null;
          barber_id: string;
          appointment_count: number;
        }>
      )
        .filter((row) => row.bucket_start && withinRange(row.bucket_start.split('T')[0]))
        .map((row) => ({
          bucket: row.bucket_start!.split('T')[0],
          value: row.occupied_minutes ?? 0,
          meta: {
            barberId: row.barber_id,
            appointmentCount: row.appointment_count,
          },
        })),
    },
  ];

  return bookingSeries;
}

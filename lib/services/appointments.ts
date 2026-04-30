/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppError } from "@/lib/http/errors";
import { unwrapRpcResponse } from "@/lib/http/response";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { decodeCursor, encodeCursor } from "@/lib/pagination";
import { mapAppointment } from "@/lib/services/mappers";
import type { AppointmentDto, PaginatedResponse } from "@/types/domain";
import type { Database } from "@/types/database";

type AppointmentWithRelations = Database["public"]["Tables"]["appointments"]["Row"] & {
  users?: { name: string | null; email: string } | null;
  appointment_services?: Database["public"]["Tables"]["appointment_services"]["Row"][] | null;
};

export async function createAppointment(input: {
  barberId: string;
  serviceIds: string[];
  startTime: string;
  idempotencyKey?: string;
}) {
  const supabase = (await createServerSupabaseClient()) as any;
  const { data, error } = await supabase.rpc("create_booking", {
    p_barber_id: input.barberId,
    p_service_ids: input.serviceIds,
    p_start_time: input.startTime,
    p_idempotency_key: input.idempotencyKey ?? null,
  });

  if (error) {
    throw new AppError("BOOKING_FAILED", error.message, 400, error);
  }

  return unwrapRpcResponse<{ appointment?: AppointmentDto; error?: unknown; replayed?: boolean }>(data);
}

export async function updateAppointment(input: {
  appointmentId: string;
  action: "cancel" | "reschedule" | "payment";
  startTime?: string;
  barberId?: string;
  serviceIds?: string[];
  paymentStatus?: Database["public"]["Tables"]["appointments"]["Row"]["payment_status"];
  paymentMode?: Database["public"]["Tables"]["appointments"]["Row"]["payment_mode"];
  idempotencyKey?: string;
}) {
  const supabase = (await createServerSupabaseClient()) as any;
  const { data, error } = await supabase.rpc("update_booking", {
    p_appointment_id: input.appointmentId,
    p_action: input.action,
    p_start_time: input.startTime ?? null,
    p_barber_id: input.barberId ?? null,
    p_service_ids: input.serviceIds ?? null,
    p_payment_status: input.paymentStatus ?? null,
    p_payment_mode: input.paymentMode ?? null,
    p_idempotency_key: input.idempotencyKey ?? null,
  });

  if (error) {
    throw new AppError("BOOKING_UPDATE_FAILED", error.message, 400, error);
  }

  return unwrapRpcResponse<{ appointment?: AppointmentDto; error?: unknown; replayed?: boolean }>(data);
}

export async function listAppointments(input: {
  role: "customer" | "barber" | "admin";
  userId: string;
  barberId: string | null;
  limit: number;
  cursor?: string;
  status?: string;
  barberIdFilter?: string;
  serviceId?: string;
  paymentStatus?: string;
  from?: string;
  to?: string;
  search?: string;
}): Promise<PaginatedResponse<AppointmentDto>> {
  const supabase = createAdminSupabaseClient() as any;
  const cursor = decodeCursor(input.cursor);
  let query = supabase
    .from("appointments")
    .select(
      "*, users(name,email), appointment_services(*)",
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(input.limit + 1);

  if (input.role === "customer") {
    query = query.eq("user_id", input.userId);
  } else if (input.role === "barber" && input.barberId) {
    query = query.eq("barber_id", input.barberId);
  }

  if (input.status) query = query.eq("status", input.status as Database["public"]["Tables"]["appointments"]["Row"]["status"]);
  if (input.barberIdFilter) query = query.eq("barber_id", input.barberIdFilter);
  if (input.paymentStatus) {
    query = query.eq(
      "payment_status",
      input.paymentStatus as Database["public"]["Tables"]["appointments"]["Row"]["payment_status"],
    );
  }
  if (input.from) query = query.gte("start_time", `${input.from}T00:00:00.000Z`);
  if (input.to) query = query.lte("start_time", `${input.to}T23:59:59.999Z`);
  if (cursor) query = query.lt("created_at", cursor.createdAt);

  const { data, error } = await query;

  if (error) {
    throw new AppError("APPOINTMENTS_LOOKUP_FAILED", "Unable to load appointments.", 500, error);
  }

  let rows = (data ?? []) as AppointmentWithRelations[];

  if (input.serviceId) {
    rows = rows.filter((row) =>
      (row.appointment_services ?? []).some((service) => service.service_id === input.serviceId),
    );
  }

  if (input.search) {
    const search = input.search.toLowerCase();
    rows = rows.filter((row) => {
      const name = row.users?.name?.toLowerCase() ?? "";
      const email = row.users?.email?.toLowerCase() ?? "";
      const services = (row.appointment_services ?? [])
        .map((service) => service.service_name_snapshot.toLowerCase())
        .join(" ");

      return name.includes(search) || email.includes(search) || services.includes(search);
    });
  }

  const sliced = rows.slice(0, input.limit);
  const next = rows.length > input.limit ? rows[input.limit - 1] : null;

  return {
    data: sliced.map((row) => mapAppointment(row)),
    nextCursor: next ? encodeCursor({ createdAt: next.created_at, id: next.id }) : null,
  };
}

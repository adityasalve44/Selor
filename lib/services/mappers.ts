import type { Database } from "@/types/database";
import type {
  AppointmentDto,
  AppointmentServiceDto,
  BarberDto,
  InviteDto,
  QueueTokenDto,
  ServiceDto,
  ShopSettingsDto,
} from "@/types/domain";

type AppointmentRow = Database["public"]["Tables"]["appointments"]["Row"] & {
  users?: { name: string | null; email: string } | null;
  appointment_services?: Database["public"]["Tables"]["appointment_services"]["Row"][] | null;
};

export function mapService(row: Database["public"]["Tables"]["services"]["Row"]): ServiceDto {
  return {
    id: row.id,
    name: row.name,
    durationMinutes: row.duration_minutes,
    price: Number(row.price),
  };
}

export function mapBarber(
  row: Database["public"]["Tables"]["barbers"]["Row"] & {
    users?: { id: string; name: string | null } | { id: string; name: string | null }[] | null;
  },
): BarberDto {
  const user = Array.isArray(row.users) ? row.users[0] : row.users;

  return {
    id: row.id,
    userId: row.user_id,
    name: user?.name ?? null,
    isActive: row.is_active,
  };
}

export function mapAppointmentService(
  row: Database["public"]["Tables"]["appointment_services"]["Row"],
): AppointmentServiceDto {
  return {
    serviceId: row.service_id,
    name: row.service_name_snapshot,
    durationMinutes: row.duration_minutes_snapshot,
    price: Number(row.price_snapshot),
    sortOrder: row.sort_order,
  };
}

export function mapAppointment(row: AppointmentRow): AppointmentDto {
  return {
    id: row.id,
    userId: row.user_id,
    barberId: row.barber_id,
    customerName: row.users?.name || row.users?.email || 'Guest',
    startTime: row.start_time,
    endTime: row.end_time,
    durationMinutes: row.duration_minutes,
    bufferBeforeMinutes: row.buffer_before_minutes,
    bufferAfterMinutes: row.buffer_after_minutes,
    delayMinutes: row.delay_minutes,
    serviceTotal: Number(row.service_total),
    status: row.status,
    paymentStatus: row.payment_status,
    paymentMode: row.payment_mode,
    createdAt: row.created_at,
    services: (row.appointment_services ?? []).map(mapAppointmentService),
  };
}

export function mapQueueToken(
  row: Database["public"]["Tables"]["queue_tokens"]["Row"],
): QueueTokenDto {
  return {
    id: row.id,
    userId: row.user_id,
    barberId: row.barber_id,
    status: row.status,
    position: row.position,
    queueDate: row.queue_date,
    createdAt: row.created_at,
  };
}

export function mapInvite(
  row: Database["public"]["Tables"]["invites"]["Row"],
  deepLink: string,
): InviteDto {
  return {
    id: row.id,
    token: row.token,
    status: row.status,
    expiresAt: row.expires_at,
    deepLink,
    metadata: row.metadata,
  };
}

export function mapSettings(
  row: Database["public"]["Tables"]["shop_settings"]["Row"],
): ShopSettingsDto {
  return {
    shopName: row.shop_name,
    timezone: row.timezone,
    weeklyHours: row.weekly_hours,
    defaultBufferBeforeMinutes: row.default_buffer_before_minutes,
    defaultBufferAfterMinutes: row.default_buffer_after_minutes,
    slotIntervalMinutes: row.slot_interval_minutes,
    reminderLeadMinutes: row.reminder_lead_minutes,
    inviteBaseUrl: row.invite_base_url,
  };
}

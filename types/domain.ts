import type {
  AppointmentStatus,
  BarberOverrideType,
  InviteStatus,
  Json,
  PaymentMode,
  PaymentStatus,
  QueueStatus,
  UserRole,
} from "@/types/database";

export interface CurrentUser {
  id: string;
  email: string;
  role: UserRole;
  name: string | null;
  barberId: string | null;
}

export interface ServiceDto {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
}

export interface BarberDto {
  id: string;
  userId: string;
  name: string | null;
  isActive: boolean;
}

export interface ClientDto {
  id: string;
  name: string | null;
  email: string;
  loyaltyId: string;
  loyaltyTier: "PLATINUM" | "GOLD" | "SILVER" | "MEMBER";
  lastVisit: string | null;
  visitCount: number;
}

export interface AppointmentServiceDto {
  serviceId: string;
  name: string;
  durationMinutes: number;
  price: number;
  sortOrder: number;
}

export interface AppointmentDto {
  id: string;
  userId: string;
  barberId: string;
  customerName?: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  delayMinutes: number;
  serviceTotal: number;
  status: AppointmentStatus;
  paymentStatus: PaymentStatus;
  paymentMode: PaymentMode;
  createdAt: string;
  services: AppointmentServiceDto[];
}

export interface QueueTokenDto {
  id: string;
  userId: string;
  barberId: string | null;
  status: QueueStatus;
  position: number;
  queueDate: string;
  createdAt: string;
}

export interface InviteDto {
  id: string;
  token: string;
  status: InviteStatus;
  expiresAt: string;
  deepLink: string;
  metadata: Json;
}

export interface AvailabilitySlotDto {
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface AnalyticsSeriesPoint {
  bucket: string;
  value: number;
  meta?: Record<string, Json>;
}

export interface AnalyticsSeriesDto {
  key: string;
  label: string;
  points: AnalyticsSeriesPoint[];
}

export interface BarberAvailabilityOverrideDto {
  id: string;
  barberId: string;
  overrideType: BarberOverrideType;
  startTime: string;
  endTime: string;
  reason: string | null;
}

export interface ShopSettingsDto {
  shopName: string;
  timezone: string;
  weeklyHours: Json;
  defaultBufferBeforeMinutes: number;
  defaultBufferAfterMinutes: number;
  slotIntervalMinutes: number;
  reminderLeadMinutes: number[];
  inviteBaseUrl: string;
}

export interface ApiErrorShape {
  code: string;
  message: string;
  details?: Json;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
}

export interface ProductDto {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stockQuantity: number;
  category: string | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

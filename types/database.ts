export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "customer" | "barber" | "admin";
export type AppointmentStatus = "booked" | "completed" | "cancelled";
export type QueueStatus = "waiting" | "assigned" | "completed" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "refunded" | "failed";
export type PaymentMode = "cash" | "card" | "upi" | "wallet" | "unknown";
export type InviteStatus = "pending" | "accepted" | "expired" | "revoked";
export type NotificationStatus = "pending" | "processing" | "sent" | "failed";
export type BarberOverrideType = "leave" | "break" | "day_off" | "custom";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          role: UserRole;
          name: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id: string;
          email: string;
          role?: UserRole;
          name?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
      };
      barbers: {
        Row: {
          id: string;
          user_id: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["barbers"]["Insert"]>;
      };
      services: {
        Row: {
          id: string;
          name: string;
          duration_minutes: number;
          price: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          duration_minutes: number;
          price: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["services"]["Insert"]>;
      };
      shop_settings: {
        Row: {
          id: number;
          shop_name: string;
          timezone: string;
          weekly_hours: Json;
          default_buffer_before_minutes: number;
          default_buffer_after_minutes: number;
          slot_interval_minutes: number;
          reminder_lead_minutes: number[];
          invite_base_url: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["shop_settings"]["Row"]> & {
          id?: number;
        };
        Update: Partial<Database["public"]["Tables"]["shop_settings"]["Insert"]>;
      };
      appointments: {
        Row: {
          id: string;
          user_id: string;
          barber_id: string;
          start_time: string;
          end_time: string;
          duration_minutes: number;
          buffer_before_minutes: number;
          buffer_after_minutes: number;
          delay_minutes: number;
          service_total: string;
          status: AppointmentStatus;
          payment_status: PaymentStatus;
          payment_mode: PaymentMode;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          barber_id: string;
          start_time: string;
          end_time: string;
          duration_minutes: number;
          buffer_before_minutes?: number;
          buffer_after_minutes?: number;
          delay_minutes?: number;
          service_total?: string;
          status?: AppointmentStatus;
          payment_status?: PaymentStatus;
          payment_mode?: PaymentMode;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["appointments"]["Insert"]>;
      };
      appointment_services: {
        Row: {
          appointment_id: string;
          service_id: string;
          sort_order: number;
          service_name_snapshot: string;
          duration_minutes_snapshot: number;
          price_snapshot: string;
          created_at: string;
        };
        Insert: Database["public"]["Tables"]["appointment_services"]["Row"];
        Update: Partial<Database["public"]["Tables"]["appointment_services"]["Row"]>;
      };
      barber_availability_overrides: {
        Row: {
          id: string;
          barber_id: string;
          override_type: BarberOverrideType;
          start_time: string;
          end_time: string;
          reason: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          barber_id: string;
          override_type: BarberOverrideType;
          start_time: string;
          end_time: string;
          reason?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["barber_availability_overrides"]["Insert"]>;
      };
      queue_tokens: {
        Row: {
          id: string;
          user_id: string;
          barber_id: string | null;
          status: QueueStatus;
          position: number;
          queue_date: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          barber_id?: string | null;
          status?: QueueStatus;
          position: number;
          queue_date: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["queue_tokens"]["Insert"]>;
      };
      invites: {
        Row: {
          id: string;
          token: string;
          inviter_id: string;
          status: InviteStatus;
          expires_at: string;
          accepted_at: string | null;
          revoked_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          token: string;
          inviter_id: string;
          status?: InviteStatus;
          expires_at: string;
          accepted_at?: string | null;
          revoked_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["invites"]["Insert"]>;
      };
      idempotency_keys: {
        Row: {
          id: number;
          user_id: string;
          scope: string;
          key: string;
          request_hash: string | null;
          response_body: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          scope: string;
          key: string;
          request_hash?: string | null;
          response_body?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["idempotency_keys"]["Insert"]>;
      };
      audit_logs: {
        Row: {
          id: number;
          actor_user_id: string | null;
          actor_role: "customer" | "barber" | "admin" | "system";
          entity_type: string;
          entity_id: string | null;
          action: string;
          before_data: Json | null;
          after_data: Json | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          actor_user_id?: string | null;
          actor_role: "customer" | "barber" | "admin" | "system";
          entity_type: string;
          entity_id?: string | null;
          action: string;
          before_data?: Json | null;
          after_data?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Insert"]>;
      };
      notification_events: {
        Row: {
          id: number;
          event_type: string;
          entity_type: string;
          entity_id: string | null;
          user_id: string | null;
          payload: Json;
          status: NotificationStatus;
          attempts: number;
          next_attempt_at: string | null;
          last_error: string | null;
          processed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          event_type: string;
          entity_type: string;
          entity_id?: string | null;
          user_id?: string | null;
          payload?: Json;
          status?: NotificationStatus;
          attempts?: number;
          next_attempt_at?: string | null;
          last_error?: string | null;
          processed_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notification_events"]["Insert"]>;
      };
      analytics_bookings_daily: {
        Row: {
          bucket_date: string;
          booked_count: number;
          completed_count: number;
          cancelled_count: number;
          paid_revenue: string | null;
        };
      };
      analytics_queue_daily: {
        Row: {
          bucket_date: string;
          waiting_count: number;
          assigned_count: number;
          completed_count: number;
          avg_position: string | null;
        };
      };
      analytics_barber_utilization: {
        Row: {
          barber_id: string;
          bucket_start: string;
          occupied_minutes: number | null;
          appointment_count: number;
        };
      };
    };
    Functions: {
      create_booking: {
        Args: {
          p_barber_id: string;
          p_service_ids: string[];
          p_start_time: string;
          p_idempotency_key?: string | null;
        };
        Returns: Json;
      };
      update_booking: {
        Args: {
          p_appointment_id: string;
          p_action: string;
          p_start_time?: string | null;
          p_barber_id?: string | null;
          p_service_ids?: string[] | null;
          p_payment_status?: PaymentStatus | null;
          p_payment_mode?: PaymentMode | null;
          p_idempotency_key?: string | null;
        };
        Returns: Json;
      };
      join_queue: {
        Args: { p_idempotency_key?: string | null };
        Returns: Json;
      };
      assign_queue_token: {
        Args: {
          p_queue_token_id: string;
          p_barber_id: string;
          p_idempotency_key?: string | null;
        };
        Returns: Json;
      };
      complete_queue_token: {
        Args: {
          p_queue_token_id: string;
          p_idempotency_key?: string | null;
        };
        Returns: Json;
      };
    };
  };
}

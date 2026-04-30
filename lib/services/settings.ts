/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppError } from "@/lib/http/errors";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { mapSettings } from "@/lib/services/mappers";
import type { ShopSettingsDto } from "@/types/domain";

export async function getShopSettings(): Promise<ShopSettingsDto> {
  const supabase = createAdminSupabaseClient() as any;
  const { data, error } = await supabase
    .from("shop_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error || !data) {
    throw new AppError("SETTINGS_NOT_FOUND", "Shop settings are unavailable.", 500, error);
  }

  return mapSettings(data);
}

export async function updateShopSettings(updates: Partial<ShopSettingsDto>) {
  const supabase = createAdminSupabaseClient() as any;
  const { data, error } = await supabase
    .from("shop_settings")
    .update({
      shop_name: updates.shopName,
      timezone: updates.timezone,
      weekly_hours: updates.weeklyHours,
      default_buffer_before_minutes: updates.defaultBufferBeforeMinutes,
      default_buffer_after_minutes: updates.defaultBufferAfterMinutes,
      slot_interval_minutes: updates.slotIntervalMinutes,
      reminder_lead_minutes: updates.reminderLeadMinutes,
      invite_base_url: updates.inviteBaseUrl,
    })
    .eq("id", 1)
    .select("*")
    .single();

  if (error || !data) {
    throw new AppError("SETTINGS_UPDATE_FAILED", "Unable to update shop settings.", 500, error);
  }

  return mapSettings(data);
}

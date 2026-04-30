import { z } from "zod";

export const weekdayHoursSchema = z.object({
  enabled: z.boolean(),
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
});

export const updateSettingsSchema = z.object({
  shopName: z.string().trim().min(2).max(120).optional(),
  timezone: z.string().trim().min(1).max(100).optional(),
  weeklyHours: z.record(z.string(), weekdayHoursSchema).optional(),
  defaultBufferBeforeMinutes: z.coerce.number().int().min(0).max(240).optional(),
  defaultBufferAfterMinutes: z.coerce.number().int().min(0).max(240).optional(),
  slotIntervalMinutes: z.coerce.number().int().min(5).max(120).optional(),
  reminderLeadMinutes: z.array(z.coerce.number().int().min(5).max(7 * 24 * 60)).optional(),
  inviteBaseUrl: z.url().optional(),
});

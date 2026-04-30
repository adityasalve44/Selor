import { z } from "zod";

export const uuidSchema = z.uuid();

export const isoDateTimeSchema = z
  .string()
  .datetime({ offset: true })
  .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid datetime.");

export const idempotencyKeySchema = z
  .string()
  .trim()
  .min(8)
  .max(128)
  .regex(/^[a-zA-Z0-9:_\.\+-]+$/, "Invalid idempotency key format.")
  .optional();

export const limitSchema = z.coerce.number().int().min(1).max(100).default(20);

export const cursorSchema = z.string().trim().min(1).max(256).optional();

export const searchSchema = z.string().trim().min(1).max(100).optional();

export const dateRangeSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

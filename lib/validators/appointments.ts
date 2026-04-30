import { z } from "zod";

import {
  cursorSchema,
  idempotencyKeySchema,
  isoDateTimeSchema,
  limitSchema,
  searchSchema,
  uuidSchema,
} from "@/lib/validators/common";

export const createAppointmentSchema = z.object({
  barberId: uuidSchema,
  serviceIds: z.array(uuidSchema).min(1).max(10),
  startTime: isoDateTimeSchema,
  idempotencyKey: idempotencyKeySchema,
});

export const updateAppointmentSchema = z
  .object({
    action: z.enum(["cancel", "reschedule", "payment"]),
    startTime: isoDateTimeSchema.optional(),
    barberId: uuidSchema.optional(),
    serviceIds: z.array(uuidSchema).min(1).max(10).optional(),
    paymentStatus: z.enum(["pending", "paid", "refunded", "failed"]).optional(),
    paymentMode: z.enum(["cash", "card", "upi", "wallet", "unknown"]).optional(),
    idempotencyKey: idempotencyKeySchema,
  })
  .superRefine((input, ctx) => {
    if (input.action === "reschedule" && !input.startTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["startTime"],
        message: "startTime is required when rescheduling.",
      });
    }

    if (
      input.action === "payment" &&
      !input.paymentStatus &&
      !input.paymentMode
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["paymentStatus"],
        message: "paymentStatus or paymentMode is required for payment updates.",
      });
    }
  });

export const availabilityQuerySchema = z.object({
  barber_id: uuidSchema,
  service_ids: z
    .union([uuidSchema, z.array(uuidSchema).min(1).max(10)])
    .transform((value) => (Array.isArray(value) ? value : [value])),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
});

export const listAppointmentsQuerySchema = z.object({
  limit: limitSchema,
  cursor: cursorSchema,
  search: searchSchema,
  status: z.enum(["booked", "completed", "cancelled"]).optional(),
  barberId: uuidSchema.optional(),
  serviceId: uuidSchema.optional(),
  paymentStatus: z.enum(["pending", "paid", "refunded", "failed"]).optional(),
  from: z.string().date().optional(),
  to: z.string().date().optional(),
});

import { z } from "zod";

import { cursorSchema, idempotencyKeySchema, limitSchema, searchSchema, uuidSchema } from "@/lib/validators/common";

export const joinQueueSchema = z.object({
  idempotencyKey: idempotencyKeySchema,
});

export const assignQueueSchema = z.object({
  barberId: uuidSchema,
  idempotencyKey: idempotencyKeySchema,
});

export const completeQueueSchema = z.object({
  idempotencyKey: idempotencyKeySchema,
});

export const listQueueQuerySchema = z.object({
  limit: limitSchema,
  cursor: cursorSchema,
  search: searchSchema,
  status: z.enum(["waiting", "assigned", "completed", "cancelled"]).optional(),
  barberId: uuidSchema.optional(),
  queueDate: z.string().date().optional(),
});

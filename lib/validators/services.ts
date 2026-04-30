import { z } from "zod";

export const createServiceSchema = z.object({
  name: z.string().trim().min(2).max(120),
  durationMinutes: z.coerce.number().int().min(5).max(480),
  price: z.coerce.number().min(0).max(100_000),
});

export const updateServiceSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  durationMinutes: z.coerce.number().int().min(5).max(480).optional(),
  price: z.coerce.number().min(0).max(100_000).optional(),
  isActive: z.boolean().optional(),
});

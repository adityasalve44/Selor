import { z } from "zod";
import { uuidSchema } from "@/lib/validators/common";

export const createBarberSchema = z.object({
  name: z.string().trim().min(2).max(120),
});

export const updateBarberSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  isActive: z.boolean().optional(),
});

export const barberIdParamSchema = z.object({
  id: uuidSchema,
});

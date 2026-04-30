import { z } from "zod";

export const analyticsQuerySchema = z.object({
  from: z.string().date().optional(),
  to: z.string().date().optional(),
});

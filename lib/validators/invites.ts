import { z } from "zod";

import { uuidSchema } from "@/lib/validators/common";

export const createInviteSchema = z.object({
  expiresInHours: z.coerce.number().int().min(1).max(24 * 30).default(72),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const inviteTokenSchema = z.object({
  token: z.string().trim().min(12).max(255),
});

export const inviteQrParamsSchema = z.object({
  id: uuidSchema,
});

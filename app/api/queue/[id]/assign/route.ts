import { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import { requireRole } from "@/lib/auth/guards";
import { handleRouteError, jsonResponse } from "@/lib/http/response";
import { assertRateLimit } from "@/lib/rate-limit";
import { assignQueueToken } from "@/lib/services/queue";
import { assignQueueSchema } from "@/lib/validators/queue";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    assertRateLimit(request, "queue:assign", 40, 60_000);
    requireRole(await getCurrentUser(), ["admin", "barber"]);
    const params = await context.params;
    const parsed = assignQueueSchema.parse(await request.json());
    const result = await assignQueueToken({
      queueTokenId: params.id,
      barberId: parsed.barberId,
      idempotencyKey: parsed.idempotencyKey,
    });

    return jsonResponse(result.body, { status: result.statusCode });
  } catch (error) {
    return handleRouteError(error);
  }
}

import { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import { requireRole } from "@/lib/auth/guards";
import { handleRouteError, jsonResponse } from "@/lib/http/response";
import { assertRateLimit } from "@/lib/rate-limit";
import { completeQueueToken } from "@/lib/services/queue";
import { completeQueueSchema } from "@/lib/validators/queue";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    assertRateLimit(request, "queue:complete", 40, 60_000);
    requireRole(await getCurrentUser(), ["admin", "barber"]);
    const params = await context.params;
    const parsed = completeQueueSchema.parse(await request.json().catch(() => ({})));
    const result = await completeQueueToken({
      queueTokenId: params.id,
      idempotencyKey: parsed.idempotencyKey,
    });

    return jsonResponse(result.body, { status: result.statusCode });
  } catch (error) {
    return handleRouteError(error);
  }
}

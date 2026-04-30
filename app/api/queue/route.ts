import { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import { requireUser } from "@/lib/auth/guards";
import { handleRouteError, jsonResponse } from "@/lib/http/response";
import { assertRateLimit } from "@/lib/rate-limit";
import { joinQueue, listQueue } from "@/lib/services/queue";
import { joinQueueSchema, listQueueQuerySchema } from "@/lib/validators/queue";

export async function GET(request: NextRequest) {
  try {
    const user = requireUser(await getCurrentUser());
    const { searchParams } = request.nextUrl;
    const parsed = listQueueQuerySchema.parse({
      limit: searchParams.get("limit"),
      cursor: searchParams.get("cursor") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      barberId: searchParams.get("barberId") ?? undefined,
      queueDate: searchParams.get("queueDate") ?? undefined,
    });

    const result = await listQueue({
      role: user.role,
      userId: user.id,
      barberId: user.barberId,
      limit: parsed.limit,
      cursor: parsed.cursor,
      search: parsed.search,
      status: parsed.status,
      barberIdFilter: parsed.barberId,
      queueDate: parsed.queueDate,
    });

    return jsonResponse(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertRateLimit(request, "queue:join", 20, 60_000);
    requireUser(await getCurrentUser());
    const parsed = joinQueueSchema.parse(await request.json().catch(() => ({})));
    const result = await joinQueue(parsed.idempotencyKey);
    return jsonResponse(result.body, { status: result.statusCode });
  } catch (error) {
    return handleRouteError(error);
  }
}

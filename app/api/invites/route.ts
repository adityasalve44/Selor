import { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import { requireRole } from "@/lib/auth/guards";
import { handleRouteError, jsonResponse } from "@/lib/http/response";
import { assertRateLimit } from "@/lib/rate-limit";
import { createInvite } from "@/lib/services/invites";
import { createInviteSchema } from "@/lib/validators/invites";

export async function POST(request: NextRequest) {
  try {
    assertRateLimit(request, "invites:create", 20, 60_000);
    const user = requireRole(await getCurrentUser(), ["admin", "barber"]);
    const parsed = createInviteSchema.parse(await request.json().catch(() => ({})));
    const invite = await createInvite({
      inviterId: user.id,
      expiresInHours: parsed.expiresInHours,
      metadata: parsed.metadata,
    });

    return jsonResponse({ invite }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

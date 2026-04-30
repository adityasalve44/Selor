import { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import { requireUser } from "@/lib/auth/guards";
import { handleRouteError, jsonResponse } from "@/lib/http/response";
import { updateAppointment } from "@/lib/services/appointments";
import { assertRateLimit } from "@/lib/rate-limit";
import { updateAppointmentSchema } from "@/lib/validators/appointments";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    assertRateLimit(request, "appointments:update", 30, 60_000);
    requireUser(await getCurrentUser());
    const params = await context.params;
    const parsed = updateAppointmentSchema.parse(await request.json());
    const result = await updateAppointment({
      appointmentId: params.id,
      action: parsed.action,
      startTime: parsed.startTime,
      barberId: parsed.barberId,
      serviceIds: parsed.serviceIds,
      paymentStatus: parsed.paymentStatus,
      paymentMode: parsed.paymentMode,
      idempotencyKey: parsed.idempotencyKey,
    });

    return jsonResponse(result.body, { status: result.statusCode });
  } catch (error) {
    return handleRouteError(error);
  }
}

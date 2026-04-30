import { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import { requireUser } from "@/lib/auth/guards";
import { handleRouteError, jsonResponse } from "@/lib/http/response";
import { createAppointment, listAppointments } from "@/lib/services/appointments";
import { assertRateLimit } from "@/lib/rate-limit";
import {
  createAppointmentSchema,
  listAppointmentsQuerySchema,
} from "@/lib/validators/appointments";

export async function GET(request: NextRequest) {
  try {
    const user = requireUser(await getCurrentUser());
    const { searchParams } = request.nextUrl;
    const parsed = listAppointmentsQuerySchema.parse({
      limit: searchParams.get("limit"),
      cursor: searchParams.get("cursor") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      barberId: searchParams.get("barberId") ?? undefined,
      serviceId: searchParams.get("serviceId") ?? undefined,
      paymentStatus: searchParams.get("paymentStatus") ?? undefined,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
    });

    const result = await listAppointments({
      role: user.role,
      userId: user.id,
      barberId: user.barberId,
      limit: parsed.limit,
      cursor: parsed.cursor,
      search: parsed.search,
      status: parsed.status,
      barberIdFilter: parsed.barberId,
      serviceId: parsed.serviceId,
      paymentStatus: parsed.paymentStatus,
      from: parsed.from,
      to: parsed.to,
    });

    return jsonResponse(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertRateLimit(request, "appointments:create", 20, 60_000);
    requireUser(await getCurrentUser());
    const parsed = createAppointmentSchema.parse(await request.json());
    const result = await createAppointment(parsed);
    return jsonResponse(result.body, { status: result.statusCode });
  } catch (error) {
    return handleRouteError(error);
  }
}

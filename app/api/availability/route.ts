import { handleRouteError, jsonResponse } from "@/lib/http/response";
import { getAvailabilityForDay } from "@/lib/services/availability";
import { availabilityQuerySchema } from "@/lib/validators/appointments";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = availabilityQuerySchema.parse({
      barber_id: searchParams.get("barber_id"),
      service_ids: searchParams.getAll("service_id").length
        ? searchParams.getAll("service_id")
        : (searchParams.get("service_id") ?? searchParams.get("service_ids")),
      date: searchParams.get("date"),
    });

    const slots = await getAvailabilityForDay({
      barberId: parsed.barber_id,
      serviceIds: parsed.service_ids,
      date: parsed.date,
    });

    return jsonResponse({ slots });
  } catch (error) {
    return handleRouteError(error);
  }
}

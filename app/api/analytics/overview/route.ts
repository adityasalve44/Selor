import { getCurrentUser } from "@/lib/auth/get-current-user";
import { requireRole } from "@/lib/auth/guards";
import { handleRouteError, jsonResponse } from "@/lib/http/response";
import { getAnalyticsOverview } from "@/lib/services/analytics";
import { analyticsQuerySchema } from "@/lib/validators/analytics";

export async function GET(request: Request) {
  try {
    requireRole(await getCurrentUser(), ["admin", "barber"]);
    const { searchParams } = new URL(request.url);
    const parsed = analyticsQuerySchema.parse({
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
    });

    const series = await getAnalyticsOverview(parsed);
    return jsonResponse({ series });
  } catch (error) {
    return handleRouteError(error);
  }
}

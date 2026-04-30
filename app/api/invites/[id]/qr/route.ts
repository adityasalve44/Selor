import { getCurrentUser } from "@/lib/auth/get-current-user";
import { requireRole } from "@/lib/auth/guards";
import { handleRouteError } from "@/lib/http/response";
import { getInviteQrSvg } from "@/lib/services/invites";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    requireRole(await getCurrentUser(), ["admin", "barber"]);
    const params = await context.params;
    const svg = await getInviteQrSvg(params.id);

    return new Response(svg, {
      status: 200,
      headers: {
        "content-type": "image/svg+xml; charset=utf-8",
        "cache-control": "private, max-age=60",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

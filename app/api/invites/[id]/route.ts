import { handleRouteError, jsonResponse } from "@/lib/http/response";
import { getInviteByToken } from "@/lib/services/invites";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const params = await context.params;
    const invite = await getInviteByToken(params.id);
    return jsonResponse({ invite });
  } catch (error) {
    return handleRouteError(error);
  }
}

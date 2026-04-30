import { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import { requireRole } from "@/lib/auth/guards";
import { handleRouteError, jsonResponse } from "@/lib/http/response";
import { getShopSettings, updateShopSettings } from "@/lib/services/settings";
import { updateSettingsSchema } from "@/lib/validators/settings";

export async function GET() {
  try {
    const settings = await getShopSettings();
    return jsonResponse({ settings });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    requireRole(await getCurrentUser(), ["admin"]);
    const parsed = updateSettingsSchema.parse(await request.json());
    const settings = await updateShopSettings(parsed);
    return jsonResponse({ settings });
  } catch (error) {
    return handleRouteError(error);
  }
}

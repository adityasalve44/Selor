import { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import { requireRole } from "@/lib/auth/guards";
import { handleRouteError, jsonResponse } from "@/lib/http/response";
import { mapService } from "@/lib/services/mappers";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServiceSchema } from "@/lib/validators/services";

export async function GET() {
  try {
    const supabase = createAdminSupabaseClient()!;
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .is("deleted_at", null)
      .order("name");

    if (error) throw error;

    return jsonResponse({ services: (data ?? []).map(mapService) });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    requireRole(await getCurrentUser(), ["admin"]);
    const parsed = createServiceSchema.parse(await request.json());

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminSupabaseClient() as any;
    const { data, error } = await supabase
      .from("services")
      .insert({
        name: parsed.name,
        duration_minutes: parsed.durationMinutes,
        price: parsed.price,
        is_active: true,
      })
      .select("*")
      .single();

    if (error) throw error;

    return jsonResponse({ service: mapService(data) }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

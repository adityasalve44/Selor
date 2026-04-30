import { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import { requireRole } from "@/lib/auth/guards";
import { handleRouteError, jsonResponse } from "@/lib/http/response";
import { mapBarber } from "@/lib/services/mappers";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createBarberSchema } from "@/lib/validators/barbers";

export async function GET() {
  try {
    const supabase = createAdminSupabaseClient()!;
    const { data, error } = await supabase
      .from("barbers")
      .select("*, users(id,name)")
      .is("deleted_at", null)
      .order("created_at");

    if (error) throw error;

    return jsonResponse({ barbers: (data ?? []).map((row) => mapBarber(row)) });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    requireRole(await getCurrentUser(), ["admin"]);
    const parsed = createBarberSchema.parse(await request.json());

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminSupabaseClient() as any;

    // Create a placeholder user entry so barbers can be linked to auth later
    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert({ name: parsed.name, email: `staff-${Date.now()}@selor.local`, role: "barber" })
      .select("id, name")
      .single();

    if (userError) throw userError;

    const { data, error } = await supabase
      .from("barbers")
      .insert({ user_id: userData.id, is_active: true })
      .select("*, users(id,name)")
      .single();

    if (error) throw error;

    return jsonResponse({ barber: mapBarber(data) }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

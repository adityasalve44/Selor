import { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import { requireRole } from "@/lib/auth/guards";
import { handleRouteError, jsonResponse } from "@/lib/http/response";
import { mapBarber } from "@/lib/services/mappers";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { updateBarberSchema } from "@/lib/validators/barbers";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    requireRole(await getCurrentUser(), ["admin"]);
    const { id } = await params;
    const parsed = updateBarberSchema.parse(await request.json());

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminSupabaseClient() as any;

    // Update name via users table if provided
    if (parsed.name !== undefined) {
      const { data: barberRow, error: lookupErr } = await supabase
        .from("barbers")
        .select("user_id")
        .eq("id", id)
        .single();
      if (lookupErr) throw lookupErr;
      await supabase.from("users").update({ name: parsed.name }).eq("id", barberRow.user_id);
    }

    const updates: Record<string, unknown> = {};
    if (parsed.isActive !== undefined) updates.is_active = parsed.isActive;

    const { data, error } = await supabase
      .from("barbers")
      .update(Object.keys(updates).length > 0 ? updates : {})
      .eq("id", id)
      .is("deleted_at", null)
      .select("*, users(id,name)")
      .single();

    if (error) throw error;

    return jsonResponse({ barber: mapBarber(data) });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    requireRole(await getCurrentUser(), ["admin"]);
    const { id } = await params;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminSupabaseClient() as any;
    const { error } = await supabase
      .from("barbers")
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq("id", id);

    if (error) throw error;

    return jsonResponse({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}

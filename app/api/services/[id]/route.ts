import { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import { requireRole } from "@/lib/auth/guards";
import { handleRouteError, jsonResponse } from "@/lib/http/response";
import { mapService } from "@/lib/services/mappers";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { updateServiceSchema } from "@/lib/validators/services";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    requireRole(await getCurrentUser(), ["admin"]);
    const { id } = await params;
    const parsed = updateServiceSchema.parse(await request.json());

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminSupabaseClient() as any;

    const updates: Record<string, unknown> = {};
    if (parsed.name !== undefined) updates.name = parsed.name;
    if (parsed.durationMinutes !== undefined) updates.duration_minutes = parsed.durationMinutes;
    if (parsed.price !== undefined) updates.price = parsed.price;
    if (parsed.isActive !== undefined) updates.is_active = parsed.isActive;

    const { data, error } = await supabase
      .from("services")
      .update(updates)
      .eq("id", id)
      .is("deleted_at", null)
      .select("*")
      .single();

    if (error) throw error;

    return jsonResponse({ service: mapService(data) });
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
      .from("services")
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq("id", id);

    if (error) throw error;

    return jsonResponse({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}

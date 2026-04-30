/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAdminAllowlist } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { CurrentUser } from "@/types/domain";

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    console.error("[getCurrentUser] No auth user found:", authError);
    return null;
  }

  // Attempt to fetch the profile
  const { data: profileData, error: profileError } = await (supabase as any)
    .from("users")
    .select("id, email, role, name, deleted_at, barbers(id)")
    .eq("id", authUser.id)
    .is("deleted_at", null)
    .single();

  let profile = profileData;
  
  // Fallback: If profile is missing, auto-create it (handles failed triggers)
  if (profileError || !profile) {
    console.warn("[getCurrentUser] Profile missing for", authUser.email, ". Attempting auto-creation...");
    try {
      const { createAdminSupabaseClient } = await import("@/lib/supabase/admin");
      const adminSupabase = createAdminSupabaseClient();
      
      const { data: newProfile, error: createError } = await (adminSupabase as any)
        .from("users")
        .insert({
          id: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || "Customer",
          role: "customer"
        })
        .select("id, email, role, name, deleted_at, barbers(id)")
        .single();

      if (createError) throw createError;
      profile = newProfile;
      console.log("[getCurrentUser] Auto-created missing profile for", authUser.email);
    } catch (err) {
      console.error("[getCurrentUser] Critical: Could not fetch or create profile:", err);
      return null;
    }
  }

  const allowlist = getAdminAllowlist();
  const normalizedEmail = String(profile.email).toLowerCase();
  
  console.log("[getCurrentUser] Checking user:", normalizedEmail, "against allowlist:", allowlist);

  if (allowlist.includes(normalizedEmail) && profile.role !== "admin") {
    console.log("[getCurrentUser] User in allowlist! Elevating to admin...");
    try {
      const { createAdminSupabaseClient } = await import("@/lib/supabase/admin");
      const adminSupabase = createAdminSupabaseClient();
      await (adminSupabase as any).from("users").update({ role: "admin" }).eq("id", profile.id);
      profile.role = "admin";
      console.log("[getCurrentUser] Role elevated successfully.");
    } catch (err) {
      console.error("[getCurrentUser] Failed to elevate role:", err);
    }
  }

  const barberRecord = Array.isArray(profile.barbers)
    ? profile.barbers[0]
    : (profile.barbers as { id?: string } | null);

  return {
    id: profile.id,
    email: profile.email,
    role: profile.role,
    name: profile.name,
    barberId: barberRecord?.id ?? null,
  };
}

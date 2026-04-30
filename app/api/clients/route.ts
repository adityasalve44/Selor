import { handleRouteError, jsonResponse } from "@/lib/http/response";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { ClientDto } from "@/types/domain";

export async function GET() {
  try {
    const supabase = createAdminSupabaseClient()!;
    // Fetch users with their appointments
    const { data: users, error } = await supabase
      .from("users")
      .select("*, appointments(start_time, status)")
      .eq("role", "customer")
      .order("created_at", { ascending: false });

    if (error) throw error;

    interface RawAppointment {
      start_time: string;
      status: string;
    }

    interface RawUser {
      id: string;
      name: string | null;
      email: string;
      appointments: RawAppointment[];
    }

    const clients: ClientDto[] = ((users as unknown as RawUser[]) ?? []).map((user) => {
      // Calculate loyalty metrics based on appointments
      const completedVisits =
        user.appointments?.filter((a) => a.status === "completed") || [];
      const visitCount = completedVisits.length;

      let loyaltyTier: "PLATINUM" | "GOLD" | "SILVER" | "MEMBER" = "MEMBER";
      if (visitCount >= 20) loyaltyTier = "PLATINUM";
      else if (visitCount >= 10) loyaltyTier = "GOLD";
      else if (visitCount >= 5) loyaltyTier = "SILVER";

      // Find the most recent visit
      let lastVisit: string | null = null;
      if (user.appointments && user.appointments.length > 0) {
        // Sort appointments descending
        const sortedAppts = [...user.appointments].sort(
          (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
        );
        lastVisit = sortedAppts[0].start_time;
      }

      // Generate a mock loyalty ID since it's not in the DB currently
      const loyaltyId = `#Loyalty-${user.id.substring(0, 4).toUpperCase()}`;

      return {
        id: user.id,
        name: user.name || user.email.split("@")[0] || "Unknown Client",
        email: user.email,
        loyaltyId,
        loyaltyTier,
        lastVisit,
        visitCount,
      };
    });

    return jsonResponse({ data: clients });
  } catch (error) {
    return handleRouteError(error);
  }
}

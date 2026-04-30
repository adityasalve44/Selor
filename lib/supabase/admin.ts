import { createClient } from "@supabase/supabase-js";

import { assertServiceRoleEnv, env } from "@/lib/env";
import type { Database } from "@/types/database";

let adminClient:
  | ReturnType<typeof createClient<Database, "public">>
  | undefined;

export function createAdminSupabaseClient() {
  assertServiceRoleEnv();
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!adminClient) {
    adminClient = createClient<Database, "public">(
      env.NEXT_PUBLIC_SUPABASE_URL,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }

  return adminClient!;
}

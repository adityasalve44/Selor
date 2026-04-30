import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { assertSupabaseEnv, env } from "@/lib/env";
import type { Database } from "@/types/database";

export async function createServerSupabaseClient() {
  assertSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot always mutate cookies mid-render.
          }
        },
      },
    },
  );
}

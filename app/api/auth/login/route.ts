import { NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const next = request.nextUrl.searchParams.get("next") ?? "/";
  const supabase = await createServerSupabaseClient();
  const redirectTo = `${env.APP_BASE_URL ?? request.nextUrl.origin}/api/auth/callback?next=${encodeURIComponent(next)}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
    },
  });

  if (error || !data.url) {
    return NextResponse.json(
      {
        error: {
          code: "AUTH_REDIRECT_FAILED",
          message: error?.message ?? "Unable to start Google sign-in.",
        },
      },
      { status: 500 },
    );
  }

  return NextResponse.redirect(data.url);
}

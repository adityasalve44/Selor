import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = request.nextUrl.searchParams.get("next") ?? "/";
  const redirectUrl = new URL(next, request.nextUrl.origin);

  if (!code) {
    return NextResponse.redirect(redirectUrl);
  }

  const supabase = await createServerSupabaseClient();
  await supabase.auth.exchangeCodeForSession(code);

  return NextResponse.redirect(redirectUrl);
}

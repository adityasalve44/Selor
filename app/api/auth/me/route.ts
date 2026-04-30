import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function GET() {
  try {
    const user = await getCurrentUser();
    return NextResponse.json({ user });
  } catch (error) {
    console.error("[api/auth/me] Error:", error);
    return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 });
  }
}

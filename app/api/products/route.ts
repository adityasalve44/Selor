import { NextResponse } from "next/server";
import { getProducts, createProduct } from "@/lib/services/inventory";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { requireRole } from "@/lib/auth/guards";

export async function GET() {
  try {
    const products = await getProducts();
    return NextResponse.json(products);
  } catch {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    requireRole(await getCurrentUser(), ["admin"]);
    const body = await request.json();
    const product = await createProduct(body);
    return NextResponse.json(product);
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}

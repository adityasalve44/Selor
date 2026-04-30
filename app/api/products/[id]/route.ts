import { NextResponse } from "next/server";
import { updateProduct, deleteProduct } from "@/lib/services/inventory";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { requireRole } from "@/lib/auth/guards";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireRole(await getCurrentUser(), ["admin"]);

    const body = await request.json();
    const { id } = await params;
    const product = await updateProduct(id, body);
    return NextResponse.json(product);
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try { 
    requireRole(await getCurrentUser(), ["admin"]);

    const { id } = await params;
    await deleteProduct(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}

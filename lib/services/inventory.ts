import { createAdminSupabaseClient } from "../supabase/admin";
import type { ProductDto } from "@/types/domain";

export async function getProducts() {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .filter('deleted_at', 'is', null)
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw error;
  return data as ProductDto[];
}

export async function createProduct(product: Partial<ProductDto>) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from('products' as any)
    // @ts-expect-error - Supabase types missing products table
    .insert([product as any])
    .select()
    .single();

  if (error) throw error;
  return data as ProductDto;
}

export async function updateProduct(id: string, product: Partial<ProductDto>) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from('products' as any)
    // @ts-expect-error - Supabase types missing products table
    .update({ ...product, updated_at: new Date().toISOString() } as any)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as ProductDto;
}

export async function deleteProduct(id: string) {
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from('products' as any)
    // @ts-expect-error - Supabase types missing products table
    .update({ 
      deleted_at: new Date().toISOString(),
      is_active: false 
    } as any)
    .eq('id', id);

  if (error) throw error;
}

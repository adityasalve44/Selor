-- Migration: Create Products Table
-- Created at: 2026-04-25T21:00:00Z

-- 1. Create the products table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    category TEXT NOT NULL DEFAULT 'Other',
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    min_stock_level INTEGER NOT NULL DEFAULT 5,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 3. Policies
-- Public/Customer can view active products
CREATE POLICY "Public can view active products" ON public.products
    FOR SELECT USING (is_active = true);

-- Admin can do everything
CREATE POLICY "Admin full access on products" ON public.products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 4. Triggers for updated_at
CREATE TRIGGER set_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- 5. Helper function for stock check (optional but useful)
CREATE OR REPLACE FUNCTION check_low_stock()
RETURNS TABLE (product_name TEXT, current_stock INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT name, stock_quantity
    FROM public.products
    WHERE stock_quantity <= min_stock_level AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

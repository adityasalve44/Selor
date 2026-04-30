-- PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  stock_quantity integer NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  category text,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  deleted_at timestamptz
);

-- UPDATED_AT TRIGGER FOR PRODUCTS
DROP TRIGGER IF EXISTS products_updated_at ON public.products;
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- INDEXES
CREATE INDEX IF NOT EXISTS products_active_idx ON public.products (is_active) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS products_category_idx ON public.products (category) WHERE deleted_at IS NULL;

-- RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- POLICY: PUBLIC SELECT (Active and not deleted)
DROP POLICY IF EXISTS products_public_select ON public.products;
CREATE POLICY products_public_select
ON public.products
FOR SELECT
TO authenticated, anon
USING (is_active = true AND deleted_at IS NULL);

-- POLICY: ADMIN ALL
DROP POLICY IF EXISTS products_admin_all ON public.products;
CREATE POLICY products_admin_all
ON public.products
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

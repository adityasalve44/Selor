-- SUPPORT HELPERS
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
AS $$
  SELECT role
  FROM public.users
  WHERE id = auth.uid() AND deleted_at IS NULL
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT coalesce(public.current_user_role() = 'admin', FALSE)
$$;

-- RE-APPLY PRODUCTS POLICIES
DROP POLICY IF EXISTS products_admin_all ON public.products;
CREATE POLICY products_admin_all
ON public.products
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

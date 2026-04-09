DROP POLICY IF EXISTS "tenants_select_member" ON public.tenants;

CREATE POLICY "tenants_select_member_or_owned"
ON public.tenants
FOR SELECT
TO authenticated
USING (
  id = public.current_user_tenant_id()
  OR owner_user_id = auth.uid()
);

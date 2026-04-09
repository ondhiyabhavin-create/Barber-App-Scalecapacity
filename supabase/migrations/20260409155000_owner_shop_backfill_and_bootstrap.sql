UPDATE public.tenants t
SET owner_user_id = u.id
FROM public.users u
WHERE u.tenant_id = t.id
  AND u.role = 'owner'
  AND t.owner_user_id IS NULL;

CREATE OR REPLACE FUNCTION public.bootstrap_owner_shop(
  p_name text,
  p_slug text,
  p_business_type text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tid uuid;
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF EXISTS (SELECT 1 FROM public.users WHERE id = uid) THEN
    RAISE EXCEPTION 'Profile already exists';
  END IF;

  IF EXISTS (SELECT 1 FROM public.tenants WHERE slug = p_slug) THEN
    RAISE EXCEPTION 'Slug already taken';
  END IF;

  INSERT INTO public.tenants (name, slug, business_type, owner_user_id)
  VALUES (p_name, lower(trim(p_slug)), p_business_type, uid)
  RETURNING id INTO tid;

  INSERT INTO public.users (id, tenant_id, role, name, email)
  VALUES (
    uid,
    tid,
    'owner',
    COALESCE((SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = uid), ''),
    (SELECT email FROM auth.users WHERE id = uid)
  );

  INSERT INTO public.barbers (tenant_id, display_name, avatar_url)
  VALUES (
    tid,
    COALESCE(NULLIF(trim(COALESCE((SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = uid), '')), ''), 'Owner'),
    NULL
  );

  RETURN tid;
END;
$$;

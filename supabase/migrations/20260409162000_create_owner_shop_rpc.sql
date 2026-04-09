CREATE OR REPLACE FUNCTION public.create_owner_shop(
  p_name text,
  p_slug text,
  p_business_type text,
  p_icon_emoji text DEFAULT NULL,
  p_logo_url text DEFAULT NULL,
  p_address_line text DEFAULT NULL,
  p_country text DEFAULT NULL,
  p_region text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_postal_code text DEFAULT NULL,
  p_latitude double precision DEFAULT NULL,
  p_longitude double precision DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  owner_tenant_id uuid;
  new_tenant_id uuid;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT tenant_id INTO owner_tenant_id
  FROM public.users
  WHERE id = uid AND role = 'owner'
  LIMIT 1;

  IF owner_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Only owners can create shops';
  END IF;

  IF EXISTS (SELECT 1 FROM public.tenants WHERE slug = lower(trim(p_slug))) THEN
    RAISE EXCEPTION 'Slug already taken';
  END IF;

  INSERT INTO public.tenants (
    name,
    slug,
    business_type,
    icon_emoji,
    logo_url,
    address_line,
    country,
    region,
    city,
    postal_code,
    latitude,
    longitude,
    owner_user_id,
    is_active
  )
  VALUES (
    trim(p_name),
    lower(trim(p_slug)),
    COALESCE(NULLIF(trim(p_business_type), ''), 'barbershop'),
    NULLIF(trim(COALESCE(p_icon_emoji, '')), ''),
    NULLIF(trim(COALESCE(p_logo_url, '')), ''),
    NULLIF(trim(COALESCE(p_address_line, '')), ''),
    NULLIF(trim(COALESCE(p_country, '')), ''),
    NULLIF(trim(COALESCE(p_region, '')), ''),
    NULLIF(trim(COALESCE(p_city, '')), ''),
    NULLIF(trim(COALESCE(p_postal_code, '')), ''),
    p_latitude,
    p_longitude,
    uid,
    true
  )
  RETURNING id INTO new_tenant_id;

  RETURN new_tenant_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_owner_shop(
  text, text, text, text, text, text, text, text, text, text, double precision, double precision
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_owner_shop(
  text, text, text, text, text, text, text, text, text, text, double precision, double precision
) TO authenticated;

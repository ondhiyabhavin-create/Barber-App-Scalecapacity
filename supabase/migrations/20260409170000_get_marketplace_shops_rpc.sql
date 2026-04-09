CREATE OR REPLACE FUNCTION public.get_marketplace_shops()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', t.id,
        'name', t.name,
        'slug', t.slug,
        'city', t.city,
        'region', t.region,
        'country', t.country,
        'logo_url', t.logo_url,
        'icon_emoji', t.icon_emoji,
        'latitude', t.latitude,
        'longitude', t.longitude
      )
      ORDER BY t.created_at DESC
    ),
    '[]'::jsonb
  )
  FROM public.tenants t
  WHERE COALESCE(t.is_active, true) = true
    AND t.archived_at IS NULL;
$$;

REVOKE ALL ON FUNCTION public.get_marketplace_shops() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_marketplace_shops() TO anon, authenticated;

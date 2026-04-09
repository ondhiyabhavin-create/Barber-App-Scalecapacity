ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS icon_emoji text,
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision,
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS archived_at timestamptz,
ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS icon_emoji text;

CREATE INDEX IF NOT EXISTS tenants_country_region_city_idx
  ON public.tenants (country, region, city);

CREATE INDEX IF NOT EXISTS tenants_lat_lon_idx
  ON public.tenants (latitude, longitude);

CREATE INDEX IF NOT EXISTS tenants_owner_user_id_idx
  ON public.tenants (owner_user_id);

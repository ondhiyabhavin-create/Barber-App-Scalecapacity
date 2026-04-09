-- =============================================================================
-- BarberOS — ONE FILE: full schema (tables, RLS helpers, policies, RPCs, storage)
-- Run in Supabase → SQL Editor (select all → Run).
--
-- • New project: run the whole file.
-- • Already have tables: CREATE TABLE IF NOT EXISTS will skip tables; policies/functions
--   are recreated (DROP POLICY IF EXISTS + CREATE OR REPLACE).
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  business_type text NOT NULL DEFAULT 'barbershop',
  address_line text,
  city text,
  region text,
  postal_code text,
  country text DEFAULT 'US',
  logo_url text,
  plan text NOT NULL DEFAULT 'free',
  stripe_account_id text,
  onboarding_completed boolean NOT NULL DEFAULT false,
  bookings_this_month integer NOT NULL DEFAULT 0,
  timezone text NOT NULL DEFAULT 'America/New_York',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES public.tenants (id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'staff', 'client')),
  name text,
  email text,
  phone text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS users_tenant_id_idx ON public.users (tenant_id);

CREATE TABLE IF NOT EXISTS public.barbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
  display_name text NOT NULL,
  bio text,
  specialties text[] NOT NULL DEFAULT '{}',
  commission_rate numeric(5, 2) NOT NULL DEFAULT 0,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS barbers_tenant_id_idx ON public.barbers (tenant_id);

CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  name text NOT NULL,
  duration_min integer NOT NULL CHECK (duration_min > 0),
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  category text,
  image_url text,
  deposit_required boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS services_tenant_id_idx ON public.services (tenant_id);

CREATE TABLE IF NOT EXISTS public.working_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id uuid NOT NULL REFERENCES public.barbers (id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  UNIQUE (barber_id, day_of_week)
);

CREATE INDEX IF NOT EXISTS working_hours_barber_id_idx ON public.working_hours (barber_id);

CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  avatar_url text,
  haircut_notes text,
  tags text[] NOT NULL DEFAULT '{}',
  lifetime_value numeric(12, 2) NOT NULL DEFAULT 0,
  last_visit_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS clients_tenant_id_idx ON public.clients (tenant_id);
CREATE INDEX IF NOT EXISTS clients_email_idx ON public.clients (tenant_id, email);

CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients (id) ON DELETE CASCADE,
  barber_id uuid NOT NULL REFERENCES public.barbers (id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services (id) ON DELETE RESTRICT,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  notes text,
  deposit_paid boolean NOT NULL DEFAULT false,
  reference_photo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT appointments_time_order CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS appointments_tenant_start_idx ON public.appointments (tenant_id, start_time);
CREATE INDEX IF NOT EXISTS appointments_barber_start_idx ON public.appointments (barber_id, start_time);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  type text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications (user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS helpers (avoid infinite recursion on public.users policies)
CREATE OR REPLACE FUNCTION public.current_user_tenant_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT tenant_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_owner_tenant_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT tenant_id FROM public.users WHERE id = auth.uid() AND role = 'owner' LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.current_user_tenant_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_user_owner_tenant_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_owner_tenant_id() TO authenticated;

DROP POLICY IF EXISTS "tenants_select_member" ON public.tenants;
DROP POLICY IF EXISTS "tenants_update_owner" ON public.tenants;
DROP POLICY IF EXISTS "users_select_same_tenant" ON public.users;
DROP POLICY IF EXISTS "users_update_self" ON public.users;
DROP POLICY IF EXISTS "users_insert_self" ON public.users;
DROP POLICY IF EXISTS "barbers_all_tenant" ON public.barbers;
DROP POLICY IF EXISTS "services_all_tenant" ON public.services;
DROP POLICY IF EXISTS "working_hours_all_tenant" ON public.working_hours;
DROP POLICY IF EXISTS "clients_all_tenant" ON public.clients;
DROP POLICY IF EXISTS "appointments_all_tenant" ON public.appointments;
DROP POLICY IF EXISTS "notifications_own" ON public.notifications;

CREATE POLICY "tenants_select_member" ON public.tenants
  FOR SELECT TO authenticated
  USING (id = public.current_user_tenant_id());

CREATE POLICY "tenants_update_owner" ON public.tenants
  FOR UPDATE TO authenticated
  USING (id = public.current_user_owner_tenant_id());

CREATE POLICY "users_select_same_tenant" ON public.users
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR tenant_id = public.current_user_tenant_id()
  );

CREATE POLICY "users_update_self" ON public.users
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

CREATE POLICY "users_insert_self" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "barbers_all_tenant" ON public.barbers
  FOR ALL TO authenticated
  USING (tenant_id = public.current_user_tenant_id())
  WITH CHECK (tenant_id = public.current_user_tenant_id());

CREATE POLICY "services_all_tenant" ON public.services
  FOR ALL TO authenticated
  USING (tenant_id = public.current_user_tenant_id())
  WITH CHECK (tenant_id = public.current_user_tenant_id());

CREATE POLICY "working_hours_all_tenant" ON public.working_hours
  FOR ALL TO authenticated
  USING (
    barber_id IN (
      SELECT b.id FROM public.barbers b
      WHERE b.tenant_id = public.current_user_tenant_id()
    )
  )
  WITH CHECK (
    barber_id IN (
      SELECT b.id FROM public.barbers b
      WHERE b.tenant_id = public.current_user_tenant_id()
    )
  );

CREATE POLICY "clients_all_tenant" ON public.clients
  FOR ALL TO authenticated
  USING (tenant_id = public.current_user_tenant_id())
  WITH CHECK (tenant_id = public.current_user_tenant_id());

CREATE POLICY "appointments_all_tenant" ON public.appointments
  FOR ALL TO authenticated
  USING (tenant_id = public.current_user_tenant_id())
  WITH CHECK (tenant_id = public.current_user_tenant_id());

CREATE POLICY "notifications_own" ON public.notifications
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- RPCs: public booking + owner bootstrap
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_public_shop(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  t public.tenants%ROWTYPE;
  result jsonb;
BEGIN
  SELECT * INTO t FROM public.tenants WHERE slug = p_slug LIMIT 1;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'tenant', row_to_json(t)::jsonb,
    'services', COALESCE((
      SELECT jsonb_agg(row_to_json(s)::jsonb)
      FROM public.services s WHERE s.tenant_id = t.id
    ), '[]'::jsonb),
    'barbers', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'barber', row_to_json(b)::jsonb,
          'working_hours', COALESCE((
            SELECT jsonb_agg(row_to_json(wh)::jsonb)
            FROM public.working_hours wh WHERE wh.barber_id = b.id
          ), '[]'::jsonb)
        )
      )
      FROM public.barbers b WHERE b.tenant_id = t.id
    ), '[]'::jsonb)
  ) INTO result;

  RETURN result;
END;
$$;

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

  INSERT INTO public.tenants (name, slug, business_type)
  VALUES (p_name, lower(trim(p_slug)), p_business_type)
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

REVOKE ALL ON FUNCTION public.bootstrap_owner_shop(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bootstrap_owner_shop(text, text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.get_public_shop(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_shop(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_public_booking(
  p_slug text,
  p_barber_id uuid,
  p_service_id uuid,
  p_start timestamptz,
  p_client_name text,
  p_client_email text,
  p_client_phone text,
  p_reference_photo_url text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  t public.tenants%ROWTYPE;
  srv public.services%ROWTYPE;
  br public.barbers%ROWTYPE;
  overlap_count integer;
  new_client_id uuid;
  new_appt_id uuid;
  end_ts timestamptz;
BEGIN
  SELECT * INTO t FROM public.tenants WHERE slug = p_slug LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Shop not found';
  END IF;

  SELECT * INTO srv FROM public.services WHERE id = p_service_id AND tenant_id = t.id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid service';
  END IF;

  SELECT * INTO br FROM public.barbers WHERE id = p_barber_id AND tenant_id = t.id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid barber';
  END IF;

  end_ts := p_start + (srv.duration_min || ' minutes')::interval;

  SELECT COUNT(*) INTO overlap_count
  FROM public.appointments a
  WHERE a.barber_id = p_barber_id
    AND a.status NOT IN ('cancelled')
    AND a.start_time < end_ts
    AND a.end_time > p_start;

  IF overlap_count > 0 THEN
    RAISE EXCEPTION 'Time slot unavailable';
  END IF;

  IF trim(COALESCE(p_client_email, '')) <> '' THEN
    SELECT id INTO new_client_id
    FROM public.clients
    WHERE tenant_id = t.id AND lower(email) = lower(trim(p_client_email))
    LIMIT 1;
  END IF;

  IF new_client_id IS NULL THEN
    INSERT INTO public.clients (tenant_id, name, email, phone)
    VALUES (t.id, p_client_name, NULLIF(trim(p_client_email), ''), NULLIF(trim(p_client_phone), ''))
    RETURNING id INTO new_client_id;
  ELSE
    UPDATE public.clients
    SET name = p_client_name,
        phone = COALESCE(NULLIF(trim(p_client_phone), ''), phone)
    WHERE id = new_client_id;
  END IF;

  INSERT INTO public.appointments (
    tenant_id, client_id, barber_id, service_id, start_time, end_time, status, reference_photo_url
  ) VALUES (
    t.id, new_client_id, p_barber_id, p_service_id, p_start, end_ts, 'confirmed', p_reference_photo_url
  )
  RETURNING id INTO new_appt_id;

  RETURN jsonb_build_object('appointment_id', new_appt_id, 'client_id', new_client_id);
END;
$$;

REVOKE ALL ON FUNCTION public.create_public_booking(text, uuid, uuid, timestamptz, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_public_booking(text, uuid, uuid, timestamptz, text, text, text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_public_busy_ranges(
  p_barber_id uuid,
  p_range_start timestamptz,
  p_range_end timestamptz
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT jsonb_agg(jsonb_build_object('start', start_time, 'end', end_time))
      FROM public.appointments
      WHERE barber_id = p_barber_id
        AND status NOT IN ('cancelled')
        AND start_time < p_range_end
        AND end_time > p_range_start
    ),
    '[]'::jsonb
  );
$$;

REVOKE ALL ON FUNCTION public.get_public_busy_ranges(uuid, timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_busy_ranges(uuid, timestamptz, timestamptz) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage: shop logos / assets
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES ('shop-assets', 'shop-assets', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Shop assets public read" ON storage.objects;
DROP POLICY IF EXISTS "Shop assets upload authenticated" ON storage.objects;
DROP POLICY IF EXISTS "Shop assets update own" ON storage.objects;
DROP POLICY IF EXISTS "Shop assets delete own" ON storage.objects;

CREATE POLICY "Shop assets public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'shop-assets');

CREATE POLICY "Shop assets upload authenticated"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'shop-assets');

CREATE POLICY "Shop assets update own"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'shop-assets');

CREATE POLICY "Shop assets delete own"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'shop-assets');

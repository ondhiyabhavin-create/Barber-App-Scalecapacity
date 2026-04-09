-- Public availability for booking UI (no broad anon SELECT on appointments)
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
      FROM appointments
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

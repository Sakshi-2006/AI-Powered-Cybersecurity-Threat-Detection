/*
# Create increment_stat RPC function

1. New Functions
- `increment_stat` — Atomically increments a detection_stats row by a given value. Useful for updating counters from the frontend without race conditions.

2. Security
- SECURITY INVOKER (default) — callable by anon and authenticated roles since the app is single-tenant with public data.
*/

CREATE OR REPLACE FUNCTION increment_stat(stat_key_name text, increment_value numeric)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE detection_stats
  SET stat_value = stat_value + increment_value,
      updated_at = now()
  WHERE stat_key = stat_key_name;
END;
$$;

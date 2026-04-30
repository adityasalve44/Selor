-- =============================================================================
-- Selor Seed Data
-- Populates: shop_settings, services
-- Note: barbers require auth.users entries (created via Supabase Auth),
--       so barber seed is provided as a commented example.
-- =============================================================================

-- ── Shop Settings ─────────────────────────────────────────────────────────────
INSERT INTO public.shop_settings (
  id,
  shop_name,
  timezone,
  weekly_hours,
  default_buffer_before_minutes,
  default_buffer_after_minutes,
  slot_interval_minutes,
  reminder_lead_minutes,
  invite_base_url
) VALUES (
  1,
  'Selor Barber Studio',
  'Asia/Kolkata',
  '{
    "mon": {"open": "09:00", "close": "20:00", "enabled": true},
    "tue": {"open": "09:00", "close": "20:00", "enabled": true},
    "wed": {"open": "09:00", "close": "20:00", "enabled": true},
    "thu": {"open": "09:00", "close": "20:00", "enabled": true},
    "fri": {"open": "09:00", "close": "21:00", "enabled": true},
    "sat": {"open": "08:00", "close": "21:00", "enabled": true},
    "sun": {"open": "10:00", "close": "18:00", "enabled": true}
  }'::jsonb,
  5,
  5,
  15,
  ARRAY[120, 30],
  'https://selor.app/invite'
)
ON CONFLICT (id) DO UPDATE SET
  shop_name            = EXCLUDED.shop_name,
  timezone             = EXCLUDED.timezone,
  weekly_hours         = EXCLUDED.weekly_hours,
  slot_interval_minutes= EXCLUDED.slot_interval_minutes,
  invite_base_url      = EXCLUDED.invite_base_url;

-- ── Services ──────────────────────────────────────────────────────────────────
INSERT INTO public.services (id, name, duration_minutes, price, is_active) VALUES
  ('11111111-1111-1111-1111-111111111101', 'The Signature Cut',             45,  55.00, true),
  ('11111111-1111-1111-1111-111111111102', 'Buzz & Fade',                   30,  35.00, true),
  ('11111111-1111-1111-1111-111111111103', 'Kids Cut',                      20,  25.00, true),
  ('11111111-1111-1111-1111-111111111104', 'Traditional Straight Razor Shave', 40, 45.00, true),
  ('11111111-1111-1111-1111-111111111105', 'Beard Sculpting',               25,  30.00, true),
  ('11111111-1111-1111-1111-111111111106', 'Beard Trim & Line-up',          15,  18.00, true),
  ('11111111-1111-1111-1111-111111111107', 'Aura Facial',                   30,  40.00, true),
  ('11111111-1111-1111-1111-111111111108', 'Scalp Therapy Massage',         20,  25.00, true),
  ('11111111-1111-1111-1111-111111111109', 'Grey Blending',                 45,  50.00, true),
  ('11111111-1111-1111-1111-111111111110', 'The Royal Sculpt (Full Package)',75,  85.00, true)
ON CONFLICT (id) DO UPDATE SET
  name             = EXCLUDED.name,
  duration_minutes = EXCLUDED.duration_minutes,
  price            = EXCLUDED.price,
  is_active        = EXCLUDED.is_active;

-- ── Barber Seed Instructions ──────────────────────────────────────────────────
-- Barbers must first sign in via Google OAuth to create their auth.users row.
-- After sign-in, use the admin panel to promote them to the 'barber' role, or
-- run the following manually after replacing the UUID with the real user ID:
--
-- INSERT INTO public.barbers (user_id, is_active)
-- VALUES ('<user-uuid-from-auth.users>', true)
-- ON CONFLICT (user_id) DO NOTHING;
--
-- UPDATE public.users SET role = 'barber', name = 'Marcus Thorne'
-- WHERE id = '<user-uuid-from-auth.users>';

-- ============================================================
-- MK e BALÃO Barbearia — Seed Data
-- Execute após o schema.sql no SQL Editor do Supabase
-- ============================================================

-- ── SERVIÇOS ─────────────────────────────────────────────────
INSERT INTO services (name, category, duration_minutes, price, active, sort_order) VALUES
  ('Fade',             'Cabelo',       30, 45.00, true, 1),
  ('Tesoura',          'Cabelo',       40, 50.00, true, 2),
  ('Social',           'Cabelo',       25, 40.00, true, 3),
  ('Pezinho',          'Cabelo',       15, 20.00, true, 4),
  ('Barba',            'Barba',        25, 35.00, true, 5),
  ('Combo (Fade + Barba)', 'Combo',    50, 70.00, true, 6),
  ('Sobrancelha',      'Adicional',    10, 15.00, true, 7),
  ('Limpeza de Pele',  'Adicional',    20, 25.00, true, 8),
  ('Colorimetria',     'Colorimetria', 90, 80.00, true, 9);

-- ── BARBEIROS ────────────────────────────────────────────────
-- user_id será preenchido após criar os usuários no Supabase Auth
INSERT INTO barbers (name, slug, role, phone, interval_minutes, active, sort_order) VALUES
  ('Maikon (MK)',    'maikon',  'barber', '5514998989521', 40, true, 1),
  ('Gabriel',        'gabriel', 'barber', '5514998918483', 50, true, 2),
  ('Daniel Balão',   'daniel',  'barber', '5514996598304', 60, true, 3);

-- Admin geral (será linkado ao user_id após criar o usuário)
INSERT INTO barbers (name, slug, role, phone, interval_minutes, active, sort_order) VALUES
  ('Admin',          'admin',   'admin',  '5514996373527', 50, false, 99);

-- ── BARBER_SERVICES (todos oferecem todos os serviços base) ──
INSERT INTO barber_services (barber_id, service_id)
SELECT b.id, s.id FROM barbers b, services s
WHERE b.slug IN ('maikon', 'gabriel', 'daniel')
  AND s.active = true;

-- ── AVAILABILITY (9h–20h, Seg–Sáb, sem Domingo) ──────────────
INSERT INTO availability (barber_id, day_of_week, start_time, end_time, active)
SELECT b.id, d.day, '09:00'::time, '20:00'::time, true
FROM barbers b
CROSS JOIN (VALUES (1),(2),(3),(4),(5),(6)) AS d(day)
WHERE b.slug IN ('maikon', 'gabriel', 'daniel');

-- ── SETTINGS ─────────────────────────────────────────────────
UPDATE settings SET
  name      = 'MK e BALÃO Barbearia',
  tagline   = 'Seu estilo, no seu tempo.',
  whatsapp  = '5514998989521',
  city      = 'Piraju — SP',
  instagram = ''
WHERE id = 1;

-- ============================================================
-- MK e BALÃO Barbearia — Schema PostgreSQL (Supabase)
-- Execute no SQL Editor do Supabase
-- Versão: 2.0 — Outubro 2026
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── TABELA: barbers ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS barbers (
  id               uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid          REFERENCES auth.users(id) ON DELETE SET NULL,
  name             text          NOT NULL,
  slug             text          UNIQUE NOT NULL,
  role             text          DEFAULT 'barber' NOT NULL,
  phone            text,
  avatar_url       text,
  bio              text,
  quote            text,
  speciality       text,
  interval_minutes int           DEFAULT 50 NOT NULL,
  active           boolean       DEFAULT true NOT NULL,
  sort_order       int           DEFAULT 0 NOT NULL,
  CONSTRAINT barbers_role_check CHECK (role IN ('barber', 'admin'))
);

-- ── TABELA: services ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS services (
  id               uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  name             text          NOT NULL,
  slug             text          UNIQUE NOT NULL,
  category         text          NOT NULL,
  description      text,
  duration_minutes int           NOT NULL CHECK (duration_minutes > 0),
  price            numeric(10,2) NOT NULL CHECK (price >= 0),
  price_type       text          DEFAULT 'fixed' NOT NULL,   -- 'fixed' | 'from'
  is_addon         boolean       DEFAULT false NOT NULL,
  active           boolean       DEFAULT true NOT NULL,
  sort_order       int           DEFAULT 0 NOT NULL,
  CONSTRAINT services_category_check CHECK (
    category IN ('cabelo', 'barba', 'combo', 'colorimetria', 'adicional')
  ),
  CONSTRAINT services_price_type_check CHECK (
    price_type IN ('fixed', 'from')
  )
);

-- ── TABELA: barber_services ──────────────────────────────────
CREATE TABLE IF NOT EXISTS barber_services (
  barber_id  uuid REFERENCES barbers(id)  ON DELETE CASCADE,
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (barber_id, service_id)
);

-- ── TABELA: availability ─────────────────────────────────────
-- day_of_week: 0=Domingo, 1=Segunda, ..., 6=Sábado
CREATE TABLE IF NOT EXISTS availability (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  barber_id    uuid REFERENCES barbers(id) ON DELETE CASCADE,
  day_of_week  int  NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time   time NOT NULL DEFAULT '09:00',
  end_time     time NOT NULL DEFAULT '19:00',
  active       boolean DEFAULT true NOT NULL,
  UNIQUE (barber_id, day_of_week)
);

-- ── TABELA: blocked_dates ────────────────────────────────────
-- barber_id NULL = bloqueia todos os barbeiros
CREATE TABLE IF NOT EXISTS blocked_dates (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  barber_id  uuid REFERENCES barbers(id) ON DELETE CASCADE,
  date       date NOT NULL,
  reason     text
);

-- ── TABELA: bookings ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id             uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at     timestamptz   DEFAULT now() NOT NULL,
  client_name    text          NOT NULL,
  client_phone   text          NOT NULL,
  barber_id      uuid          REFERENCES barbers(id),
  services       jsonb         NOT NULL DEFAULT '[]',
  date           date          NOT NULL,
  time           time          NOT NULL,
  total_minutes  int           NOT NULL CHECK (total_minutes > 0),
  total          numeric(10,2) NOT NULL CHECK (total >= 0),
  status         text          DEFAULT 'pendente' NOT NULL,
  cancel_token   uuid          DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  notes          text,
  UNIQUE (barber_id, date, time),
  CONSTRAINT bookings_status_check CHECK (
    status IN ('pendente', 'confirmado', 'concluido', 'cancelado')
  )
);

-- ── TABELA: settings ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  id        int  PRIMARY KEY DEFAULT 1,
  name      text NOT NULL DEFAULT 'MK e BALÃO Barbearia',
  tagline   text DEFAULT 'O Ritual do Homem Moderno.',
  whatsapp  text DEFAULT '5514998989521',
  address   text DEFAULT 'Praça Ataliba Leonel, 200 – Centro, Piraju - SP',
  city      text DEFAULT 'Piraju — SP',
  hours_weekday text DEFAULT '09:00 – 19:00',
  hours_saturday text DEFAULT '09:00 – 20:00',
  logo_url  text DEFAULT '',
  instagram text DEFAULT 'https://www.instagram.com/barbeariamkebalao/',
  maps_url  text DEFAULT 'https://maps.google.com/?q=Praça+Ataliba+Leonel,+200+-+Centro,+Piraju',
  CONSTRAINT settings_singleton CHECK (id = 1)
);

INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ── TABELA: plans ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plans (
  id           uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  name         text          NOT NULL,
  slug         text          UNIQUE NOT NULL,
  tagline      text,
  features     jsonb         DEFAULT '[]' NOT NULL,
  highlight    boolean       DEFAULT false NOT NULL,
  cta_text     text,
  cta_phone    text,
  cta_message  text,
  active       boolean       DEFAULT true NOT NULL,
  sort_order   int           DEFAULT 0 NOT NULL
);

-- ── STORAGE ──────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
  VALUES ('barber-images', 'barber-images', true)
  ON CONFLICT (id) DO NOTHING;

-- ── RLS: barbers ─────────────────────────────────────────────
ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "barbers_public_read"  ON barbers;
DROP POLICY IF EXISTS "barbers_admin_write"  ON barbers;
DROP POLICY IF EXISTS "barber_self_update"   ON barbers;

CREATE POLICY "barbers_public_read" ON barbers FOR SELECT USING (true);
CREATE POLICY "barber_self_update"  ON barbers FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "barbers_admin_write" ON barbers FOR ALL
  USING (EXISTS (SELECT 1 FROM barbers b WHERE b.user_id = auth.uid() AND b.role = 'admin'));

-- ── RLS: services ────────────────────────────────────────────
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "services_public_read" ON services;
DROP POLICY IF EXISTS "services_admin_write" ON services;

CREATE POLICY "services_public_read" ON services FOR SELECT USING (active = true);
CREATE POLICY "services_admin_write" ON services FOR ALL
  USING (auth.role() = 'authenticated');

-- ── RLS: barber_services ─────────────────────────────────────
ALTER TABLE barber_services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bs_public_read"  ON barber_services;
DROP POLICY IF EXISTS "bs_admin_write"  ON barber_services;

CREATE POLICY "bs_public_read"  ON barber_services FOR SELECT USING (true);
CREATE POLICY "bs_admin_write"  ON barber_services FOR ALL
  USING (auth.role() = 'authenticated');

-- ── RLS: availability ────────────────────────────────────────
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "avail_public_read"   ON availability;
DROP POLICY IF EXISTS "avail_barber_write"  ON availability;

CREATE POLICY "avail_public_read"  ON availability FOR SELECT USING (true);
CREATE POLICY "avail_barber_write" ON availability FOR ALL
  USING (EXISTS (SELECT 1 FROM barbers b WHERE b.id = barber_id AND b.user_id = auth.uid()));

-- ── RLS: blocked_dates ───────────────────────────────────────
ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "blocked_public_read"  ON blocked_dates;
DROP POLICY IF EXISTS "blocked_barber_write" ON blocked_dates;

CREATE POLICY "blocked_public_read"  ON blocked_dates FOR SELECT USING (true);
CREATE POLICY "blocked_barber_write" ON blocked_dates FOR ALL
  USING (auth.role() = 'authenticated');

-- ── RLS: bookings ────────────────────────────────────────────
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bookings_public_insert"  ON bookings;
DROP POLICY IF EXISTS "bookings_public_cancel"  ON bookings;
DROP POLICY IF EXISTS "bookings_barber_read"    ON bookings;
DROP POLICY IF EXISTS "bookings_barber_update"  ON bookings;
DROP POLICY IF EXISTS "bookings_admin_all"      ON bookings;

-- Público: criar agendamento sem autenticação
CREATE POLICY "bookings_public_insert" ON bookings
  FOR INSERT WITH CHECK (true);

-- Público: cancelar pelo token (só muda status para cancelado)
CREATE POLICY "bookings_public_cancel" ON bookings
  FOR UPDATE USING (cancel_token IS NOT NULL)
  WITH CHECK (status = 'cancelado');

-- Barbeiro autenticado: ver seus agendamentos (admin vê todos)
CREATE POLICY "bookings_barber_read" ON bookings
  FOR SELECT USING (
    barber_id IN (SELECT id FROM barbers WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM barbers b WHERE b.user_id = auth.uid() AND b.role = 'admin')
  );

-- Barbeiro autenticado: avançar status dos seus agendamentos
CREATE POLICY "bookings_barber_update" ON bookings
  FOR UPDATE USING (
    barber_id IN (SELECT id FROM barbers WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM barbers b WHERE b.user_id = auth.uid() AND b.role = 'admin')
  );

-- ── RLS: plans ──────────────────────────────────────────────
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "plans_public_read" ON plans;
DROP POLICY IF EXISTS "plans_admin_write" ON plans;

CREATE POLICY "plans_public_read" ON plans FOR SELECT USING (active = true);
CREATE POLICY "plans_admin_write" ON plans FOR ALL
  USING (auth.role() = 'authenticated');

-- ── RLS: settings ────────────────────────────────────────────
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "settings_public_read"  ON settings;
DROP POLICY IF EXISTS "settings_admin_write"  ON settings;

CREATE POLICY "settings_public_read"  ON settings FOR SELECT USING (true);
CREATE POLICY "settings_admin_write"  ON settings FOR ALL
  USING (auth.role() = 'authenticated');

-- ── RLS: storage.objects ─────────────────────────────────────
DROP POLICY IF EXISTS "barber_img_public"  ON storage.objects;
DROP POLICY IF EXISTS "barber_img_upload"  ON storage.objects;
DROP POLICY IF EXISTS "barber_img_delete"  ON storage.objects;

CREATE POLICY "barber_img_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'barber-images');
CREATE POLICY "barber_img_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'barber-images' AND auth.role() = 'authenticated');
CREATE POLICY "barber_img_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'barber-images' AND auth.role() = 'authenticated');

-- ── ÍNDICES ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_bookings_barber_date  ON bookings (barber_id, date);
CREATE INDEX IF NOT EXISTS idx_bookings_date_status  ON bookings (date, status);
CREATE INDEX IF NOT EXISTS idx_bookings_status       ON bookings (status);
CREATE INDEX IF NOT EXISTS idx_bookings_cancel_token ON bookings (cancel_token);
CREATE INDEX IF NOT EXISTS idx_availability_barber   ON availability (barber_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_blocked_barber_date   ON blocked_dates (barber_id, date);
CREATE INDEX IF NOT EXISTS idx_services_category     ON services (category, active);

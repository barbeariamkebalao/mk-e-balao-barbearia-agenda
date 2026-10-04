-- ============================================================
-- MK e BALÃO Barbearia — Schema v4.0
-- Supabase Dashboard → SQL Editor → Execute
-- Outubro 2026
--
-- ARQUIVO ESPELHO de /schema.sql (raiz do projeto)
-- Em caso de dúvida, a raiz é a fonte da verdade.
--
-- Execute APENAS em banco novo.
-- Para banco existente sem DROP: use docs/migration-rls-v4.sql
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────────
-- TABELAS
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE barbers (
  id               uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid          REFERENCES auth.users(id) ON DELETE SET NULL,
  name             text          NOT NULL,
  slug             text          UNIQUE NOT NULL,
  role             text          NOT NULL DEFAULT 'barber' CHECK (role IN ('barber','admin')),
  phone            text,
  avatar_url       text,
  bio              text,
  quote            text,
  speciality       text,
  interval_minutes int           NOT NULL DEFAULT 50,
  active           boolean       NOT NULL DEFAULT true,
  sort_order       int           NOT NULL DEFAULT 0
);

CREATE TABLE services (
  id               uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  name             text          NOT NULL,
  slug             text          UNIQUE NOT NULL,
  category         text          NOT NULL CHECK (category IN ('cabelo','barba','combo','colorimetria','adicional')),
  description      text,
  badge            text,
  duration_minutes int           NOT NULL CHECK (duration_minutes > 0),
  price            numeric(10,2) NOT NULL CHECK (price >= 0),
  price_type       text          NOT NULL DEFAULT 'fixed' CHECK (price_type IN ('fixed','from')),
  is_addon         boolean       NOT NULL DEFAULT false,
  active           boolean       NOT NULL DEFAULT true,
  sort_order       int           NOT NULL DEFAULT 0
);

CREATE TABLE barber_services (
  barber_id  uuid NOT NULL REFERENCES barbers(id)  ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (barber_id, service_id)
);

CREATE TABLE availability (
  id          uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  barber_id   uuid    NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  day_of_week int     NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time  time    NOT NULL DEFAULT '09:00',
  end_time    time    NOT NULL DEFAULT '19:00',
  active      boolean NOT NULL DEFAULT true,
  UNIQUE (barber_id, day_of_week)
);

CREATE TABLE blocked_dates (
  id        uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  barber_id uuid REFERENCES barbers(id) ON DELETE CASCADE, -- NULL = bloqueio geral da loja
  date      date NOT NULL,
  reason    text
);

CREATE TABLE bookings (
  id            uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at    timestamptz   NOT NULL DEFAULT now(),
  client_name   text          NOT NULL,
  client_phone  text          NOT NULL,
  barber_id     uuid          REFERENCES barbers(id),
  services      jsonb         NOT NULL DEFAULT '[]',
  date          date          NOT NULL,
  time          time          NOT NULL,
  total_minutes int           NOT NULL CHECK (total_minutes > 0),
  total         numeric(10,2) NOT NULL CHECK (total >= 0),
  status        text          NOT NULL DEFAULT 'pendente'
                              CHECK (status IN ('pendente','confirmado','concluido','cancelado')),
  cancel_token  uuid          NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  notes         text,
  UNIQUE (barber_id, date, time)
);

CREATE TABLE settings (
  id               int   PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name             text  NOT NULL DEFAULT 'MK e BALÃO Barbearia',
  tagline          text  DEFAULT 'O Ritual do Homem Moderno.',
  whatsapp         text  DEFAULT '5514998989521',
  address          text  DEFAULT 'Praça Ataliba Leonel, 200 – Centro, Piraju - SP',
  city             text  DEFAULT 'Piraju — SP',
  hours_weekday    text  DEFAULT '09:00 – 19:00',
  hours_saturday   text  DEFAULT '09:00 – 20:00',
  logo_url         text  DEFAULT '',
  instagram        text  DEFAULT 'https://www.instagram.com/barbeariamkebalao/',
  maps_url         text  DEFAULT 'https://maps.google.com/?q=Praça+Ataliba+Leonel,+200+-+Centro,+Piraju',
  credentials_json jsonb DEFAULT '[]'  -- acesso restrito a autenticados via RLS
);

CREATE TABLE plans (
  id          uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text    NOT NULL,
  slug        text    UNIQUE NOT NULL,
  tagline     text,
  features    jsonb   NOT NULL DEFAULT '[]',
  highlight   boolean NOT NULL DEFAULT false,
  cta_text    text,
  cta_phone   text,
  cta_message text,
  active      boolean NOT NULL DEFAULT true,
  sort_order  int     NOT NULL DEFAULT 0
);

-- ─────────────────────────────────────────────────────────────────
-- STORAGE
-- ─────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
  VALUES ('barber-images', 'barber-images', true)
  ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────
-- FUNÇÕES AUXILIARES (SECURITY DEFINER)
--
-- Usam SECURITY DEFINER para que a policy não precise consultar
-- a própria tabela sendo avaliada — evita recursão infinita.
-- SET search_path = '' força nomes qualificados: public.barbers
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.barbers
    WHERE user_id = auth.uid()
      AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_own_barber(bid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.barbers
    WHERE user_id = auth.uid()
      AND id = bid
  );
$$;

-- ─────────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE barbers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE services         ENABLE ROW LEVEL SECURITY;
ALTER TABLE barber_services  ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability     ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_dates    ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans            ENABLE ROW LEVEL SECURITY;

-- barbers: leitura pública, escrita exclusiva do admin
CREATE POLICY "barbers_select" ON barbers FOR SELECT USING (true);
CREATE POLICY "barbers_insert" ON barbers FOR INSERT WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY "barbers_update" ON barbers FOR UPDATE USING ((SELECT public.is_admin()));
CREATE POLICY "barbers_delete" ON barbers FOR DELETE USING ((SELECT public.is_admin()));

-- services: público vê só ativos, admin vê todos
CREATE POLICY "services_select" ON services
  FOR SELECT USING (active = true OR (SELECT public.is_admin()));
CREATE POLICY "services_insert" ON services FOR INSERT WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY "services_update" ON services FOR UPDATE USING ((SELECT public.is_admin()));
CREATE POLICY "services_delete" ON services FOR DELETE USING ((SELECT public.is_admin()));

-- barber_services: leitura pública, escrita admin
CREATE POLICY "bs_select" ON barber_services FOR SELECT USING (true);
CREATE POLICY "bs_insert" ON barber_services FOR INSERT WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY "bs_update" ON barber_services FOR UPDATE USING ((SELECT public.is_admin()));
CREATE POLICY "bs_delete" ON barber_services FOR DELETE USING ((SELECT public.is_admin()));

-- availability: leitura pública, admin e próprio barbeiro gerenciam
CREATE POLICY "avail_select" ON availability FOR SELECT USING (true);
CREATE POLICY "avail_insert" ON availability FOR INSERT
  WITH CHECK ((SELECT public.is_admin()) OR (SELECT public.is_own_barber(barber_id)));
CREATE POLICY "avail_update" ON availability FOR UPDATE
  USING ((SELECT public.is_admin()) OR (SELECT public.is_own_barber(barber_id)));
CREATE POLICY "avail_delete" ON availability FOR DELETE
  USING ((SELECT public.is_admin()) OR (SELECT public.is_own_barber(barber_id)));

-- blocked_dates: leitura pública, admin e próprio barbeiro gerenciam
-- barber_id NULL = bloqueio geral da loja (só admin pode criar)
CREATE POLICY "blocked_select" ON blocked_dates FOR SELECT USING (true);
CREATE POLICY "blocked_insert" ON blocked_dates FOR INSERT
  WITH CHECK ((SELECT public.is_admin()) OR (SELECT public.is_own_barber(barber_id)));
CREATE POLICY "blocked_update" ON blocked_dates FOR UPDATE
  USING ((SELECT public.is_admin()) OR (SELECT public.is_own_barber(barber_id)));
CREATE POLICY "blocked_delete" ON blocked_dates FOR DELETE
  USING ((SELECT public.is_admin()) OR (SELECT public.is_own_barber(barber_id)));

-- bookings: público cria e lê (necessário para /cancelar/:token)
CREATE POLICY "bookings_select" ON bookings FOR SELECT USING (true);
CREATE POLICY "bookings_insert" ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "bookings_cancel" ON bookings FOR UPDATE
  USING  (cancel_token IS NOT NULL)
  WITH CHECK (status = 'cancelado');
CREATE POLICY "bookings_manage" ON bookings FOR UPDATE
  USING ((SELECT public.is_admin()) OR (SELECT public.is_own_barber(barber_id)));

-- settings: apenas autenticados leem (protege credentials_json)
CREATE POLICY "settings_select" ON settings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "settings_insert" ON settings FOR INSERT WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY "settings_update" ON settings FOR UPDATE USING ((SELECT public.is_admin()));

-- plans: público vê planos ativos
CREATE POLICY "plans_select" ON plans
  FOR SELECT USING (active = true OR auth.role() = 'authenticated');
CREATE POLICY "plans_insert" ON plans FOR INSERT WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY "plans_update" ON plans FOR UPDATE USING ((SELECT public.is_admin()));
CREATE POLICY "plans_delete" ON plans FOR DELETE USING ((SELECT public.is_admin()));

-- storage
CREATE POLICY "barber_img_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'barber-images');
CREATE POLICY "barber_img_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'barber-images' AND auth.role() = 'authenticated');
CREATE POLICY "barber_img_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'barber-images' AND auth.role() = 'authenticated');

-- ─────────────────────────────────────────────────────────────────
-- ÍNDICES
-- ─────────────────────────────────────────────────────────────────

CREATE INDEX idx_barbers_user_id       ON barbers (user_id);
CREATE INDEX idx_bookings_barber_date  ON bookings (barber_id, date);
CREATE INDEX idx_bookings_date_status  ON bookings (date, status);
CREATE INDEX idx_bookings_cancel_token ON bookings (cancel_token);
CREATE INDEX idx_availability_barber   ON availability (barber_id, day_of_week);
CREATE INDEX idx_services_category     ON services (category, active);

-- ─────────────────────────────────────────────────────────────────
-- VERIFICAÇÃO
-- ─────────────────────────────────────────────────────────────────

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

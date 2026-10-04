-- ============================================================
-- MK e BALÃO — Migration RLS v4.0
-- Para bancos já existentes: aplica is_admin(), is_own_barber()
-- e substitui todas as policies problemáticas.
--
-- NÃO dropa nem altera tabelas.
-- Execute no Supabase Dashboard → SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────────────────────────
-- 1. FUNÇÕES SECURITY DEFINER
--    Eliminam a recursão infinita de policies que consultam
--    a própria tabela being evaluated.
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
-- 2. LIMPA TODAS AS POLICIES EXISTENTES
-- ─────────────────────────────────────────────────────────────────

-- barbers
DROP POLICY IF EXISTS "barbers_select"             ON barbers;
DROP POLICY IF EXISTS "barbers_insert"             ON barbers;
DROP POLICY IF EXISTS "barbers_update"             ON barbers;
DROP POLICY IF EXISTS "barbers_delete"             ON barbers;
DROP POLICY IF EXISTS "barbers_insert_admin"       ON barbers;
DROP POLICY IF EXISTS "barbers_update_admin"       ON barbers;
DROP POLICY IF EXISTS "barbers_delete_admin"       ON barbers;
DROP POLICY IF EXISTS "barbers_insert_auth"        ON barbers;
DROP POLICY IF EXISTS "barbers_update_auth"        ON barbers;
DROP POLICY IF EXISTS "barbers_delete_auth"        ON barbers;

-- services
DROP POLICY IF EXISTS "services_select"            ON services;
DROP POLICY IF EXISTS "services_insert"            ON services;
DROP POLICY IF EXISTS "services_update"            ON services;
DROP POLICY IF EXISTS "services_delete"            ON services;
DROP POLICY IF EXISTS "services_admin_read"        ON services;
DROP POLICY IF EXISTS "services_insert_admin"      ON services;
DROP POLICY IF EXISTS "services_update_admin"      ON services;
DROP POLICY IF EXISTS "services_delete_admin"      ON services;

-- barber_services
DROP POLICY IF EXISTS "bs_select"                  ON barber_services;
DROP POLICY IF EXISTS "bs_insert"                  ON barber_services;
DROP POLICY IF EXISTS "bs_update"                  ON barber_services;
DROP POLICY IF EXISTS "bs_delete"                  ON barber_services;
DROP POLICY IF EXISTS "barber_services_insert_admin" ON barber_services;
DROP POLICY IF EXISTS "barber_services_update_admin" ON barber_services;
DROP POLICY IF EXISTS "barber_services_delete_admin" ON barber_services;

-- availability
DROP POLICY IF EXISTS "avail_select"               ON availability;
DROP POLICY IF EXISTS "avail_insert"               ON availability;
DROP POLICY IF EXISTS "avail_update"               ON availability;
DROP POLICY IF EXISTS "avail_delete"               ON availability;

-- blocked_dates
DROP POLICY IF EXISTS "blocked_select"             ON blocked_dates;
DROP POLICY IF EXISTS "blocked_insert"             ON blocked_dates;
DROP POLICY IF EXISTS "blocked_update"             ON blocked_dates;
DROP POLICY IF EXISTS "blocked_delete"             ON blocked_dates;
DROP POLICY IF EXISTS "blocked_dates_insert_admin" ON blocked_dates;
DROP POLICY IF EXISTS "blocked_dates_update_admin" ON blocked_dates;
DROP POLICY IF EXISTS "blocked_dates_delete_admin" ON blocked_dates;

-- bookings
DROP POLICY IF EXISTS "bookings_select"            ON bookings;
DROP POLICY IF EXISTS "bookings_insert"            ON bookings;
DROP POLICY IF EXISTS "bookings_cancel"            ON bookings;
DROP POLICY IF EXISTS "bookings_manage"            ON bookings;
DROP POLICY IF EXISTS "bookings_public_read"       ON bookings;
DROP POLICY IF EXISTS "bookings_insert_public"     ON bookings;
DROP POLICY IF EXISTS "bookings_update_public"     ON bookings;
DROP POLICY IF EXISTS "bookings_update_barber"     ON bookings;

-- settings
DROP POLICY IF EXISTS "settings_select"            ON settings;
DROP POLICY IF EXISTS "settings_insert"            ON settings;
DROP POLICY IF EXISTS "settings_update"            ON settings;
DROP POLICY IF EXISTS "settings_insert_admin"      ON settings;
DROP POLICY IF EXISTS "settings_update_admin"      ON settings;

-- plans
DROP POLICY IF EXISTS "plans_select"               ON plans;
DROP POLICY IF EXISTS "plans_insert"               ON plans;
DROP POLICY IF EXISTS "plans_update"               ON plans;
DROP POLICY IF EXISTS "plans_delete"               ON plans;
DROP POLICY IF EXISTS "plans_insert_admin"         ON plans;
DROP POLICY IF EXISTS "plans_update_admin"         ON plans;
DROP POLICY IF EXISTS "plans_delete_admin"         ON plans;

-- ─────────────────────────────────────────────────────────────────
-- 3. RECRIA POLICIES CORRETAS
-- ─────────────────────────────────────────────────────────────────

-- barbers
CREATE POLICY "barbers_select" ON barbers FOR SELECT USING (true);
CREATE POLICY "barbers_insert" ON barbers FOR INSERT WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY "barbers_update" ON barbers FOR UPDATE USING ((SELECT public.is_admin()));
CREATE POLICY "barbers_delete" ON barbers FOR DELETE USING ((SELECT public.is_admin()));

-- services
CREATE POLICY "services_select" ON services
  FOR SELECT USING (active = true OR (SELECT public.is_admin()));
CREATE POLICY "services_insert" ON services FOR INSERT WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY "services_update" ON services FOR UPDATE USING ((SELECT public.is_admin()));
CREATE POLICY "services_delete" ON services FOR DELETE USING ((SELECT public.is_admin()));

-- barber_services
CREATE POLICY "bs_select" ON barber_services FOR SELECT USING (true);
CREATE POLICY "bs_insert" ON barber_services FOR INSERT WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY "bs_update" ON barber_services FOR UPDATE USING ((SELECT public.is_admin()));
CREATE POLICY "bs_delete" ON barber_services FOR DELETE USING ((SELECT public.is_admin()));

-- availability
CREATE POLICY "avail_select" ON availability FOR SELECT USING (true);
CREATE POLICY "avail_insert" ON availability FOR INSERT
  WITH CHECK ((SELECT public.is_admin()) OR (SELECT public.is_own_barber(barber_id)));
CREATE POLICY "avail_update" ON availability FOR UPDATE
  USING ((SELECT public.is_admin()) OR (SELECT public.is_own_barber(barber_id)));
CREATE POLICY "avail_delete" ON availability FOR DELETE
  USING ((SELECT public.is_admin()) OR (SELECT public.is_own_barber(barber_id)));

-- blocked_dates
CREATE POLICY "blocked_select" ON blocked_dates FOR SELECT USING (true);
CREATE POLICY "blocked_insert" ON blocked_dates FOR INSERT
  WITH CHECK ((SELECT public.is_admin()) OR (SELECT public.is_own_barber(barber_id)));
CREATE POLICY "blocked_update" ON blocked_dates FOR UPDATE
  USING ((SELECT public.is_admin()) OR (SELECT public.is_own_barber(barber_id)));
CREATE POLICY "blocked_delete" ON blocked_dates FOR DELETE
  USING ((SELECT public.is_admin()) OR (SELECT public.is_own_barber(barber_id)));

-- bookings
CREATE POLICY "bookings_select" ON bookings FOR SELECT USING (true);
CREATE POLICY "bookings_insert" ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "bookings_cancel" ON bookings FOR UPDATE
  USING  (cancel_token IS NOT NULL)
  WITH CHECK (status = 'cancelado');
CREATE POLICY "bookings_manage" ON bookings FOR UPDATE
  USING ((SELECT public.is_admin()) OR (SELECT public.is_own_barber(barber_id)));

-- settings (authenticated only — protege credentials_json)
CREATE POLICY "settings_select" ON settings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "settings_insert" ON settings FOR INSERT WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY "settings_update" ON settings FOR UPDATE USING ((SELECT public.is_admin()));

-- plans
CREATE POLICY "plans_select" ON plans
  FOR SELECT USING (active = true OR auth.role() = 'authenticated');
CREATE POLICY "plans_insert" ON plans FOR INSERT WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY "plans_update" ON plans FOR UPDATE USING ((SELECT public.is_admin()));
CREATE POLICY "plans_delete" ON plans FOR DELETE USING ((SELECT public.is_admin()));

-- ─────────────────────────────────────────────────────────────────
-- 4. ÍNDICES (cria se ainda não existirem)
-- ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_barbers_user_id       ON barbers (user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_barber_date  ON bookings (barber_id, date);
CREATE INDEX IF NOT EXISTS idx_bookings_date_status  ON bookings (date, status);
CREATE INDEX IF NOT EXISTS idx_bookings_cancel_token ON bookings (cancel_token);
CREATE INDEX IF NOT EXISTS idx_availability_barber   ON availability (barber_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_services_category     ON services (category, active);

-- ─────────────────────────────────────────────────────────────────
-- 5. VERIFICAÇÃO — mostra policies ativas após migração
-- ─────────────────────────────────────────────────────────────────

SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;

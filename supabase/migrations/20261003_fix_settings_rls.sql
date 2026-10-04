-- ============================================================
-- MIGRATION: fix_settings_rls
-- Data: 2026-10-03
-- P0 BLOCKER — credentials_json exposto a todos os autenticados.
-- A policy settings_select permitia auth.role() = 'authenticated',
-- o que dava a qualquer barbeiro leitura das senhas externas.
-- Fix: restringe leitura a admin apenas.
-- ============================================================

-- Remove policy permissiva
DROP POLICY IF EXISTS "settings_select" ON settings;

-- Recria restrita ao admin
CREATE POLICY "settings_select" ON settings
  FOR SELECT USING ((SELECT public.is_admin()));

-- Confirma policies da tabela
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'settings';

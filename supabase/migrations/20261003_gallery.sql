-- ════════════════════════════════════════════════════════════
--  MIGRATION: gallery (Trabalhos Recentes)
--  Execute no Supabase Dashboard → SQL Editor
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.gallery (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  url         text NOT NULL,
  label       text NOT NULL DEFAULT '',
  sort_order  integer NOT NULL DEFAULT 0,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS gallery_sort_idx ON public.gallery(sort_order);

-- RLS
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;

-- Público pode ver fotos ativas (para a Home carregar sem autenticação)
CREATE POLICY "gallery_public_select" ON public.gallery
  FOR SELECT USING (active = true);

-- Somente admin gerencia
CREATE POLICY "gallery_admin_all" ON public.gallery
  FOR ALL USING ((SELECT public.is_admin()));

-- ── Storage bucket (rodar separado se não existir) ──────────
-- No Supabase Dashboard → Storage → New bucket: "gallery-images"
-- Public bucket: sim  (para as imagens serem acessíveis sem auth)

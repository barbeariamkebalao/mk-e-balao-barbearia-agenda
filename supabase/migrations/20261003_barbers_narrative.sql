-- ============================================================
-- MIGRATION: barbers_narrative
-- Data: 2026-10-03
-- Objetivo: Sincroniza bio, quote e speciality dos barbeiros
--           com a narrativa ajustada na Home
-- Execute: Supabase Dashboard → SQL Editor
-- ============================================================

-- Verifica slugs antes de rodar (opcional — comentar depois)
SELECT id, name, slug, speciality, bio, quote, active, role
FROM barbers
ORDER BY sort_order;

-- ─────────────────────────────────────────────────────────────
-- MK — Maikon Dener
-- ─────────────────────────────────────────────────────────────
UPDATE barbers
SET
  speciality = 'Master Barber & Visagista',
  bio        = 'Maikon une a tradição da barbearia com o estilo urbano. Focado em entregar sempre o melhor resultado, com aquele respeito e qualidade impecável.',
  quote      = '"O clássico nunca sai de moda."',
  sort_order = 1
WHERE slug = 'mk';

-- ─────────────────────────────────────────────────────────────
-- BALÃO — Daniel Ferreira
-- Tenta os dois slugs mais prováveis: 'balao' e 'daniel'
-- ─────────────────────────────────────────────────────────────
UPDATE barbers
SET
  speciality = 'Especialista em Colorimetria',
  bio        = 'Daniel construiu sua reputação com muito trabalho, técnica e um atendimento que faz o cliente se sentir em casa. Especialista em degradê limpo e acabamento na régua.',
  quote      = '"Jesus is enough"',
  sort_order = 2
WHERE slug IN ('balao', 'daniel');

-- ─────────────────────────────────────────────────────────────
-- GABRIEL — Gabriel Oliveira
-- ─────────────────────────────────────────────────────────────
UPDATE barbers
SET
  speciality = 'Barbeiro Profissional',
  bio        = 'Gabriel é o talento da nova geração. Com a mão leve e cortes precisos, ele garante um alinhamento perfeito e a sua autoestima no teto.',
  quote      = '"O detalhe separa o bom do excelente."',
  sort_order = 3
WHERE slug = 'gabriel';

-- ─────────────────────────────────────────────────────────────
-- Garante que phone dos fundadores esteja correto
-- (só atualiza se estiver nulo — preserva o que o admin tiver salvo)
-- ─────────────────────────────────────────────────────────────
UPDATE barbers
SET phone = '5514998989521'
WHERE slug = 'mk' AND (phone IS NULL OR phone = '');

UPDATE barbers
SET phone = '5514996598304'
WHERE slug IN ('balao', 'daniel') AND (phone IS NULL OR phone = '');

UPDATE barbers
SET phone = '5514998918483'
WHERE slug = 'gabriel' AND (phone IS NULL OR phone = '');

-- ─────────────────────────────────────────────────────────────
-- Confirmação final
-- ─────────────────────────────────────────────────────────────
SELECT
  sort_order,
  name,
  slug,
  speciality,
  left(bio, 60)   AS bio_preview,
  quote,
  phone,
  active
FROM barbers
WHERE role != 'admin'
ORDER BY sort_order;

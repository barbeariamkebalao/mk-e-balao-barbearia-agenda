-- ============================================================
-- MK e BALÃO Barbearia — Reset de Dados v4.0
-- Supabase Dashboard → SQL Editor → Execute
-- Outubro 2026
--
-- PRÉ-REQUISITO: schema.sql v4.0 já executado
--
-- O QUE FAZ:
--   Limpa e repopula: serviços, barbeiros, disponibilidade, settings, planos
--
-- O QUE NÃO FAZ:
--   - Não toca em tabelas, RLS ou índices
--   - Não cria usuários auth (Dashboard → Authentication)
--   - Não vincula user_id (use vincular-usuarios.sql depois)
--
-- ALTERNATIVA (recomendada): node seed-runner.js
--   Usa service_role key, bypass total de RLS e ownership.
-- ============================================================

-- Desativa RLS e FK checks para esta sessão
SET session_replication_role = replica;
SET row_security = off;

-- ─────────────────────────────────────────────────────────────────
-- LIMPAR
-- ─────────────────────────────────────────────────────────────────

TRUNCATE TABLE barber_services RESTART IDENTITY CASCADE;
TRUNCATE TABLE availability    RESTART IDENTITY CASCADE;
TRUNCATE TABLE blocked_dates   RESTART IDENTITY CASCADE;
TRUNCATE TABLE bookings        RESTART IDENTITY CASCADE;
TRUNCATE TABLE plans           RESTART IDENTITY CASCADE;
DELETE FROM barbers;
DELETE FROM services;

-- ─────────────────────────────────────────────────────────────────
-- SERVIÇOS
-- ─────────────────────────────────────────────────────────────────

INSERT INTO services
  (name, slug, category, description, badge, duration_minutes, price, price_type, is_addon, active, sort_order)
VALUES
  ('Degradê / Fade',       'fade',               'cabelo',       'Degradê impecável, transição suave e acabamento milimétrico na navalha.',    'Mais Pedido',        40,  45.00, 'fixed', false, true,  1),
  ('Corte Social',         'social',             'cabelo',       'O clássico bem alinhado. Perfeito para o ambiente corporativo.',             null,                 35,  40.00, 'fixed', false, true,  2),
  ('Corte na Tesoura',     'tesoura',            'cabelo',       'Arte manual pura. Construção de formato, caimento e textura.',              null,                 45,  50.00, 'fixed', false, true,  3),
  ('Pezinho',              'pezinho',            'cabelo',       'Acabamento limpo na nuca com navalha. Rápido, preciso e impecável.',         null,                 20,  20.00, 'fixed', false, true,  4),
  ('Barba Clássica',       'barba',              'barba',        'Ritual com toalha quente, espuma densa, navalha afiada e balm.',            'Ritual',             30,  35.00, 'fixed', false, true,  5),
  ('Cabelo + Barba',       'combo_cabelo_barba', 'combo',        'Corte + barba completa com toalha quente. Sobrancelha inclusa.',            'Sobrancelha Grátis', 80,  70.00, 'fixed', false, true,  6),
  ('Colorimetria',         'colorimetria',       'colorimetria', 'Especialistas em platinado, luzes, reflexo e camuflagem de brancos.',       null,                 90,  80.00, 'from',  false, true,  7),
  ('Platinado / Nevou',    'platinado',          'colorimetria', 'O efeito "nevou" com precisão — cabelo todo platinado.',                    'Especialidade',     120, 120.00, 'from',  false, true,  8),
  ('Luzes / Reflexos',     'luzes',              'colorimetria', 'Mechas e luzes naturais para movimento e volume.',                          null,                 90,  80.00, 'from',  false, true,  9),
  ('Sobrancelha',          'sobrancelha',        'adicional',    'Limpeza geométrica na navalha para valorizar o olhar masculino.',           null,                 15,  15.00, 'fixed', true,  true, 10),
  ('Limpeza de Pele',      'limpeza_pele',       'adicional',    'Limpeza profunda com vapor e extração.',                                    null,                 20,  25.00, 'fixed', true,  true, 11),
  ('Depilação Nasal',      'depilacao_nasal',    'adicional',    'Remoção rápida dos pelos nasais com cera quente.',                         null,                 10,  15.00, 'fixed', true,  true, 12),
  ('Pigmentação de Barba', 'pigmentacao_barba',  'adicional',    'Cobertura de brancos na barba com pigmento natural.',                      null,                 15,  20.00, 'fixed', true,  true, 13);

-- ─────────────────────────────────────────────────────────────────
-- BARBEIROS (user_id NULL — vincula depois)
-- ─────────────────────────────────────────────────────────────────

INSERT INTO barbers
  (name, slug, role, phone, avatar_url, bio, quote, speciality, interval_minutes, active, sort_order)
VALUES
  (
    'Maikon MK', 'maikon', 'barber', '5514998989521', '/barbeiro-maikon.png',
    'Maikon une a tradição da barbearia com o estilo urbano. Focado em entregar sempre o melhor resultado.',
    'O clássico nunca sai de moda.',
    'Mestre em Fade & Visagista',
    40, true, 1
  ),
  (
    'Gabriel Oliveira', 'gabriel', 'barber', '5514998918483', '/barbeiro-gabriel.png',
    'Gabriel é o talento da nova geração. Com a mão leve e cortes precisos, garante alinhamento perfeito.',
    'O detalhe separa o bom do excelente.',
    'Barba & Clássicos',
    50, true, 2
  ),
  (
    'Daniel Balão', 'daniel', 'barber', '5514996598304', '/barbeiro-daniel.png',
    'Daniel construiu sua reputação com técnica e atendimento que faz o cliente se sentir em casa.',
    'Jesus is enough',
    'Especialista em Colorimetria & Nevou',
    60, true, 3
  );

INSERT INTO barbers (name, slug, role, phone, interval_minutes, active, sort_order)
VALUES ('Admin MK', 'admin', 'admin', '5514998989521', 50, false, 99);

-- ─────────────────────────────────────────────────────────────────
-- SERVIÇOS POR BARBEIRO
-- ─────────────────────────────────────────────────────────────────

INSERT INTO barber_services (barber_id, service_id)
SELECT b.id, s.id
FROM barbers b CROSS JOIN services s
WHERE b.slug IN ('maikon','gabriel','daniel')
  AND s.slug IN (
    'fade','social','tesoura','pezinho','barba','combo_cabelo_barba',
    'colorimetria','sobrancelha','limpeza_pele','depilacao_nasal','pigmentacao_barba'
  );

INSERT INTO barber_services (barber_id, service_id)
SELECT b.id, s.id
FROM barbers b CROSS JOIN services s
WHERE b.slug = 'daniel'
  AND s.slug IN ('platinado','luzes');

-- ─────────────────────────────────────────────────────────────────
-- DISPONIBILIDADE
-- ─────────────────────────────────────────────────────────────────

INSERT INTO availability (barber_id, day_of_week, start_time, end_time, active)
SELECT b.id, d.day, '09:00'::time, '19:00'::time, true
FROM barbers b CROSS JOIN (VALUES (1),(2),(3),(4),(5)) AS d(day)
WHERE b.slug IN ('maikon','gabriel','daniel');

INSERT INTO availability (barber_id, day_of_week, start_time, end_time, active)
SELECT b.id, 6, '09:00'::time, '20:00'::time, true
FROM barbers b WHERE b.slug IN ('maikon','gabriel','daniel');

-- ─────────────────────────────────────────────────────────────────
-- SETTINGS
-- ─────────────────────────────────────────────────────────────────

INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

UPDATE settings SET
  name             = 'MK e BALÃO Barbearia',
  tagline          = 'O Ritual do Homem Moderno.',
  whatsapp         = '5514998989521',
  address          = 'Praça Ataliba Leonel, 200 – Centro, Piraju - SP',
  city             = 'Piraju — SP',
  hours_weekday    = '09:00 – 19:00',
  hours_saturday   = '09:00 – 20:00',
  instagram        = 'https://www.instagram.com/barbeariamkebalao/',
  maps_url         = 'https://maps.google.com/?q=Praça+Ataliba+Leonel,+200+-+Centro,+Piraju',
  credentials_json = '[]'::jsonb
WHERE id = 1;

-- Nota: adicione credenciais digitais via Admin → Config → Acesso Digital
-- Nunca commite senhas reais em arquivos SQL de reset.

-- ─────────────────────────────────────────────────────────────────
-- PLANOS
-- ─────────────────────────────────────────────────────────────────

INSERT INTO plans (name, slug, tagline, features, highlight, cta_text, cta_phone, cta_message, active, sort_order) VALUES
  (
    'Plano Respeito', 'respeito', 'O Básico Sempre na Régua.',
    '["2 Cortes no mês","1 Barba Completa","1 Sobrancelha","10% OFF em Produtos"]'::jsonb,
    false, 'GARANTIR PLANO RESPEITO', '5514996598304',
    'Olá! Gostaria de saber mais sobre o Plano Respeito.', true, 1
  ),
  (
    'Plano Patrão', 'patrao', 'Presença Marcante o Mês Inteiro.',
    '["4 Cortes no mês","Barba inclusa nos atendimentos","Sobrancelha Inclusa","Agendamento Prioritário","20% OFF em Produtos"]'::jsonb,
    true, 'GARANTIR PLANO PATRÃO 👑', '5514996598304',
    'Olá! Quero garantir o Plano Patrão!', true, 2
  );

-- ─────────────────────────────────────────────────────────────────
-- REATIVA
-- ─────────────────────────────────────────────────────────────────

SET row_security = on;
SET session_replication_role = DEFAULT;

-- ─────────────────────────────────────────────────────────────────
-- VERIFICAÇÃO
-- ─────────────────────────────────────────────────────────────────

SELECT 'barbers'          AS tabela, count(*)::text AS total FROM barbers
UNION ALL SELECT 'services',          count(*)::text FROM services
UNION ALL SELECT 'barber_services',   count(*)::text FROM barber_services
UNION ALL SELECT 'availability',      count(*)::text FROM availability
UNION ALL SELECT 'plans',             count(*)::text FROM plans;

SELECT name, slug, role, active,
       CASE WHEN user_id IS NOT NULL THEN '✓ vinculado' ELSE '— aguardando' END AS auth
FROM barbers ORDER BY sort_order;

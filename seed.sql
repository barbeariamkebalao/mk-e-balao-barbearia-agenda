-- ============================================================
-- MK e BALÃO Barbearia — Seed Data
-- Execute após schema.sql no SQL Editor do Supabase
-- Versão: 2.0 — Outubro 2026
-- ============================================================

-- ── SERVIÇOS PRINCIPAIS ──────────────────────────────────────
-- is_addon = false → serviços principais (escolha única por atendimento)
-- is_addon = true  → adicionais (acumuláveis, complementam o principal)

INSERT INTO services (name, slug, category, description, duration_minutes, price, price_type, is_addon, active, sort_order)
VALUES
  -- CABELO
  ('Corte Fade',
   'fade',
   'cabelo',
   'Degradê impecável, transição suave e acabamento milimétrico na navalha.',
   40, 45.00, 'fixed', false, true, 1),

  ('Corte Social',
   'social',
   'cabelo',
   'O clássico bem alinhado. Perfeito para o ambiente corporativo, mantendo a postura.',
   40, 40.00, 'fixed', false, true, 2),

  ('Corte na Tesoura',
   'tesoura',
   'cabelo',
   'Arte manual pura. Construção de formato, caimento e textura personalizados.',
   50, 50.00, 'fixed', false, true, 3),

  -- BARBA
  ('Barba Clássica',
   'barba',
   'barba',
   'Ritual com toalha quente, espuma densa, navalha afiada e hidratação com balm.',
   30, 35.00, 'fixed', false, true, 4),

  -- COMBO
  ('Cabelo + Barba',
   'combo_cabelo_barba',
   'combo',
   'O combo completo: corte + barba com toalha quente. O melhor custo-benefício.',
   80, 70.00, 'fixed', false, true, 5),

  -- COLORIMETRIA
  ('Colorimetria',
   'colorimetria',
   'colorimetria',
   'Especialistas em platinado ("nevou"), luzes, reflexo alinhado e camuflagem de brancos.',
   120, 80.00, 'from', false, true, 6),

  ('Platinado / Nevou',
   'platinado',
   'colorimetria',
   'O efeito "nevou" com precisão — cabelo todo platinado ou com mechões brancos.',
   180, 120.00, 'from', false, true, 7),

  ('Luzes',
   'luzes',
   'colorimetria',
   'Mechas e luzes naturais para dar movimento e volume ao corte.',
   120, 90.00, 'from', false, true, 8),

  -- ADICIONAIS (is_addon = true)
  ('Sobrancelha',
   'sobrancelha',
   'adicional',
   'Limpeza geométrica na navalha para valorizar o olhar masculino.',
   15, 15.00, 'fixed', true, true, 9),

  ('Limpeza de Pele',
   'limpeza_pele',
   'adicional',
   'Limpeza profunda com vapor e extração — pele limpa e renovada.',
   20, 25.00, 'fixed', true, true, 10),

  ('Depilação Nasal',
   'depilacao_nasal',
   'adicional',
   'Remoção rápida e precisa dos pelos nasais com cera quente.',
   10, 10.00, 'fixed', true, true, 11);

-- ── BARBEIROS ────────────────────────────────────────────────
-- user_id será linkado após criar os usuários no Supabase Auth:
--   Dashboard → Authentication → Users → Add user
--   Depois: UPDATE barbers SET user_id = '<uuid>' WHERE slug = '<slug>';

INSERT INTO barbers (name, slug, role, phone, avatar_url, bio, quote, speciality, interval_minutes, active, sort_order)
VALUES
  (
    'Maikon MK',
    'maikon',
    'barber',
    '5514998989521',
    '/barbeiro-maikon.png',
    'Maikon une a tradição da barbearia com o estilo urbano. Focado em entregar sempre o melhor resultado, com aquele respeito e qualidade impecável.',
    'O clássico nunca sai de moda.',
    'Mestre em Fade & Visagista',
    40,   -- atende a cada 40 minutos
    true,
    1
  ),
  (
    'Gabriel Oliveira',
    'gabriel',
    'barber',
    '5514998918483',
    '/barbeiro-gabriel.png',
    'Gabriel é o talento da nova geração. Com a mão leve e cortes precisos, ele garante um alinhamento perfeito e a sua autoestima no teto.',
    'O detalhe separa o bom do excelente.',
    'Barba & Clássicos',
    50,   -- atende a cada 50 minutos
    true,
    2
  ),
  (
    'Daniel Balão',
    'daniel',
    'barber',
    '5514996598304',
    '/barbeiro-daniel.png',
    'Daniel construiu sua reputação com muito trabalho, técnica e um atendimento que faz o cliente se sentir em casa. Especialista em degradê limpo e colorimetria.',
    'Jesus is enough',
    'Especialista em Colorimetria & Nevou',
    60,   -- atende a cada 60 minutos (colorimetria exige mais tempo)
    true,
    3
  );

-- Admin geral (Maikon é o dono — mas criamos um registro separado)
INSERT INTO barbers (name, slug, role, phone, interval_minutes, active, sort_order)
VALUES
  ('Admin MK', 'admin', 'admin', '5514998989521', 50, false, 99);

-- ── BARBER_SERVICES ──────────────────────────────────────────
-- Todos os barbeiros oferecem todos os serviços principais e adicionais
-- Colorimetria avançada (platinado, luzes) apenas para Daniel

-- Serviços base para todos
INSERT INTO barber_services (barber_id, service_id)
SELECT b.id, s.id
FROM barbers b
CROSS JOIN services s
WHERE b.slug IN ('maikon', 'gabriel', 'daniel')
  AND s.slug IN ('fade','social','tesoura','barba','combo_cabelo_barba',
                 'colorimetria','sobrancelha','limpeza_pele','depilacao_nasal')
  AND s.active = true;

-- Platinado e luzes apenas para Daniel (especialista em colorimetria)
INSERT INTO barber_services (barber_id, service_id)
SELECT b.id, s.id
FROM barbers b
CROSS JOIN services s
WHERE b.slug = 'daniel'
  AND s.slug IN ('platinado', 'luzes');

-- ── AVAILABILITY ─────────────────────────────────────────────
-- Segunda (1) a Sexta (5): 09:00 – 19:00
-- Sábado (6):              09:00 – 20:00
-- Domingo (0):             fechado (sem registro = sem disponibilidade)

-- Segunda a Sexta
INSERT INTO availability (barber_id, day_of_week, start_time, end_time, active)
SELECT b.id, d.day, '09:00'::time, '19:00'::time, true
FROM barbers b
CROSS JOIN (VALUES (1),(2),(3),(4),(5)) AS d(day)
WHERE b.slug IN ('maikon', 'gabriel', 'daniel');

-- Sábado (horário estendido)
INSERT INTO availability (barber_id, day_of_week, start_time, end_time, active)
SELECT b.id, 6, '09:00'::time, '20:00'::time, true
FROM barbers b
WHERE b.slug IN ('maikon', 'gabriel', 'daniel');

-- ── SETTINGS ─────────────────────────────────────────────────
UPDATE settings SET
  name           = 'MK e BALÃO Barbearia',
  tagline        = 'O Ritual do Homem Moderno.',
  whatsapp       = '5514998989521',
  address        = 'Praça Ataliba Leonel, 200 – Centro, Piraju - SP',
  city           = 'Piraju — SP',
  hours_weekday  = '09:00 – 19:00',
  hours_saturday = '09:00 – 20:00',
  instagram      = 'https://www.instagram.com/barbeariamkebalao/',
  maps_url       = 'https://maps.google.com/?q=Praça+Ataliba+Leonel,+200+-+Centro,+Piraju'
WHERE id = 1;

-- ── PLANOS DO CLUBE ──────────────────────────────────────────
INSERT INTO plans (name, slug, tagline, features, highlight, cta_text, cta_phone, cta_message, active, sort_order)
VALUES
  (
    'Plano Respeito',
    'respeito',
    'O Básico Sempre na Régua.',
    '["2 Cortes no mês","1 Barba Completa","1 Sobrancelha","10% OFF em Produtos"]'::jsonb,
    false,
    'GARANTIR PLANO RESPEITO',
    '5514996598304',
    'Olá! Gostaria de saber mais sobre o Plano Respeito.',
    true,
    1
  ),
  (
    'Plano Patrão',
    'patrao',
    'Presença Marcante o Mês Inteiro.',
    '["4 Cortes no mês","Barba inclusa nos atendimentos","Sobrancelha Inclusa","Agendamento Prioritário","20% OFF em Produtos"]'::jsonb,
    true,
    'GARANTIR PLANO PATRÃO 👑',
    '5514996598304',
    'Olá! Quero garantir o Plano Patrão!',
    true,
    2
  );

-- ── AGENDAMENTOS DE EXEMPLO (OPCIONAL) ───────────────────────
-- Descomente para testar o painel admin com dados reais

/*
INSERT INTO bookings (client_name, client_phone, barber_id, services, date, time, total_minutes, total, status)
SELECT
  'João Silva',
  '14991234567',
  (SELECT id FROM barbers WHERE slug = 'maikon'),
  '[{"id": null, "name": "Corte Fade", "price": 45.00, "duration": 40}]'::jsonb,
  CURRENT_DATE,
  '09:00'::time,
  40,
  45.00,
  'confirmado';

INSERT INTO bookings (client_name, client_phone, barber_id, services, date, time, total_minutes, total, status)
SELECT
  'Pedro Souza',
  '14999876543',
  (SELECT id FROM barbers WHERE slug = 'gabriel'),
  '[{"id": null, "name": "Cabelo + Barba", "price": 70.00, "duration": 80}]'::jsonb,
  CURRENT_DATE,
  '10:00'::time,
  80,
  70.00,
  'pendente';

INSERT INTO bookings (client_name, client_phone, barber_id, services, date, time, total_minutes, total, status)
SELECT
  'Lucas Ferreira',
  '14997654321',
  (SELECT id FROM barbers WHERE slug = 'daniel'),
  '[{"id": null, "name": "Platinado / Nevou", "price": 120.00, "duration": 180}]'::jsonb,
  CURRENT_DATE,
  '10:00'::time,
  180,
  120.00,
  'pendente';
*/

-- ============================================================
-- PRÓXIMOS PASSOS APÓS RODAR ESTE SEED:
--
-- 1. Criar usuários no Supabase Auth (Dashboard → Authentication → Users):
--      maikon@mkebalao.com.br  (senha segura)
--      gabriel@mkebalao.com.br (senha segura)
--      daniel@mkebalao.com.br  (senha segura)
--      admin@mkebalao.com.br   (senha segura)
--
-- 2. Linkar user_id aos barbeiros:
--      UPDATE barbers SET user_id = '<uuid-do-maikon>'  WHERE slug = 'maikon';
--      UPDATE barbers SET user_id = '<uuid-do-gabriel>' WHERE slug = 'gabriel';
--      UPDATE barbers SET user_id = '<uuid-do-daniel>'  WHERE slug = 'daniel';
--      UPDATE barbers SET user_id = '<uuid-do-admin>'   WHERE slug = 'admin';
--
-- 3. Promover admin:
--      UPDATE barbers SET active = true WHERE slug = 'admin';
--
-- 4. Copiar SUPABASE_URL e ANON_KEY para .env.local:
--      VITE_SUPABASE_URL=https://xxxx.supabase.co
--      VITE_SUPABASE_ANON_KEY=eyJhbGci...
-- ============================================================

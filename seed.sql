-- ============================================================
-- MK e BALÃO Barbearia — Seed
-- Execute APÓS schema.sql no SQL Editor do Supabase
-- Versão: 3.0 — Outubro 2026
--
-- Não cria usuários de auth — crie-os pelo Dashboard
-- Não vincula user_id — use docs/vincular-usuarios.sql depois
-- ============================================================

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
-- BARBEIROS (user_id NULL — vincula depois com vincular-usuarios.sql)
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

-- Admin geral (active = false — não aparece no agendamento público)
INSERT INTO barbers (name, slug, role, phone, interval_minutes, active, sort_order)
VALUES ('Admin MK', 'admin', 'admin', '5514998989521', 50, false, 99);

-- ─────────────────────────────────────────────────────────────────
-- SERVIÇOS POR BARBEIRO
-- ─────────────────────────────────────────────────────────────────

-- Todos os barbeiros: serviços base
INSERT INTO barber_services (barber_id, service_id)
SELECT b.id, s.id
FROM barbers b CROSS JOIN services s
WHERE b.slug IN ('maikon','gabriel','daniel')
  AND s.slug IN (
    'fade','social','tesoura','pezinho','barba','combo_cabelo_barba',
    'colorimetria','sobrancelha','limpeza_pele','depilacao_nasal','pigmentacao_barba'
  );

-- Só Daniel: colorimetria avançada
INSERT INTO barber_services (barber_id, service_id)
SELECT b.id, s.id
FROM barbers b CROSS JOIN services s
WHERE b.slug = 'daniel' AND s.slug IN ('platinado','luzes');

-- ─────────────────────────────────────────────────────────────────
-- DISPONIBILIDADE
-- ─────────────────────────────────────────────────────────────────

-- Segunda (1) a Sexta (5): 09:00–19:00
INSERT INTO availability (barber_id, day_of_week, start_time, end_time, active)
SELECT b.id, d.day, '09:00'::time, '19:00'::time, true
FROM barbers b CROSS JOIN (VALUES (1),(2),(3),(4),(5)) AS d(day)
WHERE b.slug IN ('maikon','gabriel','daniel');

-- Sábado (6): 09:00–20:00
INSERT INTO availability (barber_id, day_of_week, start_time, end_time, active)
SELECT b.id, 6, '09:00'::time, '20:00'::time, true
FROM barbers b WHERE b.slug IN ('maikon','gabriel','daniel');

-- ─────────────────────────────────────────────────────────────────
-- SETTINGS
-- ─────────────────────────────────────────────────────────────────

INSERT INTO settings (
  id, name, tagline, whatsapp, address, city,
  hours_weekday, hours_saturday, instagram, maps_url, credentials_json
) VALUES (
  1,
  'MK e BALÃO Barbearia',
  'O Ritual do Homem Moderno.',
  '5514998989521',
  'Praça Ataliba Leonel, 200 – Centro, Piraju - SP',
  'Piraju — SP',
  '09:00 – 19:00',
  '09:00 – 20:00',
  'https://www.instagram.com/barbeariamkebalao/',
  'https://maps.google.com/?q=Praça+Ataliba+Leonel,+200+-+Centro,+Piraju',
  '[]'
);

-- ─────────────────────────────────────────────────────────────────
-- PLANOS DO CLUBE
-- ─────────────────────────────────────────────────────────────────

INSERT INTO plans (name, slug, tagline, features, highlight, cta_text, cta_phone, cta_message, active, sort_order) VALUES
  (
    'Plano Respeito', 'respeito', 'O Básico Sempre na Régua.',
    '["2 Cortes no mês","1 Barba Completa","1 Sobrancelha","10% OFF em Produtos"]',
    false, 'GARANTIR PLANO RESPEITO', '5514996598304',
    'Olá! Gostaria de saber mais sobre o Plano Respeito.', true, 1
  ),
  (
    'Plano Patrão', 'patrao', 'Presença Marcante o Mês Inteiro.',
    '["4 Cortes no mês","Barba inclusa nos atendimentos","Sobrancelha Inclusa","Agendamento Prioritário","20% OFF em Produtos"]',
    true, 'GARANTIR PLANO PATRÃO 👑', '5514996598304',
    'Olá! Quero garantir o Plano Patrão!', true, 2
  );

-- ─────────────────────────────────────────────────────────────────
-- VERIFICAÇÃO
-- ─────────────────────────────────────────────────────────────────

SELECT 'barbeiros'        AS tabela, count(*)::text AS total FROM barbers
UNION ALL SELECT 'services',         count(*)::text FROM services
UNION ALL SELECT 'barber_services',  count(*)::text FROM barber_services
UNION ALL SELECT 'availability',     count(*)::text FROM availability
UNION ALL SELECT 'plans',            count(*)::text FROM plans;

SELECT name, slug, role, active,
       CASE WHEN user_id IS NOT NULL THEN '✓ vinculado' ELSE '— aguardando' END AS auth
FROM barbers ORDER BY sort_order;

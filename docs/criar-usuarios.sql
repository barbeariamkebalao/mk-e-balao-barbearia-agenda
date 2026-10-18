-- ============================================================
-- MK e BALÃO — Criação automática de usuários auth v4.1
-- Supabase Dashboard → SQL Editor → Execute
-- Outubro 2026
--
-- O QUE FAZ:
--   1. Remove usuários existentes (idempotente)
--   2. Cria 4 usuários em auth.users + auth.identities
--   3. Vincula cada usuário ao seu barbeiro em barbers.user_id
--
-- SENHA PADRÃO: 123456 (trocar após o primeiro login)
--
-- PRÉ-REQUISITO: seed.sql já executado
--   (os registros em barbers precisam existir antes do UPDATE)
-- ============================================================

SET row_security = off;

-- ─────────────────────────────────────────────────────────────────
-- 1. REMOVE USUÁRIOS ANTERIORES (cleanup idempotente)
-- ─────────────────────────────────────────────────────────────────

DELETE FROM auth.identities
WHERE provider_id IN (
  'mk@mkebalaobarbearia.com.br',
  'gabriel@mkebalaobarbearia.com.br',
  'daniel@mkebalaobarbearia.com.br',
  'admin@mkebalaobarbearia.com.br'
);

DELETE FROM auth.users
WHERE email IN (
  'mk@mkebalaobarbearia.com.br',
  'gabriel@mkebalaobarbearia.com.br',
  'daniel@mkebalaobarbearia.com.br',
  'admin@mkebalaobarbearia.com.br'
);

-- ─────────────────────────────────────────────────────────────────
-- 2. CRIA USUÁRIOS E VINCULA AOS BARBEIROS
-- ─────────────────────────────────────────────────────────────────

DO $$
DECLARE
  uid_maikon  uuid := gen_random_uuid();
  uid_gabriel uuid := gen_random_uuid();
  uid_daniel  uuid := gen_random_uuid();
  uid_admin   uuid := gen_random_uuid();
BEGIN

  -- Cria os usuários em auth.users
  INSERT INTO auth.users (
    instance_id, id, aud, role,
    email, encrypted_password, email_confirmed_at,
    phone, raw_app_meta_data, raw_user_meta_data,
    is_super_admin, is_sso_user, is_anonymous,
    created_at, updated_at
  ) VALUES
    ('00000000-0000-0000-0000-000000000000', uid_maikon,
     'authenticated', 'authenticated',
     'mk@mkebalaobarbearia.com.br', crypt('123456', gen_salt('bf')), NOW(),
     NULL, '{"provider":"email","providers":["email"]}', '{}',
     false, false, false, NOW(), NOW()),

    ('00000000-0000-0000-0000-000000000000', uid_gabriel,
     'authenticated', 'authenticated',
     'gabriel@mkebalaobarbearia.com.br', crypt('123456', gen_salt('bf')), NOW(),
     NULL, '{"provider":"email","providers":["email"]}', '{}',
     false, false, false, NOW(), NOW()),

    ('00000000-0000-0000-0000-000000000000', uid_daniel,
     'authenticated', 'authenticated',
     'daniel@mkebalaobarbearia.com.br', crypt('123456', gen_salt('bf')), NOW(),
     NULL, '{"provider":"email","providers":["email"]}', '{}',
     false, false, false, NOW(), NOW()),

    ('00000000-0000-0000-0000-000000000000', uid_admin,
     'authenticated', 'authenticated',
     'admin@mkebalaobarbearia.com.br', crypt('123456', gen_salt('bf')), NOW(),
     NULL, '{"provider":"email","providers":["email"]}', '{}',
     false, false, false, NOW(), NOW());

  -- Cria as identidades (necessário para login por email funcionar)
  INSERT INTO auth.identities (
    id, user_id, provider_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) VALUES
    (gen_random_uuid(), uid_maikon,  'mk@mkebalaobarbearia.com.br',
     json_build_object('sub', uid_maikon::text,  'email', 'mk@mkebalaobarbearia.com.br'),
     'email', NOW(), NOW(), NOW()),

    (gen_random_uuid(), uid_gabriel, 'gabriel@mkebalaobarbearia.com.br',
     json_build_object('sub', uid_gabriel::text, 'email', 'gabriel@mkebalaobarbearia.com.br'),
     'email', NOW(), NOW(), NOW()),

    (gen_random_uuid(), uid_daniel,  'daniel@mkebalaobarbearia.com.br',
     json_build_object('sub', uid_daniel::text,  'email', 'daniel@mkebalaobarbearia.com.br'),
     'email', NOW(), NOW(), NOW()),

    (gen_random_uuid(), uid_admin,   'admin@mkebalaobarbearia.com.br',
     json_build_object('sub', uid_admin::text,   'email', 'admin@mkebalaobarbearia.com.br'),
     'email', NOW(), NOW(), NOW());

  -- Vincula cada auth.user ao seu registro em barbers
  UPDATE barbers SET user_id = uid_maikon  WHERE slug = 'maikon';
  UPDATE barbers SET user_id = uid_gabriel WHERE slug = 'gabriel';
  UPDATE barbers SET user_id = uid_daniel  WHERE slug = 'daniel';
  UPDATE barbers SET user_id = uid_admin   WHERE slug = 'admin';

END $$;

SET row_security = on;

-- ─────────────────────────────────────────────────────────────────
-- 3. VERIFICAÇÃO
-- ─────────────────────────────────────────────────────────────────

SELECT
  u.email,
  b.name       AS barbeiro,
  b.role,
  b.slug,
  b.user_id IS NOT NULL AS vinculado
FROM auth.users u
LEFT JOIN barbers b ON b.user_id = u.id
WHERE u.email LIKE '%mkebalaobarbearia.com.br'
ORDER BY b.sort_order;

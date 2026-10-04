-- ============================================================
-- MK e BALÃO — Vínculos auth ↔ barbers (produção)
-- Última atualização: Outubro 2026
-- ============================================================

UPDATE barbers SET user_id = '300d77a6-8e5d-4c7c-ae85-8313a5e8a22f' WHERE slug = 'admin';   -- admin@mkebalaobarbearia.com.br
UPDATE barbers SET user_id = '4393babc-bc77-49b6-88bf-8ab8dc394c17' WHERE slug = 'maikon';  -- mk@mkebalaobarbearia.com.br
UPDATE barbers SET user_id = '20ddba51-e681-421f-9ff0-8e9abbe5aef5' WHERE slug = 'gabriel'; -- gabriel@mkebalaobarbearia.com.br
UPDATE barbers SET user_id = 'e5f59eef-53c8-40fe-a36b-6c73734ce54e' WHERE slug = 'daniel';  -- daniel@mkebalaobarbearia.com.br

-- Verificação
SELECT b.name, b.slug, b.role, u.email, b.user_id IS NOT NULL AS vinculado
FROM barbers b
LEFT JOIN auth.users u ON u.id = b.user_id
ORDER BY b.sort_order;
